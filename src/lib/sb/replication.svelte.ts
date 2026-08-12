import {
	replicateSupabase,
	type RxSupabaseReplicationState
} from 'rxdb/plugins/replication-supabase';
import { supabase } from '$lib/sb/sb';
import { db } from '$lib/db/db.svelte';
import { SvelteMap } from 'svelte/reactivity';
import { sessionStore } from '$lib/stores/currentUser.svelte';

type CollectionName = 'projects' | 'columns' | 'notes' | 'attachments';

// disable "any" linting because the replication code is generic.
/* eslint-disable @typescript-eslint/no-explicit-any */

const replicationStates = new SvelteMap<CollectionName, RxSupabaseReplicationState<any>>();

function sanitizePulledDoc(doc: any) {
	const { _modified, userId, ...rest } = doc;
	return Object.fromEntries(Object.entries(rest).filter(([_, value]) => value !== null));
}

function preparePushedDoc(doc: any) {
	return { userId: sessionStore.current?.user.id, ...doc };
}

type CollectionConfig = {
	tableName: string;
	pullModifier?: (doc: any) => any;
	pushModifier?: (doc: any) => any;
};

const COLLECTION_CONFIGS: Record<CollectionName, CollectionConfig> = {
	projects: {
		tableName: 'projects',
		pullModifier: sanitizePulledDoc,
		pushModifier: preparePushedDoc
	},
	columns: {
		tableName: 'columns',
		pullModifier: sanitizePulledDoc,
		pushModifier: preparePushedDoc
	},
	notes: {
		tableName: 'notes',
		pullModifier: sanitizePulledDoc,
		pushModifier: preparePushedDoc
	},
	attachments: {
		tableName: 'attachments',
		pullModifier: sanitizePulledDoc,
		pushModifier: preparePushedDoc
	}
};

const replicationState = $state({ active: false });
export const isReplicating = () => replicationState.active;

export async function startReplication() {
	if (isReplicating()) return;
	replicationState.active = true;

	const database = await db();

	const starts = (Object.entries(COLLECTION_CONFIGS) as [CollectionName, CollectionConfig][]).map(
		async ([name, config]) => {
			const state = replicateSupabase({
				tableName: config.tableName,
				client: supabase, // same singleton — carries the auth token
				collection: database[name],
				replicationIdentifier: `${name}-supabase`,
				live: true,
				pull: {
					batchSize: 50,
					...(config.pullModifier ? { modifier: config.pullModifier } : {})
				},
				push: {
					batchSize: 50,
					...(config.pushModifier ? { modifier: config.pushModifier } : {})
				}
			});

			state.error$.subscribe((err) => {
				const params = err.parameters;

				const hasErrors = params && params.errors;
				const isRLSError =
					hasErrors &&
					// If it's an array, check if any error has a code/key matching '42501'
					((Array.isArray(params.errors) &&
						params.errors.some((e: any) => String(e.code || e.key) === '42501')) ||
						// If it's a single object (casted to any to bypass strict RxErrorKey mismatch)
						(!Array.isArray(params.errors) &&
							String((params.errors as any).code || (params.errors as any).key) === '42501'));

				// filter 42501 errors (permission denied) since they are expected when a user doesn't have access to a resource
				if (isRLSError) {
					console.warn(
						`[replication:${name}] Permission denied error (42501) during replication..`
					);
					return; // expected, self-heals via RxDB retry mechanism
				}
				console.error(`[replication:${name}]`, err);
			});

			replicationStates.set(name, state);
			return state;
		}
	);

	const states = await Promise.all(starts);

	await Promise.all(states.map((s) => s.awaitInitialReplication()));
}

export async function stopReplication() {
	if (!isReplicating()) return;
	replicationState.active = false;

	await Promise.all([...replicationStates.values()].map((s) => s.cancel()));
	replicationStates.clear();
}
