import { isReplicating, startReplication, stopReplication } from '$lib/sb/replication.svelte';
import { getAppState } from '$lib/stores/appState.svelte';
import { clearDatabase } from '$lib/db/dal';
import { initDb, isDbReady, resetDb } from '$lib/db/db.svelte';
import { projectStore } from './stores/projects.svelte';
import { projectColumnsStore } from './stores/projectColumnsStore.svelte';
import { dev } from '$app/environment';
import { untrack } from 'svelte';

export function initLifecycle() {
	$effect(() => {
		const state = getAppState();
		const dbReady = isDbReady();
		const replicating = isReplicating();

		if (dev) {
			untrack(() => {
				console.log(
					'[lifecycle] state:',
					state,
					'dbReady:',
					dbReady,
					'isReplicating:',
					replicating
				);
			});
		}

		if (state === 'LOGGED_OUT') {
			if (replicating)
				stopReplication().then(() => {
					if (dbReady) clearDatabase().then(resetDb).catch(console.error);
				});
			else {
				clearDatabase().then(resetDb).catch(console.error);
			}
		} else if (state === 'LOGGED_IN' || state === 'GUEST_LOCAL') {
			if (!dbReady) initDb();

			if (dbReady) {
				projectStore.init();
				projectColumnsStore.init();
			}

			if (dbReady && state === 'LOGGED_IN' && !replicating) startReplication();
		}
	});
}
