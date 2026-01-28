import { browser } from '$app/environment';
import { persisted } from 'svelte-persisted-store';

export const isLoaded = persisted('isLoaded', false);

if (browser) {
	if (document.readyState === 'complete') {
		isLoaded.set(true);
	} else {
		window.addEventListener('load', () => isLoaded.set(true));
	}
}

export interface Project {
	id: string;
	name: string;
	color: string;
	columns: {
		todo: { title: string; color: string }[];
		doing: { title: string; color: string }[];
		done: { title: string; color: string }[];
	};
}

export const userNotes = persisted('userNotes', {
	activeProjectId: <string | null>'',
	projects: <Project[]>[]
});
