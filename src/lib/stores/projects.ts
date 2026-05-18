import { liveQuery } from 'dexie';
import { readable } from 'svelte/store';
import { browser } from '$app/environment';
import { projectRepository } from '$lib/db/dal';
import { currentProject } from '$lib/stores/currentProject';
import { get } from 'svelte/store';
import type { Project } from '$lib/types';

export const projects = readable<Project[]>([], (set) => {
	if (!browser) return;

	const subscription = liveQuery(() => projectRepository.getAll()).subscribe({
		next(all) {
			set(all);

			// sync currentProject
			const currentId = get(currentProject)?.id;
			if (currentId) {
				const updated = all.find((p) => p.id === currentId);
				currentProject.set(updated ?? null);
			}
		},
		error(err) {
			console.error('liveQuery error:', err);
		}
	});

	return () => subscription.unsubscribe();
});
