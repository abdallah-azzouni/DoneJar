import {
	replicateSupabase,
	type RxSupabaseReplicationState
} from 'rxdb/plugins/replication-supabase';
import { supabase } from '$lib/sb/sb';
import { db } from '$lib/db/db.svelte';
import { SvelteMap } from 'svelte/reactivity';
import { projectMembersStore } from '$lib/stores/projectMembers.svelte';
import { noteRepository, attachmentRepository } from '$lib/db/dal';

type CollectionName = 'projects' | 'columns' | 'notes' | 'attachments';

// disable any linting because the replication code is generic.
/* eslint-disable @typescript-eslint/no-explicit-any */

const replicationStates = new SvelteMap<CollectionName, RxSupabaseReplicationState<any>>();

function stripNullsAndModified(doc: any) {
	const { _modified, ...rest } = doc;
	Object.keys(rest).forEach((key) => {
		if (rest[key] === null) delete rest[key];
	});
	return rest;
}

type CollectionConfig = {
	tableName: string;
	pullModifier?: (doc: any) => any;
	pushModifier?: (doc: any) => any;
};

const COLLECTION_CONFIGS: Record<CollectionName, CollectionConfig> = {
	projects: {
		tableName: 'projects',
		pullModifier: (doc) => {
			const { _modified, ...rest } = doc;
			return stripNullsAndModified(rest);
		}
	},
	columns: {
		tableName: 'columns',
		pullModifier: (doc) => {
			const { _modified, ...rest } = doc;
			return stripNullsAndModified(rest);
		},
		pushModifier: (doc) => {
			const members = projectMembersStore.getMembersForProject(doc.projectId);
			if (members.length == 0)
				// to avoid unnecessary RLS checks.
				throw Object.assign(new Error('AWAITING_PROJECT_MEMBERS'), {
					code: 'AWAITING_PROJECT_MEMBERS'
				});
			return doc;
		}
	},
	notes: {
		tableName: 'notes',
		pullModifier: (doc) => {
			const { _modified, ...rest } = doc;
			return stripNullsAndModified(rest);
		},
		pushModifier: async (doc) => {
			const projectId = await noteRepository.getProjectId(doc.id);

			const members = projectMembersStore.getMembersForProject(projectId || '');
			if (members.length == 0)
				// to avoid unnecessary RLS checks.
				throw Object.assign(new Error('AWAITING_PROJECT_MEMBERS'), {
					code: 'AWAITING_PROJECT_MEMBERS'
				});

			return doc;
		}
	},
	attachments: {
		tableName: 'attachments',
		pullModifier: (doc) => {
			const { _modified, ...rest } = doc;
			return stripNullsAndModified(rest);
		},
		pushModifier: async (doc) => {
			const projectId = await attachmentRepository.getProjectId(doc.id);

			const members = projectMembersStore.getMembersForProject(projectId || '');
			if (members.length == 0)
				// to avoid unnecessary RLS checks.
				throw Object.assign(new Error('AWAITING_PROJECT_MEMBERS'), {
					code: 'AWAITING_PROJECT_MEMBERS'
				});

			return doc;
		}
	}
};

const replicationState = $state({ active: false });
export const isReplicating = () => replicationState.active;

export function reSyncAll() {
	if (!isReplicating()) return; // nothing to resync if replication isn't running

	const targets: CollectionName[] = ['columns', 'notes', 'attachments'];

	for (const name of targets) {
		const state = replicationStates.get(name);
		if (state) {
			state.reSync();
		} else {
			console.warn(`[replication] Cannot reSync "${name}" — no active replication state.`);
		}
	}
}

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
				} else if (String((err as any)?.code) === 'AWAITING_PROJECT_MEMBERS') {
					console.warn(`[replication:${name}] Push rejected. Retrying membership sync...`);
					return; // expected, self-heals via reSyncAll() on membership sync
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
