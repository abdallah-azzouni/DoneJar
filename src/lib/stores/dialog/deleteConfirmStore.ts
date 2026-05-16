import { writable } from 'svelte/store';
import type { DeleteTarget } from '$lib/types';

export const deleteConfirmStore = writable<DeleteTarget>(null);

export function confirmDelete(target: NonNullable<DeleteTarget>) {
	deleteConfirmStore.set(target);
}

export function closeDelete() {
	deleteConfirmStore.set(null);
}
