import { supabase } from '$lib/sb/sb';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
