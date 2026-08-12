import { supabase } from '$lib/sb/sb';
import { failure } from '$lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { notify } from './notificationStore';
import { currentSessionId } from './currentUser.svelte';

export type UserSession = {
	session_id: string;
	user_id: string;
	created_at: string;
	updated_at: string;
	country_code: string | null;
	user_agent: string;
	isKicking?: boolean;
};

let sessions = $state<UserSession[]>([]);
let isReady = $state<boolean>(false);
let error = $state<string | null>(null);

let channel: RealtimeChannel | null = null;
let currentUserId: string | null = null;

const isValid = $derived.by(() => {
	const myId = currentSessionId();
	return sessions.some((s) => s.session_id === myId);
});

async function initialize(userId: string) {
	if (currentUserId === userId) return;

	currentUserId = userId;

	try {
		const { data, error: fetchError } = await supabase
			.from('user_sessions')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (fetchError) {
			error = fetchError.message;
			isReady = false;
			return;
		}

		if (data) sessions = data as UserSession[];

		if (channel) supabase.removeChannel(channel);

		channel = supabase
			.channel(`user-sessions-${userId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'user_sessions',
					filter: `user_id=eq.${userId}`
				},
				(payload) => {
					const { eventType, new: newRow, old: oldRow } = payload;
					if (eventType === 'INSERT') {
						sessions = [newRow as UserSession, ...sessions];
					} else if (eventType === 'DELETE') {
						sessions = sessions.filter((s) => s.session_id !== oldRow.session_id);
					}
				}
			)
			.subscribe();
	} catch (err) {
		console.error('Error initializing user sessions store:', err);
	} finally {
		isReady = true;
	}
}

async function kickDevice(sessionId: string) {
	const session = sessions.find((s) => s.session_id === sessionId);
	if (session) session.isKicking = true;

	// When we delete row, trigger will delete row from auth.sessions table and RLS will instantly guard access.
	const { error } = await supabase.from('user_sessions').delete().eq('session_id', sessionId);

	if (error) {
		notify(failure('Failed to kick device. Please try again.'));
		if (session) session.isKicking = false;
		throw error;
	}
}

function reset() {
	if (channel) {
		supabase.removeChannel(channel);
		channel = null;
	}
	sessions = [];
	currentUserId = null;
	error = null;
	isReady = false;
}

export const userSessionsStore = {
	get allSessions() {
		return sessions;
	},
	get isReady() {
		return isReady;
	},
	get error() {
		return error;
	},
	initialize,
	kickDevice,
	get isValid() {
		return isValid;
	},
	reset
};
