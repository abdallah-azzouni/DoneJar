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
	let sub: { unsubscribe: () => void } | null = null;

	return {
		get projects() {
			return state.projects;
		},
		get current() {
			return state.projects.find((p) => p.id === state.selectedId) ?? null;
		},
		select: (id: string | null) => {
			state.selectedId = id;
		},
		init: () => {
			if (sub) return;
			sub = projectService.observeAll().subscribe({
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
		}
	};
}

export const projectStore = createProjectStore();
