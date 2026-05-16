import { z } from 'zod';
import Delta from 'quill-delta';

export type ActionResult = { type: 'error' | 'success'; message: string };
export const failure = (message: string): ActionResult => ({ type: 'error', message });
export const success = (message: string): ActionResult => ({ type: 'success', message });

// --- runtime schemas --------------------------------------------------

const colorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const DeltaSchema = z.object({
	ops: z.array(
		z.object({
			insert: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
			delete: z.number().optional(),
			retain: z.union([z.number(), z.record(z.string(), z.unknown())]).optional(),
			attributes: z.record(z.string(), z.unknown()).optional()
		})
	)
});

export const NoteSchema = z.object({
	id: z.string(),
	columnId: z.string(),
	projectId: z.string(),
	title: z.string(),
	tags: z.array(z.string()).default([]),
	description: DeltaSchema.transform((d) => d as unknown as Delta),
	color: z.string().regex(colorRegex),
	dueDate: z.object({ timestamp: z.number(), hasTime: z.boolean() }).nullable(),
	priority: z.enum(['low', 'medium', 'high']).nullable().catch(null),
	position: z.number(),
	createdAt: z.number(),
	updatedAt: z.number(),
	synced: z.boolean().default(false),
	serverVersion: z.number().nullable().default(null)
});

export const ColumnSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	name: z.string().default('New Column'),
	sortKey: z.string().nullable().default(null),
	filters: z.record(z.string(), z.array(z.string())).default({}),
	position: z.number(),
	specialType: z.enum(['jar', 'inbox']).nullable().optional().default(null),
	synced: z.boolean().default(false),
	serverVersion: z.number().nullable().default(null)
});

export const ProjectSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.enum(['default', 'blank', 'custom']),
	color: z.string().regex(colorRegex),
	createdAt: z.number(),
	updatedAt: z.number(),
	synced: z.boolean().default(false),
	serverVersion: z.number().nullable().default(null)
});

export const attachmentSchema = z.object({
	id: z.string(),
	noteId: z.string(),
	filename: z.string(),
	mimeType: z.string(),
	size: z.number(),
	url: z.string().nullable().default(null),
	localBlob: z.instanceof(Blob).nullable().default(null),
	synced: z.boolean().default(false),
	serverVersion: z.number().nullable().default(null),
	createdAt: z.number(),
	updatedAt: z.number()
});

export const BackupSchema = z.object({
	projects: z.array(ProjectSchema),
	columns: z.array(ColumnSchema),
	notes: z.array(NoteSchema),
	attachments: z.array(attachmentSchema)
});

export function createColumn(
	partial: Omit<
		Column,
		'sortKey' | 'filters' | 'specialType' | 'name' | 'version' | 'synced' | 'serverVersion'
	> &
		Partial<
			Pick<Column, 'sortKey' | 'filters' | 'specialType' | 'name' | 'synced' | 'serverVersion'>
		>
): Column {
	return {
		sortKey: null,
		filters: {},
		specialType: null,
		name: 'New Column',
		synced: false,
		serverVersion: null,
		...partial
	};
}
export const emptyNote: Note = {
	id: '',
	columnId: '',
	projectId: '',
	title: '',
	tags: [],
	description: new Delta(),
	color: '',
	dueDate: null,
	priority: null,
	position: 0,
	createdAt: 0,
	updatedAt: 0,
	synced: false,
	serverVersion: null
};

// derive TS types from schemas for consumption elsewhere
export type Note = z.infer<typeof NoteSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type ColumnWithNotes = Column & { notes: Note[] };
export type Backup = z.infer<typeof BackupSchema>;

export type NoteInsertTarget =
	| { type: 'index'; value: number }
	| { type: 'specialType'; value: 'inbox' | 'jar' };

export type DeleteTarget =
	| { type: 'project'; id: string; name: string }
	| { type: 'note'; id: string; projectId: string; name: string }
	| null;

// sort options
export interface SortOption {
	key: string;
	label: string;
	compare: (a: Note, b: Note) => number;
}
