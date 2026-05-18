import { writable } from 'svelte/store';

export function createDialogStore<T = null>(initialState = false, initialData: T | null = null) {
	const { subscribe, set, update } = writable({
		isOpen: initialState,
		data: initialData as T | null
	});

	return {
		subscribe,
		open: (data?: T | null) => set({ isOpen: true, data: data !== undefined ? data : initialData }),
		close: () => update((state) => ({ ...state, isOpen: false })),
		toggle: () => update((state) => ({ ...state, isOpen: !state.isOpen }))
	};
}
