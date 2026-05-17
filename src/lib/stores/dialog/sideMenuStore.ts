import { writable } from 'svelte/store';

export const sideMenuStore = writable<{
	isOpen: boolean;
}>({
	isOpen: false
});

export function openSideMenu() {
	sideMenuStore.set({ isOpen: true });
}

export function closeSideMenu() {
	sideMenuStore.update(() => ({ isOpen: false }));
}
