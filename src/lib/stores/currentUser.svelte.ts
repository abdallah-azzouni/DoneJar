import { supabase } from '$lib/sb/sb';
import type { Session } from '@supabase/supabase-js';

export const sessionStore = $state<{ current: Session | null }>({
	current: null
});

supabase.auth.getSession().then(({ data }) => {
	sessionStore.current = data.session;
});

supabase.auth.onAuthStateChange(async (_event, session) => {
	sessionStore.current = session;
});
