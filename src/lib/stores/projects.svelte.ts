import { projectService } from '$lib/db/dal';
import type { ProjectDocType } from '$lib/db/schemas';
import { notify } from './notificationStore';
import { failure } from '$lib/types';

function createProjectStore() {
	const state = $state<{
		projects: ProjectDocType[];
		selectedId: string | null;
	}>({
		projects: [],
		selectedId: null
	});

	projectService.observeAll().subscribe({
		next: (data) => {
			state.projects.length = 0;
			state.projects.push(...data);
			if (state.selectedId && !data.find((p) => p.id === state.selectedId)) {
				state.selectedId = null;
			}
		},
		error: (err) => {
			notify(failure(`projectStore error: ${err.message}`));
		}
	});

	return {
		get projects() {
			return state.projects;
		},
		get current() {
			return state.projects.find((p) => p.id === state.selectedId) ?? null;
		},
		select: (id: string | null) => {
			state.selectedId = id;
		}
	};
}

export const projectStore = createProjectStore();
