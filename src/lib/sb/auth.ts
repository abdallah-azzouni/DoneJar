import { supabase } from '$lib/sb/sb';

export async function signIn(email: string, password: string) {
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	return { data, error };
}

export async function signUp(email: string, display_name: string, password: string) {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: { data: { display_name } }
	});
	return { data, error };
}

/**
 * Handle signing out and clearing local DB.
 *
 */
export async function signOut(scope: 'local' | 'global' = 'local') {
	const { error } = await supabase.auth.signOut({ scope });
	return { error };
}

export async function sendPasswordResetEmail(email: string) {
	const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `https://www.donejar.app/auth/reset-password`
	});
	return { data, error };
}

export async function changePassword(newPassword: string, currentPassword?: string) {
	const payload: { password: string; current_password?: string } = { password: newPassword };
	if (currentPassword !== undefined) {
		payload.current_password = currentPassword;
	}
	const { data, error } = await supabase.auth.updateUser(payload);
	return { data, error };
}
