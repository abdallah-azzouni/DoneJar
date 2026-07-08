import { isReplicating, startReplication, stopReplication } from '$lib/sb/replication.svelte';
import { getAppState } from '$lib/stores/appState.svelte';
import { clearDatabase } from '$lib/db/dal';
import { initDb, isDbReady, resetDb } from '$lib/db/db.svelte';
import { projectStore } from './stores/projects.svelte';
import { projectMembersStore } from './stores/projectMembers.svelte';
import { sessionStore } from '$lib/stores/currentUser.svelte';
import { projectColumnsStore } from './stores/projectColumnsStore.svelte';
import { dev } from '$app/environment';
import { untrack } from 'svelte';

let cleaning = false;
export function initLifecycle() {
	$effect(() => {
		const state = getAppState();
		const dbReady = isDbReady();
		const replicating = isReplicating();
		const userId = sessionStore.current?.user?.id;

		if (dev) {
			untrack(() => {
				console.log(
					'[lifecycle] state:',
					state,
					'dbReady:',
					dbReady,
					'isReplicating:',
					replicating,
					'projectMembersLoading:',
					projectMembersStore.loading,
					'userId:',
					userId,
					'cleaning:',
					cleaning
				);
			});
		}

		if (state === 'LOGGED_OUT' && !cleaning) {
			cleaning = true;
			projectMembersStore.reset();
			(async () => {
				try {
					if (replicating) {
						await stopReplication();
						await clearDatabase();
						resetDb();
					} else {
						await clearDatabase();
						resetDb();
					}
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
				projectColumnsStore.init();

				if (state === 'LOGGED_IN' && userId) {
					projectMembersStore.initialize(userId);
				}
			}

			if (dbReady && state === 'LOGGED_IN' && !replicating && !projectMembersStore.loading)
				startReplication();
		}
	});
}
