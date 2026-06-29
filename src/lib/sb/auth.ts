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
export async function signOut() {
	const { error } = await supabase.auth.signOut({ scope: 'local' });
	return { error };
}

export async function sendPasswordResetEmail(email: string) {
	const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${window.location.origin}/auth/reset-password`
	});
	return { data, error };
}

export async function confirmPasswordReset(newPassword: string) {
	const { data, error } = await supabase.auth.updateUser({ password: newPassword });
	return { data, error };
}
