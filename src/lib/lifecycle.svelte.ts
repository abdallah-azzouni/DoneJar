import { isReplicating, startReplication, stopReplication } from '$lib/sb/replication.svelte';
import { getAppState } from '$lib/stores/appState.svelte';
import { clearDatabase } from '$lib/db/dal';
import { initDb, isDbReady, resetDb } from '$lib/db/db.svelte';
import { projectStore } from './stores/projects.svelte';
import { userSessionsStore } from './stores/userSessionsStore.svelte';
import { sessionStore } from '$lib/stores/currentUser.svelte';
import { dev } from '$app/environment';
import { untrack } from 'svelte';

let cleaning = false;
export function initLifecycle() {
	$effect(() => {
		const state = getAppState();
		const dbReady = isDbReady();
		const replicating = isReplicating();
		const userId = sessionStore.current?.user?.id;
		const validSession = userSessionsStore.isValid;

		if (dev) {
			untrack(() => {
				console.table({
					'Lifecycle State': state,
					'DB Ready': dbReady,
					'Is Replicating': replicating,
					'User Sessions Ready': userSessionsStore.isReady,
					'User Sessions Valid': validSession,
					'Project Store Ready': projectStore.isReady,
					'User ID': userId ? userId.substring(0, 3) + '...' + userId.slice(-3) : null,
					Cleaning: cleaning
				});
			});
		}
		if (state === 'LOGGED_OUT' && !cleaning) {
			cleaning = true;
			userSessionsStore.reset();
			projectStore.reset();
			(async () => {
				try {
					if (replicating) {
						await stopReplication();
					}

					if (getAppState() !== 'LOGGED_OUT') return; // check if user logged in again during cleanup

					await clearDatabase();
					resetDb();
				} catch (error) {
					console.error('Error during cleanup:', error);
				} finally {
					cleaning = false;
				}
			})();
		} else if ((state === 'LOGGED_IN' || state === 'GUEST_LOCAL') && !cleaning) {
			if (!dbReady) initDb();

			if (dbReady) {
				projectStore.init();

				if (state === 'LOGGED_IN' && userId) {
					userSessionsStore.initialize(userId);
					if (userSessionsStore.isReady && !validSession) {
						sessionStore.current = null;
					}
				}
			}

			if (dbReady && state === 'LOGGED_IN' && !replicating) {
				startReplication();
			}
		}
	});
}
