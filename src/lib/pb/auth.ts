import { pb } from '$lib/pb/pb';
import { clearDatabase } from '$lib/db/dal';
import { isLocal } from '$lib/stores/appState';

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
	await clearDatabase(); // Clear local data on logout
	pb.authStore.clear();
}

export function isLoggedIn() {
	return pb.authStore.isValid;
}
