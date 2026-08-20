import { isReplicating, startReplication, stopReplication } from '$lib/sb/replication.svelte';
import { getAppState, UserState } from '$lib/stores/appState.svelte';
import { clearDatabase } from '$lib/db/dal';
import { initDb, isDbReady, isDbLoading, isDbFailed, resetDb } from '$lib/db/db.svelte';
import { projectStore } from './stores/projects.svelte';
import { userSessionsStore } from './stores/userSessionsStore.svelte';
import { subscriptionStore } from './stores/subscription.svelte';
import { sessionStore } from '$lib/stores/currentUser.svelte';
import { dev } from '$app/environment';
import { untrack } from 'svelte';

let cleaning = false;
export function initLifecycle() {
	$effect(() => {
		const state = getAppState();
		const dbReady = isDbReady();
		const dbLoading = isDbLoading();
		const dbFailed = isDbFailed();
		const replicating = isReplicating();
		const userId = sessionStore.current?.user?.id;
		const validSession = userSessionsStore.isValid;

		if (dev) {
			untrack(() => {
				console.table({
					'Lifecycle State': state,
					'DB Ready': dbReady,
					'DB Loading': dbLoading,
					'Is Replicating': replicating,
					'User Sessions Ready': userSessionsStore.isReady,
					'User Sessions Valid': validSession,
					'Project Store Ready': projectStore.isReady,
					'Subscription Store Ready': subscriptionStore.isReady,
					'User ID': userId ? userId.substring(0, 3) + '...' + userId.slice(-3) : null,
					Cleaning: cleaning
				});
			});
		}
		if ((state === UserState.LOGGED_OUT || dbFailed) && !cleaning) {
			cleaning = true;

			if (state === UserState.LOGGED_OUT) {
				userSessionsStore.reset();
			}

			projectStore.reset();
			subscriptionStore.reset();
			(async () => {
				try {
					if (replicating) {
						await stopReplication();
					}

					if (!dbFailed && getAppState() !== UserState.LOGGED_OUT) return;

					if (!dbFailed) {
						await clearDatabase();
					}

					resetDb();
				} catch (error) {
					console.error('Error during cleanup:', error);
				} finally {
					cleaning = false;
				}
			})();
		} else if ((state === UserState.LOGGED_IN || state === UserState.GUEST_LOCAL) && !cleaning) {
			if (!dbReady) initDb();

			if (dbReady) {
				projectStore.init();

				if (state === UserState.LOGGED_IN && userId) {
					userSessionsStore.initialize(userId);
					if (userSessionsStore.isReady) {
						if (!validSession) sessionStore.current = null;
						if (!subscriptionStore.isLoading) {
							subscriptionStore.load(userId);
						}
					}
				}
			}

			if (dbReady && state === UserState.LOGGED_IN && !replicating) {
				startReplication();
			}
		}
	});
}
