import { pb } from '$lib/pb/pb';

export async function login(email: string, password: string) {
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

export function logout() {
	pb.authStore.clear();
}

export function isLoggedIn() {
	return pb.authStore.isValid;
}
