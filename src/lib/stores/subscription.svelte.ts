import { supabase } from '$lib/sb/sb';
import { getAppState, UserState } from './appState.svelte';

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
let isLoading = $state(false);
let sub = $state<subscription | null>(null);
let lastFetchedAt = 0;

function cacheKey(userId: string) {
	return `sub_cache_${userId}`;
}

// Returns hit: true even when cached data is null (free user)
function readCache(userId: string): { hit: boolean; data: subscription | null } {
	try {
		const raw = localStorage.getItem(cacheKey(userId));
		if (!raw) return { hit: false, data: null };
		const { data, cachedAt }: CachedSub = JSON.parse(raw);
		if (Date.now() - cachedAt > CACHE_TTL) return { hit: false, data: null };
		return { hit: true, data };
	} catch {
		return { hit: false, data: null };
	}
}

function writeCache(userId: string, sub: subscription) {
	localStorage.setItem(cacheKey(userId), JSON.stringify({ data: sub, cachedAt: Date.now() }));
}

export function clearSubCache(userId: string) {
	localStorage.removeItem(cacheKey(userId));
}

async function fetchSub(userId: string): Promise<subscription | null> {
	try {
		const { data, error } = await supabase
			.from('user_subscriptions')
			.select('*')
			.eq('user_id', userId)
			.maybeSingle();

		if (error) {
			console.error('Error fetching subscription:', error);
			return null;
		}

		writeCache(userId, data);
		return data;
	} catch (error) {
		console.error('Error fetching subscription:', error);
		return null;
	}
}

export const subscriptionStore = {
	get current() {
		return sub;
	},
	get isPro() {
		if (!sub || sub.plan !== 'pro') return false;
		const validStatus = sub.status === 'active' || sub.status === 'trialing';
		const notExpired = Date.parse(sub.current_period_end) > Date.now();
		// We are allowing guest users to have pro features
		// because there data is not synced with supabase, Therefor there is no hosting costs.
		return (validStatus && notExpired) || getAppState() === UserState.GUEST_LOCAL;
	},
	get isReady() {
		return isReady;
	},
	get isLoading() {
		return isLoading;
	},

	async load(userId: string) {
		if (isLoading) return;

		const isStale = Date.now() - lastFetchedAt > CACHE_TTL;
		if (isReady && !isStale) return;

		if (!isReady) {
			const cache = readCache(userId);
			if (cache.hit) {
				sub = cache.data;
				isReady = true;
				lastFetchedAt = Date.now();
				return;
			}
		}

		isLoading = true;
		try {
			sub = await fetchSub(userId);
			lastFetchedAt = Date.now();
			isReady = true;
		} catch (error) {
			console.error('Error loading subscription:', error);
		} finally {
			isLoading = false;
		}
	},

	async refresh(userId: string) {
		// call this after a checkout/upgrade
		clearSubCache(userId);
		isReady = false;
		isLoading = false;
		await this.load(userId);
	},

	reset() {
		isReady = false;
		isLoading = false;
		sub = null;
		lastFetchedAt = 0;

		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key?.startsWith('sub_cache_')) {
				localStorage.removeItem(key);
			}
		}
	}
};
