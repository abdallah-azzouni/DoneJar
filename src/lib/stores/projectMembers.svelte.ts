import { supabase } from '$lib/sb/sb';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { reSyncAll } from '$lib/sb/replication.svelte';

export type ProjectMember = {
	projectId: string;
	userId: string;
	role: 'owner' | 'editor' | 'viewer';
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
					members = members.map((m) =>
						m.userId === (newRow as ProjectMember).userId ? (newRow as ProjectMember) : m
					);
				} else if (eventType === 'DELETE') {
					members = members.filter((m) => m.userId !== (oldRow as ProjectMember).userId);
				}
			}
		)
		.subscribe();
}

function getMembersForProject(projectId: string) {
	return members.filter((m) => m.projectId === projectId);
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
	reset
};
