import { startReplication, stopReplication } from '$lib/sb/replication';
import { supabase } from '$lib/sb/sb';
import { isDbReady } from '$lib/db/db';
import type { Session } from '@supabase/supabase-js';

export const sessionStore = $state<{ current: Session | null }>({
	current: null
});

supabase.auth.getSession().then(({ data }) => {
	sessionStore.current = data.session;
});

supabase.auth.onAuthStateChange(async (_event, session) => {
	sessionStore.current = session;

	if (!isDbReady()) return;

	if (session) {
		await startReplication();
	} else {
		await stopReplication();
	}
});
