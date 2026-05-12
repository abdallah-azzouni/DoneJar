import { writable } from 'svelte/store';
import { type Project } from '$lib/types';

export const projectMenuStore = writable<{
	isOpen: boolean;
	project: Project | null;
}>({
	isOpen: false,
	project: null
});

export function openProjectMenu(project: Project | null = null) {
	projectMenuStore.set({ isOpen: true, project });
}

export function closeProjectMenu() {
	projectMenuStore.update((s) => ({ ...s, isOpen: false }));
}
