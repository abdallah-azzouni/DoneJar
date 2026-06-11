import type { ProjectDocType, ColumnDocType, NoteDocType } from '$lib/db/schemas/index';

export type ActionResult = { type: 'error' | 'success'; message: string };
export const failure = (message: string): ActionResult => ({ type: 'error', message });
export const success = (message: string): ActionResult => ({ type: 'success', message });

export function createColumn(
	partial: Omit<ColumnDocType, 'sortKey' | 'filters' | 'specialType' | 'name'> &
		Partial<Pick<ColumnDocType, 'sortKey' | 'filters' | 'specialType' | 'name'>>
): ColumnDocType {
	return {
		filters: {},
		name: 'New Column',
		...partial
	};
}
export const emptyNote: NoteDocType = {
	id: '',
	columnId: '',
	projectId: '',
	title: '',
	tags: [],
	pinned: false,
	description: { ops: [] },
	color: '',
	position: 0,
	createdAt: 0,
	updatedAt: 0
};

// derive TS types from schemas for consumption elsewhere
export type ColumnWithNotes = ColumnDocType & { notes: NoteDocType[] };
export type ProjectWithColumns = ProjectDocType & { columns: ColumnDocType[] };

export type NoteInsertTarget =
	| { type: 'index'; value: number }
	| { type: 'specialType'; value: 'inbox' | 'jar' };

export type DeleteTarget =
	| { type: 'projects'; id: string; name: string }
	| { type: 'notes'; id: string; projectId: string; name: string }
	| { type: 'columns'; id: string; projectId: string; name: string }
	| { type: 'attachments'; id: string; noteId: string; name: string }
	| null;

// sort options
export interface SortOption {
	key: string;
	label: string;
	compare: (a: NoteDocType, b: NoteDocType) => number;
}
