import { pb } from '$lib/pb/pb';
import { clearDatabase } from '$lib/db/dal';
import { isLocal, serverVersion } from '$lib/stores/appState';
import { failure, success, type ActionResult } from '$lib/types';

export async function login(email: string, password: string) {
	isLocal.set(false); // Set to false on login attempt
	const userData = await pb.collection('users').authWithPassword(email, password);
	return userData;
}

export async function register(email: string, password: string, name: string) {
	const userData = await pb.collection('users').create({
		email,
		password,
		passwordConfirm: password,
		name,
		serverVersion: 1
	});
	return userData;
}

export async function resetPassword(email: string): Promise<boolean> {
	return await pb.collection('users').requestPasswordReset(email);
}

export async function logout() {
	// reset local state and clear database
	isLocal.set(false);
	serverVersion.set(0);
	await clearDatabase(); // Clear local data on logout
	pb.authStore.clear();
}

export function isLoggedIn() {
	return pb.authStore.isValid;
}

export function guardSync(): ActionResult {
	if (typeof navigator !== 'undefined' && !navigator.onLine) return failure('offline');
	if (!pb.authStore.isValid) return failure('unauthenticated');
	return success('ok');
}
