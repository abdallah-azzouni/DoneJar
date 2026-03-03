import { browser } from '$app/environment';
import { persisted } from 'svelte-persisted-store';
import { derived } from 'svelte/store';
import Delta from 'quill-delta';
import { notify } from './notificationStore';

export const isLoaded = persisted('isLoaded', false);
export interface NoteInterface {
	id: string;
	title: string;
	color: string;
	description: Delta;
	projectId: string;
	dueDate: { timestamp: number; hasTime: boolean } | null;
	createdAt: number;
	updatedAt: number;
}

export class Note implements NoteInterface {
	id: string;
	title: string;
	color: string;
	description: Delta;
	projectId: string;
	dueDate: { timestamp: number; hasTime: boolean } | null;
	createdAt: number;
	updatedAt: number;
	constructor(id = '', title = '', color = '', description = new Delta(), projectId = '') {
		this.id = id;
		this.title = title;
		this.color = color;
		this.description = description;
		this.projectId = projectId;
		this.dueDate = null;
		this.createdAt = 0;
		this.updatedAt = 0;
	}
}

export type ColumnSpecialType = 'jar' | 'inbox' | null;

export interface Column {
	name: string;
	notes: Note[];
	specialType?: ColumnSpecialType;
}

export interface ProjectInterface {
	id: string;
	name: string;
	type: 'default' | 'blank' | 'custom';
	color: string;
	columns: Column[];
	createdAt: number;
	updatedAt: number;
}

export class Project implements ProjectInterface {
	id: string;
	name: string;
	type: 'default' | 'blank' | 'custom';
	color: string;
	columns: Column[];
	createdAt: number;
	updatedAt: number;
	constructor(
		id = '',
		name = '',
		type: 'default' | 'blank' | 'custom' = 'default',
		color = '',
		columns: Column[] = []
	) {
		this.id = id;
		this.name = name;
		this.type = type;
		this.color = color;
		this.columns = columns;
		this.createdAt = 0;
		this.updatedAt = 0;
	}
}

const defaultUserNotes = {
	activeProjectId: <string | null>'',
	projects: <ProjectInterface[]>[]
};

function isValidUserNotes(val: unknown): val is typeof defaultUserNotes {
	if (typeof val !== 'object' || val === null) return false;
	const obj = val as Record<string, unknown>;
	if (!Array.isArray(obj.projects)) return false;
	if (obj.activeProjectId !== null && typeof obj.activeProjectId !== 'string') return false;
	return true;
}

export const userNotes = persisted('userNotes', defaultUserNotes, {
	beforeRead: (val) => {
		if (!isValidUserNotes(val)) {
			notify({
				success: false,
				message: 'Saved data is corrupted. Data has been reset.',
				type: 'error'
			});
			return defaultUserNotes;
		}
		return val;
	},
	onWriteError: () => {
		notify({
			success: false,
			message: 'Failed to save data. Storage may be full or unavailable.',
			type: 'error'
		});
	},
	onParseError: () => {
		notify({
			success: false,
			message: 'Saved data is corrupted. Data has been reset.',
			type: 'error'
		});
	}
});

export const currentProject = derived(
	userNotes,
	($un) => $un.projects.find((p) => p.id === $un.activeProjectId)!
);

if (browser) {
	if (document.readyState === 'complete') {
		isLoaded.set(true);
	} else {
		window.addEventListener('load', () => isLoaded.set(true));
	}
}
