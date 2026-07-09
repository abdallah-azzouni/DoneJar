import { projectService } from '$lib/db/dal';
import type { ProjectDocType } from '$lib/db/schemas';
import { notify } from './notificationStore';
import { failure } from '$lib/types';

function createProjectStore() {
	const state = $state<{
		projects: ProjectDocType[];
		selectedId: string | null;
		isReady: boolean;
	}>({
		projects: [],
		selectedId: null,
		isReady: false
	});
	let sub: { unsubscribe: () => void } | null = null;

	return {
		get projects() {
			return state.projects;
		},
		get current() {
			return state.projects.find((p) => p.id === state.selectedId) ?? null;
		},
		get isReady() {
			return state.isReady;
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
					state.isReady = true;
					if (state.selectedId && !data.find((p) => p.id === state.selectedId)) {
						state.selectedId = null;
					}
				},
				error: (err) => {
					notify(failure(`projectStore error: ${err.message}`));
					state.isReady = true;
				}
			});
		},
		reset: () => {
			sub?.unsubscribe();
			sub = null;
			state.projects.length = 0;
			state.selectedId = null;
			state.isReady = false;
		}
	};
}

export const projectStore = createProjectStore();
