import { supabase } from '$lib/sb/sb';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { reSyncAll } from '$lib/sb/replication.svelte';
import { projectRepository } from '$lib/db/dal';
import { SvelteSet } from 'svelte/reactivity';

export type ProjectMember = {
	projectId: string;
	userId: string;
	role: 'owner' | 'editor' | 'viewer' | 'deleted';
	createdAt: string;
	updatedAt: string;
};

let members = $state<ProjectMember[]>([]);
let loading = $state<boolean>(false);
let error = $state<string | null>(null);

let channel: RealtimeChannel | null = null;
let currentUserId: string | null = null;

async function initialize(userId: string) {
	if (currentUserId === userId) return;

	currentUserId = userId;
	loading = true;
	error = null;

	const { data, error: fetchError } = await supabase
		.from('project_members')
		.select('*')
		.eq('userId', userId);

	if (fetchError) {
		error = fetchError.message;
		loading = false;
		return;
	}
	if (data) {
		members = data as ProjectMember[];
		const deleted_rows = members.filter((m) => m.role === 'deleted');
		for (const deleted of deleted_rows) {
			purgeDeletedMembership(deleted.projectId, deleted.userId);
		}
	}
	loading = false;

	if (channel) supabase.removeChannel(channel);

	channel = supabase
		.channel(`project-members-${userId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'project_members',
				filter: `userId=eq.${userId}` // Keep updates scoped to this user
			},
			(payload) => {
				const { eventType, new: newRow, old: oldRow } = payload;

				if (eventType != 'DELETE' && !newRow) {
					console.error('Received null newRow for non-DELETE event:', payload);
					return;
				}

				if (
					eventType != 'DELETE' &&
					(newRow as ProjectMember).userId === currentUserId &&
					(newRow as ProjectMember).role === 'deleted'
				) {
					const targetProject = newRow as ProjectMember;
					purgeDeletedMembership(targetProject.projectId, targetProject.userId)
						.then((result) => {
							if (result.success) {
								// Optional: Trigger a UI state refresh or notification here
							} else {
								console.error(`Purge failed: ${result.error}`);
								// Optional: Show an error toast to the user
							}
						})
						.catch((criticalErr) => {
							// Catch any catastrophic unhandled rejections
							console.error('Critical failure in purge chain:', criticalErr);
						});
				}

				if (eventType === 'INSERT') {
					members = [...members, newRow as ProjectMember];
					// IMPORTANT: this manual reSyncAll() call is load-bearing, not a redundant safety net.
					// Empirically verified (July 2026): when pushModifier throws to reject a doc
					// (e.g. project-membership push guard), RxDB does NOT automatically retry
					// that push once conditions change. Tested explicitly:
					//   - pushModifier returning null: doc is silently dropped from sync, never retried.
					//   - pushModifier throwing, WITH manual reSyncAll() on membership insert: doc
					//     correctly re-offered to pushModifier and syncs.
					//   - pushModifier throwing, WITHOUT calling reSyncAll(): doc never syncs, indefinitely.
					// This may relate to known pushModifier bugs in RxDB's Supabase replication plugin
					// (see https://github.com/pubkey/rxdb/issues/7513 — push.modifier was at one point
					// not applied at all). Did not find documentation describing intended retry behavior
					// for pushModifier-thrown rejections specifically — this comment IS the documentation.
					// Do not remove this call assuming RxDB will self-heal; it won't, at least not on the
					// RxDB version tested against.
					if ((newRow as ProjectMember).userId === currentUserId) {
						reSyncAll();
					}
				} else if (eventType === 'UPDATE') {
					const updatedRow = newRow as ProjectMember;
					members = members.map((m) =>
						m.userId === updatedRow.userId && m.projectId === updatedRow.projectId ? updatedRow : m
					);
				} else if (eventType === 'DELETE') {
					const deletedRow = oldRow as ProjectMember;
					members = members.filter(
						(m) => !(m.userId === deletedRow.userId && m.projectId === deletedRow.projectId)
					);
				}
			}
		)
		.subscribe();
}

function getMembersForProject(projectId: string) {
	return members.filter((m) => m.projectId === projectId);
}

function getMemberRole(projectId: string, userId: string) {
	const member = members.find((m) => m.projectId === projectId && m.userId === userId);
	return member ? member.role : null;
}

const activePurges = new SvelteSet<string>();
async function purgeDeletedMembership(
	projectId: string,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	if (!projectId || !userId) {
		console.error('Purge aborted: Missing projectId or userId');
		return { success: false, error: 'Invalid inputs provided.' };
	}

	const lockKey = `${projectId}-${userId}`;
	if (activePurges.has(lockKey)) {
		console.warn(`Purge already in progress for key: ${lockKey}. Ignoring duplicate request.`);
		return { success: false, error: 'Operation already in progress.' };
	}
	activePurges.add(lockKey);

	try {
		await projectRepository.deleteFullProject(projectId);

		return { success: true };
	} catch (err: unknown) {
		console.error('Unexpected failure during purge:', err);
		const errorMessage = err instanceof Error ? err.message : 'Failed to purge local project data.';
		return { success: false, error: errorMessage };
	} finally {
		activePurges.delete(lockKey);
	}
}

function reset() {
	if (channel) {
		supabase.removeChannel(channel);
		channel = null;
	}
	members = [];
	currentUserId = null;
	error = null;
	loading = false;
}

export const projectMembersStore = {
	get allMembers() {
		return members;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	initialize,
	getMembersForProject,
	getMemberRole,
	reset
};
