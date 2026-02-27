import { browser } from '$app/environment';
import { persisted } from 'svelte-persisted-store';
import { derived } from 'svelte/store';
import Delta from 'quill-delta';

export const isLoaded = persisted('isLoaded', false);

if (browser) {
	if (document.readyState === 'complete') {
		isLoaded.set(true);
	} else {
		window.addEventListener('load', () => isLoaded.set(true));
	}
}

export interface NoteInterface {
	id: string;
	title: string;
	color: string;
	description: Delta;
	projectId: string;
	dueDate: { timestamp: number; hasTime: boolean } | null;
	createdAt: number;
	updatedAt: number;
}

export class Note implements NoteInterface {
	id: string;
	title: string;
	color: string;
	description: Delta;
	projectId: string;
	dueDate: { timestamp: number; hasTime: boolean } | null;
	createdAt: number;
	updatedAt: number;
	constructor(id = '', title = '', color = '', description = new Delta(), projectId = '') {
		this.id = id;
		this.title = title;
		this.color = color;
		this.description = description;
		this.projectId = projectId;
		this.dueDate = null;
		this.createdAt = 0;
		this.updatedAt = 0;
	}
}

export interface ProjectInterface {
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
	projects: <ProjectInterface[]>[]
});

export const currentProject = derived(
	userNotes,
	($un) => $un.projects.find((p) => p.id === $un.activeProjectId)!
);
