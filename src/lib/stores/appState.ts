import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';

export const isLoaded = writable(false);

export const isLocal = persisted('isLocal', false);

if (browser) {
	isLoaded.set(true);
}
