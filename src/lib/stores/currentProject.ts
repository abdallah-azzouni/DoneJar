import { writable, derived } from 'svelte/store';
import { projects } from './userData';

export const currentProjectId = writable<string | null>(null);

export const currentProject = derived(
	[projects, currentProjectId],
	([$projects, $id]) => $projects.find((p) => p.id === $id) ?? null
);
