import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { projectRepository } from '$lib/db/dal';
import type { Project } from '$lib/types';
import { currentProject } from '$lib/stores/currentProject';
import { get } from 'svelte/store';

export const projects = writable<Project[]>([]);

export async function refreshProjects() {
	const all = await projectRepository.getAll();
	projects.set(all);

	// also sync currentProject if one is active
	const currentId = get(currentProject)?.id;
	if (currentId) {
		const updated = all.find((p) => p.id === currentId);
		currentProject.set(updated ?? null);
	}
}

if (browser) {
	refreshProjects();
}
