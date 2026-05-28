import { createDialogStore } from './dialogFactory';
import { type Project, type DeleteTarget } from '$lib/types';

export * from './dialogFactory';

// --- SIDE MENU & SUBMENUS ---
// note: side menu items placed in AppHeader.svelte

export const sideMenuStore = createDialogStore();

export const sideMenuItems = [
	{ index: 0, label: 'Import 📥', action: () => importStore.open() },
	{ index: 1, label: 'Export 📤', action: () => exportStore.open() },
	{ index: 2, label: 'Settings ⚙️', action: () => settingsStore.open() },
	{ index: 3, label: 'profile', action: () => profileMenuStore.open() }
];

export const exportStore = createDialogStore();
export const importStore = createDialogStore();
export const settingsStore = createDialogStore();
export const profileMenuStore = createDialogStore();

// --- PROJECT MENU ---
export const projectMenuStore = createDialogStore<Project | null>(false, null);
export const openProjectMenu = (project: Project | null = null) => projectMenuStore.open(project);
export const closeProjectMenu = () => projectMenuStore.close();

// --- DELETE CONFIRMATION ---
export const deleteConfirmStore = createDialogStore<DeleteTarget | null>(false, null);
export const confirmDelete = (target: NonNullable<DeleteTarget>) => deleteConfirmStore.open(target);
export const closeDelete = () => deleteConfirmStore.close();
