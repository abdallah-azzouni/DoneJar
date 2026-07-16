import { isReplicating, startReplication, stopReplication } from '$lib/sb/replication.svelte';
import { getAppState } from '$lib/stores/appState.svelte';
import { clearDatabase } from '$lib/db/dal';
import { initDb, isDbReady, resetDb } from '$lib/db/db.svelte';
import { projectStore } from './stores/projects.svelte';
import { projectMembersStore } from './stores/projectMembers.svelte';
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
					'Project Members Loading': projectMembersStore.loading,
					'User Sessions Loading': userSessionsStore.loading,
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
			projectMembersStore.reset();
			projectStore.reset();
			(async () => {
				try {
					if (replicating) {
						await stopReplication();
					}
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
					projectMembersStore.initialize(userId);
					if (!userSessionsStore.loading && !validSession) {
						sessionStore.current = null;
					}
				}
			}

			if (dbReady && state === 'LOGGED_IN' && !replicating && !projectMembersStore.loading)
				startReplication();
		}
	});
}
