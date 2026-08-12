import { supabase } from '$lib/sb/sb';
import { type ActionResult } from '$lib/types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type ProjectInvite = {
	id: string;
	projectId: string;
	invitedBy: string;
	inviterEmail: string;
	targetEmail: string;
	targetId: string | null;
	role: 'owner' | 'editor' | 'viewer';
	status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
	createdAt: string; // ISO timestamp string from Postgres
	respondedAt: string | null;
};

let invites = $state<ProjectInvite[]>([]);
let loading = $state<boolean>(false);
let error = $state<string | null>(null);

let channel: RealtimeChannel | null = null;
let currentUserId: string | null = null;

export function handleRealtimePayload(payload: RealtimePostgresChangesPayload<ProjectInvite>) {
	const { eventType, new: newRow, old: oldRow } = payload;

	if (eventType === 'INSERT' && newRow) {
		const row = newRow as ProjectInvite;
		if (!invites.some((inv) => inv.id === row.id)) {
			invites = [...invites, row];
		}
	} else if (eventType === 'UPDATE' && newRow) {
		const updatedRow = newRow as ProjectInvite;
		invites = invites.map((inv) => (inv.id === updatedRow.id ? updatedRow : inv));
	} else if (eventType === 'DELETE' && oldRow) {
		const deletedRow = oldRow as ProjectInvite;
		invites = invites.filter((inv) => inv.id !== deletedRow.id);
	}
}

async function initialize(userId: string) {
	if (currentUserId === userId) return;

	currentUserId = userId;
	loading = true;
	error = null;

	const { data, error: fetchError } = await supabase
		.from('project_invites')
		.select('*')
		.eq('targetId', userId);

	if (fetchError) {
		error = fetchError.message;
		loading = false;
		return;
	}
	if (data) {
		invites = data as ProjectInvite[];
	}
	loading = false;

	if (channel) supabase.removeChannel(channel);

	channel = supabase
		.channel(`project-invites-${userId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'project_invites',
				filter: `targetId=eq.${userId}`
			},
			(payload) => handleRealtimePayload(payload as RealtimePostgresChangesPayload<ProjectInvite>)
		)
		.subscribe();
}

function upsertInvites(newInvites: ProjectInvite[]) {
	const existingIds = new Set(invites.map((inv) => inv.id));
	const toAdd = newInvites.filter((inv) => !existingIds.has(inv.id));

	invites = [...invites.map((inv) => newInvites.find((n) => n.id === inv.id) ?? inv), ...toAdd];
}

let loadProjectInvitesReady = $state(false);
async function loadProjectInvites(projectId: string): Promise<ActionResult> {
	try {
		const { data, error } = await supabase
			.from('project_invites')
			.select('*')
			.eq('projectId', projectId);

		if (!error && data) {
			upsertInvites(data as ProjectInvite[]);
		}
		return { type: 'success', message: 'Project invites loaded successfully' };
	} catch (e) {
		return { type: 'error', message: (e as Error).message };
	} finally {
		loadProjectInvitesReady = true;
	}
}

function getProjectInvites(projectId: string): ProjectInvite[] {
	return invites.filter((m) => m.projectId === projectId);
}

function getReceivedInvites(userId: string): ProjectInvite[] {
	return invites.filter((m) => m.targetId === userId);
}

function reset() {
	if (channel) {
		supabase.removeChannel(channel);
		channel = null;
	}
	invites = [];
	currentUserId = null;
	error = null;
	loading = false;
	loadProjectInvitesReady = false;
}

export const projectInvitesStore = {
	get allInvites() {
		return invites;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get loadProjectInvitesReady() {
		return loadProjectInvitesReady;
	},
	initialize,
	loadProjectInvites,
	getProjectInvites,
	getReceivedInvites,
	reset
};
