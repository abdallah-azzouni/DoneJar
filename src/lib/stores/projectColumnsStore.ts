import { liveQuery } from 'dexie';
import { readable } from 'svelte/store';
import { columnRepository, projectRepository } from '$lib/db/dal';
import type { ProjectWithColumns } from '$lib/types';
import { notify } from './notificationStore';

export function createProjectColumnsStore() {
	return readable<ProjectWithColumns[]>([], (set) => {
		const subscription = liveQuery(async () => {
			const allProjects = await projectRepository.getAll();
			return await Promise.all(
				allProjects.map(async (p) => ({
					...p,
					columns: await columnRepository.getByProjectId(p.id)
				}))
			);
		}).subscribe({
			next: set,
			error: (err) => notify({ type: 'error', message: String(err) })
		});

		return () => subscription.unsubscribe();
	});
}
