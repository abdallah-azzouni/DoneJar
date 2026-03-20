import { writable } from 'svelte/store';
import { createEmptyProject, type Project } from '$lib/types';

export const projectMenuStore = writable<{
	isOpen: boolean;
	projectInfo: ReturnType<typeof createEmptyProject>;
}>({
	isOpen: false,
	projectInfo: createEmptyProject({ color: '#495057' })
});

export function openProjectMenu(project: Project | null = null) {
	projectMenuStore.set({
		isOpen: true,
		projectInfo: project ?? createEmptyProject({ color: '#495057' })
	});
}

export function closeProjectMenu() {
	projectMenuStore.set({
		isOpen: false,
		projectInfo: createEmptyProject({ color: '#495057' })
	});
}
