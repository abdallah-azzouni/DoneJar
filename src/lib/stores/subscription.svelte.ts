// subscriptionStore.svelte.ts
import { supabase } from '$lib/sb/sb';

export type subscription = {
	id: string;
	user_id: string;
	provider_customer_id: string;
	provider_subscription_id: string;
	plan: string;
	status: string;
	current_period_end: string;
	created_at: string;
	updated_at: string;
};

const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

type CachedSub = { data: subscription; cachedAt: number };

// isReady = "have we completed our first load attempt this session".
// Purely a lifecycle/UI-rendering flag
let isReady = $state(false);

function cacheKey(userId: string) {
	return `sub_cache_${userId}`;
}

function readCache(userId: string): subscription | null {
	try {
		const raw = localStorage.getItem(cacheKey(userId));
		if (!raw) return null;
		const { data, cachedAt }: CachedSub = JSON.parse(raw);
		if (Date.now() - cachedAt > CACHE_TTL) return null;
		return data;
	} catch {
		return null;
	}
}

function writeCache(userId: string, sub: subscription) {
	localStorage.setItem(cacheKey(userId), JSON.stringify({ data: sub, cachedAt: Date.now() }));
}

export function clearSubCache(userId: string) {
	isReady = false;
	localStorage.removeItem(cacheKey(userId));
}

async function fetchSub(userId: string): Promise<subscription | null> {
	try {
		const { data, error } = await supabase.from('user_subscriptions').select('*').single();
		if (error || !data) return null;
		writeCache(userId, data);
		return data;
	} catch (error) {
		console.error('Error fetching subscription:', error);
		return null;
	} finally {
		isReady = true;
	}
}

let sub = $state<subscription | null>(null);

export const subscriptionStore = {
	get current() {
		return sub;
	},
	get isPro() {
		return sub?.plan === 'pro' && sub?.status === 'active';
	},
	get isReady() {
		return isReady;
	},

	async load(userId: string) {
		const cached = readCache(userId);
		if (cached) {
			sub = cached;
			return;
		}
		sub = await fetchSub(userId);
	},

	async refresh(userId: string) {
		// call this after a checkout/upgrade
		clearSubCache(userId);
		sub = await fetchSub(userId);
	}
};
