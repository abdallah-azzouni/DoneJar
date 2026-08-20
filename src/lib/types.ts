import type { ProjectDocType, ColumnDocType, NoteDocType } from '$lib/db/schemas/index';

export type ActionResult = { type: 'error' | 'success' | 'info'; message: string };
export const failure = (message: string): ActionResult => ({ type: 'error', message });
export const success = (message: string): ActionResult => ({ type: 'success', message });
export const info = (message: string): ActionResult => ({ type: 'info', message });

export function createColumn(
	partial: Omit<ColumnDocType, 'userId' | 'sortKey' | 'filters' | 'specialType' | 'name'> &
		Partial<Pick<ColumnDocType, 'userId' | 'sortKey' | 'filters' | 'specialType' | 'name'>>
): ColumnDocType {
	return {
		userId: null,
		filters: '[]',
		sortKey: null,
		specialType: null,
		name: 'New Column',
		...partial
	};
}
export const emptyNote: NoteDocType = {
	id: '',
	userId: null,
	columnId: '',
	title: '',
	pinned: false,
	description: '',
	description_updatedAt: '',
	dueDateHasTime: false,
	dueDateTimestamp: null,
	priority: null,
	color: '',
	createdAt: '',
	updatedAt: ''
};

// derive TS types from schemas for consumption elsewhere
export type ColumnWithNotes = ColumnDocType & { notes: NoteDocType[] };
export type ProjectWithColumns = ProjectDocType & { columns: ColumnDocType[] };

export type NoteInsertTarget =
	{ type: 'index'; value: number } | { type: 'specialType'; value: 'inbox' | 'jar' };

export type ConfirmTarget = {
	title: string;
	body: string;
	actionLabel: string;
	cancelLabel?: string;
	actionColor?: 'primary' | 'danger' | 'success' | 'info';
};

// sort options
export interface SortOption {
	key: string;
	label: string;
	compare: (a: NoteDocType, b: NoteDocType) => number;
}

export type Profile = {
	id: string;
	display_name: string;
	created_at: string;
	email: string;
};
