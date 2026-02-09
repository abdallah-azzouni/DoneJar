import { browser } from '$app/environment';
import { persisted } from 'svelte-persisted-store';
import { derived } from 'svelte/store';

export const isLoaded = persisted('isLoaded', false);

if (browser) {
	if (document.readyState === 'complete') {
		isLoaded.set(true);
	} else {
		window.addEventListener('load', () => isLoaded.set(true));
	}
}

export interface Note {
	id: string;
	title: string;
	color: string;
	description: string;
	projectId: string;
}

export interface Project {
	id: string;
	name: string;
	color: string;
	columns: {
		todo: Note[];
		doing: Note[];
		done: Note[];
	};
}

export const userNotes = persisted('userNotes', {
	activeProjectId: <string | null>'',
	projects: <Project[]>[]
});

export const currentProject = derived(
	userNotes,
	($un) => $un.projects.find((p) => p.id === $un.activeProjectId)!
);
