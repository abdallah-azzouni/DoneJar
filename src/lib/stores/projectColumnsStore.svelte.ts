import { projectService } from '$lib/db/dal';
import type { ProjectWithColumns } from '$lib/types';
import { notify } from './notificationStore';
import { failure } from '$lib/types';

export function createProjectColumnsStore() {
	let data = $state<ProjectWithColumns[]>([]);

	let sub: { unsubscribe: () => void } | null = null;

	const observable = projectService.observeProjectsWithColumns();

	sub = observable.subscribe({
		next: (res) => {
			data = res;
		},
		error: (err) => notify(failure(`projectColumnsStore error: ${err.message}`))
	});

	return {
		get data() {
			return data;
		},
		destroy: () => sub?.unsubscribe()
	};
}

export const projectColumnsStore = createProjectColumnsStore();
