import { createDialogStore } from './dialogFactory.svelte.ts';
import { type ConfirmTarget } from '$lib/types';
import type { ProjectDocType, NoteDocType } from '$lib/db/schemas';

export * from './dialogFactory.svelte.ts';

// --- SIDE MENU & SUBMENUS ---
// note: side menu items placed in AppHeader.svelte

export const sideMenuStore = createDialogStore();

// Each index mean a row, two items with the same index will be in the same row.
export const sideMenuRows = [
	{
		items: [
			{ id: 0, label: 'Import 📥', action: () => importStore.open() },
			{ id: 1, label: 'Export 📤', action: () => exportStore.open() }
		]
	},
	{
		items: [{ id: 2, label: 'Settings ⚙️ (Soon...)', action: () => settingsStore.open() }]
	},
	{
		items: [{ id: 3, label: 'Feedback 💬', action: () => feedbackStore.open() }]
	},
	{
		items: [{ id: 4, label: 'profile', action: () => profileMenuStore.open() }]
	}
];

export const exportStore = createDialogStore();
export const importStore = createDialogStore();
export const settingsStore = createDialogStore();
export const feedbackStore = createDialogStore();
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

export const noteMenu = createDialogStore<{ note: NoteDocType | null; readOnly: boolean } | null>(
	false,
	null
);
export const openNoteMenu = (note: NoteDocType | null = null, readOnly: boolean = false) =>
	noteMenu.open({ note: note, readOnly: readOnly });
export const closeNoteMenu = () => noteMenu.close();

// --- CONFIRMATION MENU ---
export const confirmMenuStore = createDialogStore<ConfirmTarget | null>(false, null);
export const confirmMenu = (target: ConfirmTarget) => confirmMenuStore.ask(target);
export const closeConfirmMenu = () => confirmMenuStore.respond(false);

export const projectSideBarStore = createDialogStore();
