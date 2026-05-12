import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const isLoaded = writable(false);

if (browser) {
	isLoaded.set(true);
}
