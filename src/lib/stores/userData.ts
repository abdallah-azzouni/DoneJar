import { browser } from '$app/environment';
import { persisted } from 'svelte-persisted-store';
import { writable } from 'svelte/store';
import { notify } from './notificationStore';
import { failure, type Project } from '$lib/types';
import { isValidData } from '$lib/validators/dataValidators';

export const isLoaded = writable(false);

const defaultProjects = <Project[]>[];

/** Set when persisted project data fails validation or JSON parsing. */
export const corruptDataState = writable<{
	detected: boolean;
	errors: string | null;
	/** Raw JSON snapshot captured before the store resets, for user backup download. */
	rawSnapshot: string | null;
}>({ detected: false, errors: null, rawSnapshot: null });

export const projects = persisted('projects', defaultProjects, {
	beforeRead: (val) => {
		const result = isValidData(val);
		if (!result.valid) {
			corruptDataState.set({
				detected: true,
				errors: result.errors,
				rawSnapshot: JSON.stringify(val, null, 2)
			});
			return defaultProjects;
		}
		return val;
	},
	onWriteError: () => {
		notify(failure('Failed to save data. Storage may be full or unavailable.'));
	},
	onParseError: () => {
		if (browser) {
			// Read from localStorage now — before the persisted store writes the default back.
			corruptDataState.set({
				detected: true,
				errors: 'JSON parsing error',
				rawSnapshot: localStorage.getItem('projects')
			});
		}
	}
});

if (browser) {
	isLoaded.set(true);
}
