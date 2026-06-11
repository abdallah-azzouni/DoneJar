import { browser } from '$app/environment';
import { persisted } from 'svelte-persisted-store';

let isLoaded = $state(false);

export const isLocal = persisted('isLocal', false);

if (browser) {
	isLoaded = true;
}

export const appStore = {
	get isLoaded() {
		return isLoaded;
	}
};
