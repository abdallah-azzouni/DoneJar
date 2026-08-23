import { supabase } from '$lib/sb/sb';
import type { Session } from '@supabase/supabase-js';
import { browser } from '$app/environment';

let isRecoverySession = $state(false);
if (browser) {
	const hash = new URLSearchParams(window.location.hash.substring(1));
	if (hash.get('type') === 'recovery') {
		isRecoverySession = true;
	}
}

export const sessionStore = $state<{ current: Session | null | undefined }>({
	current: undefined
});

supabase.auth.getSession().then(({ data }) => {
	sessionStore.current = data.session;
});

supabase.auth.onAuthStateChange(async (event, session) => {
	if (event === 'PASSWORD_RECOVERY') {
		isRecoverySession = true;
	} else if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
		isRecoverySession = false;
	}
	sessionStore.current = session;
});

export const getIsRecovery = () => isRecoverySession;

export const currentSessionId = () =>
	sessionStore.current?.access_token
		? JSON.parse(atob(sessionStore.current.access_token.split('.')[1])).session_id
		: '';
