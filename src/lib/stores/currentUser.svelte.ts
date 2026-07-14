import { supabase } from '$lib/sb/sb';
import type { Session } from '@supabase/supabase-js';

export const sessionStore = $state<{ current: Session | null | undefined }>({
	current: undefined
});

supabase.auth.getSession().then(({ data }) => {
	sessionStore.current = data.session;
});

supabase.auth.onAuthStateChange(async (_event, session) => {
	sessionStore.current = session;
});

export const currentSessionId = () =>
	sessionStore.current?.access_token
		? JSON.parse(atob(sessionStore.current.access_token.split('.')[1])).session_id
		: '';
