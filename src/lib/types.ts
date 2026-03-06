import Delta from 'quill-delta';

export type ActionResult = { success: boolean; message: string; type: 'error' | 'success' };

export type Note = {
	id: string;
	title: string;
	color: string;
	description: Delta;
	projectId: string;
	dueDate: { timestamp: number; hasTime: boolean } | null;
	createdAt: number;
	updatedAt: number;
};

export function createEmptyNote({ color = '', projectId = '' }): Note {
	return {
		id: '',
		title: '',
		color: color,
		description: new Delta(),
		projectId: projectId,
		dueDate: null,
		createdAt: 0,
		updatedAt: 0
	};
}

export type Project = {
	id: string;
	name: string;
	type: 'default' | 'blank' | 'custom';
	color: string;
	columns: Column[];
	createdAt: number;
	updatedAt: number;
};

export function createEmptyProject({
	type = 'default',
	color = '',
	columns = []
}: {
	type?: 'default' | 'blank' | 'custom';
	color?: string;
	columns?: Column[];
} = {}): Project {
	return {
		id: '',
		name: '',
		type,
		color,
		columns,
		createdAt: 0,
		updatedAt: 0
	};
}

type ColumnSpecialType = 'jar' | 'inbox' | null;
export type Column = {
	name: string;
	notes: Note[];
	specialType?: ColumnSpecialType;
};
