import { createDialogStore } from './dialogFactory.svelte.ts';
import { type ConfirmTarget } from '$lib/types';
import type { ProjectDocType } from '$lib/db/schemas';

export * from './dialogFactory.svelte.ts';

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
export const projectMenuStore = createDialogStore<{
	project: ProjectDocType | null;
	position: { x: number; y: number };
}>(false, { project: null, position: { x: 0, y: 0 } });
export const openProjectMenu = (data: {
	project: ProjectDocType | null;
	position: { x: number; y: number };
}) => projectMenuStore.open(data);
export const closeProjectMenu = () => projectMenuStore.close();

export const projectSettingStore = createDialogStore<ProjectDocType | null>(false, null);
export const openProjectSetting = (project: ProjectDocType | null = null) =>
	projectSettingStore.open(project);
export const closeProjectSetting = () => projectSettingStore.close();

export const projectMembersStore = createDialogStore<ProjectDocType | null>(false, null);
export const openProjectMembers = (project: ProjectDocType | null = null) =>
	projectMembersStore.open(project);
export const closeProjectMembers = () => projectMembersStore.close();

// --- DELETE CONFIRMATION ---
export const confirmMenuStore = createDialogStore<ConfirmTarget | null>(false, null);
export const confirmMenu = (target: ConfirmTarget) => confirmMenuStore.open(target);
export const closeConfirmMenu = () => confirmMenuStore.close();

export const projectSideBarStore = createDialogStore();
