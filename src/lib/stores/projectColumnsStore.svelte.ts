import { projectService } from '$lib/db/dal';
import type { ProjectWithColumns } from '$lib/types';
import { notify } from './notificationStore';
import { failure } from '$lib/types';

export function createProjectColumnsStore() {
	let data = $state<ProjectWithColumns[]>([]);
	let isReady: boolean = $state(false);

	let sub: { unsubscribe: () => void } | null = null;

	return {
		get data() {
			return data;
		},
		get isReady() {
			return isReady;
		},

		init: () => {
			if (sub) return;
			const observable = projectService.observeProjectsWithColumns();

			sub = observable.subscribe({
				next: (res) => {
					data = res;
					isReady = true;
				},
				error: (err) => {
					notify(failure(`projectColumnsStore error: ${err.message}`));
					isReady = true;
				}
			});
		},
		destroy: () => sub?.unsubscribe(),
		reset: () => {
			sub?.unsubscribe();
			sub = null;
			data = [];
			isReady = false;
		}
	};
}

export const projectColumnsStore = createProjectColumnsStore();
