import { browser } from '$app/environment';
import { sessionStore } from '$lib/stores/currentUser.svelte';
import { persisted } from 'svelte-persisted-store';

export const UserState = {
	LOGGED_IN: 'LOGGED_IN',
	LOGGED_OUT: 'LOGGED_OUT',
	GUEST_LOCAL: 'GUEST_LOCAL',
	UNKNOWN: 'UNKNOWN'
} as const;

const isGuestLocal = persisted('isGuestLocal', false);
let isGuestValue: boolean = $state(false); // translate svelte 4 to 5 runes to keep currentAppStates reactive

// keep both values synced.
isGuestLocal.subscribe((value) => {
	isGuestValue = value;
});

// Action for the UI to toggle local mode
export function goLocalMode() {
	isGuestLocal.set(true);
}
export function getIsGuestLocal() {
	return isGuestValue;
}

const currentAppState = $derived.by(() => {
	if (sessionStore.current === undefined) {
		return UserState.UNKNOWN;
	}

	if (sessionStore.current?.user) {
		if (isGuestValue !== false) {
			// Lazy check to save on storage writes.
			isGuestLocal.set(false);
		}
		return UserState.LOGGED_IN;
	}

	if (isGuestValue) {
		return UserState.GUEST_LOCAL;
	}

	return UserState.LOGGED_OUT;
});

export const getAppState = () => currentAppState;

export const appStore = {
	get isLoaded() {
		return browser && sessionStore.current !== undefined;
	}
};
