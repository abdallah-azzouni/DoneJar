import { z } from 'zod';
import Delta from 'quill-delta';
import { MAX_NOTE_TITLE_LENGTH, MAX_PROJECT_NAME_LENGTH } from './constants';
import { HEX_COLOR_REGEX } from './constants';

export type ActionResult = { type: 'error' | 'success'; message: string };
export const failure = (message: string): ActionResult => ({ type: 'error', message });
export const success = (message: string): ActionResult => ({ type: 'success', message });

// --- runtime schemas --------------------------------------------------

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
	title: z
		.string()
		.min(1, 'Note title cannot be empty')
		.max(
			MAX_NOTE_TITLE_LENGTH,
			`Note title cannot be longer than ${MAX_NOTE_TITLE_LENGTH} characters`
		),
	tags: z.array(z.string()).default([]),
	description: DeltaSchema.default({ ops: [] }).transform((d) => d as unknown as Delta),
	color: z.string().regex(HEX_COLOR_REGEX, 'Note color must be a valid hex color'),
	dueDate: z.object({ timestamp: z.number(), hasTime: z.boolean() }).nullable().default(null),
	priority: z.enum(['low', 'medium', 'high']).nullable().default(null).catch(null),
	position: z.number(),
	pinned: z.boolean().default(false),
	createdAt: z.number(),
	updatedAt: z.number(),
	synced: z.boolean().default(false),
	version: z.number().nullable().default(null)
});

export const ColumnSchema = z.object({
	id: z.string(),
	projectId: z.string(),
	name: z.string().min(1, 'All columns must have a name').default('New Column'),
	sortKey: z.string().nullable().default(null),
	filters: z.record(z.string(), z.array(z.string())).default({}),
	position: z.number(),
	specialType: z.enum(['jar', 'inbox']).nullable().optional().default(null),
	synced: z.boolean().default(false),
	version: z.number().nullable().default(null)
});

export const ProjectSchema = z.object({
	id: z.string(),
	name: z
		.string()
		.min(1, 'Project name cannot be empty')
		.max(
			MAX_PROJECT_NAME_LENGTH,
			`Project name cannot be longer than ${MAX_PROJECT_NAME_LENGTH} characters`
		),
	type: z.enum(['default', 'blank', 'custom'], {
		message: 'Invalid project type'
	}),
	color: z.string().regex(HEX_COLOR_REGEX, 'Project color must be a valid hex color'),
	createdAt: z.number(),
	updatedAt: z.number(),
	synced: z.boolean().default(false),
	version: z.number().nullable().default(null)
});

export const attachmentSchema = z.object({
	id: z.string(),
	noteId: z.string(),
	filename: z.string(),
	mimeType: z.string(),
	size: z.number(),
	url: z.string().nullable().default(null),
	localBlob: z.instanceof(Blob).nullable().default(null),
	pinned: z.boolean().default(false),
	synced: z.boolean().default(false),
	version: z.number().nullable().default(null),
	createdAt: z.number(),
	updatedAt: z.number()
});

export const deletedLogSchema = z.object({
	id: z.string(),
	itemId: z.string(),
	itemType: z.enum(['note', 'column', 'project', 'attachment']),
	synced: z.boolean().default(false),
	deletedAt: z.number()
});

export const BackupSchema = z.object({
	projects: z.array(ProjectSchema),
	columns: z.array(ColumnSchema),
	notes: z.array(NoteSchema),
	attachments: z.array(attachmentSchema)
});

export function createColumn(
	partial: Omit<Column, 'sortKey' | 'filters' | 'specialType' | 'name' | 'version' | 'synced'> &
		Partial<Pick<Column, 'sortKey' | 'filters' | 'specialType' | 'name' | 'synced' | 'version'>>
): Column {
	return {
		sortKey: null,
		filters: {},
		specialType: null,
		name: 'New Column',
		synced: false,
		version: null,
		...partial
	};
}
export const emptyNote: Note = {
	id: '',
	columnId: '',
	projectId: '',
	title: '',
	tags: [],
	pinned: false,
	description: new Delta(),
	color: '',
	dueDate: null,
	priority: null,
	position: 0,
	createdAt: 0,
	updatedAt: 0,
	synced: false,
	version: null
};

// derive TS types from schemas for consumption elsewhere
export type Note = z.infer<typeof NoteSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type ColumnWithNotes = Column & { notes: Note[] };
export type ProjectWithColumns = Project & { columns: Column[] };
export type DeletedLog = z.infer<typeof deletedLogSchema>;
export type Backup = z.infer<typeof BackupSchema>;

export type SerializedAttachment = Omit<Attachment, 'localBlob'> & { localBlob: string | null };
export const ExportBackupSchema = BackupSchema.extend({
	projects: z.array(ProjectSchema.omit({ synced: true, version: true })),
	columns: z.array(ColumnSchema.omit({ synced: true, version: true })),
	notes: z.array(NoteSchema.omit({ synced: true, version: true })),
	attachments: z.array(
		attachmentSchema.extend({
			localBlob: z.string().nullable().default(null),
			synced: z.boolean().default(false),
			version: z.number().nullable().default(null)
		})
	)
});
export type ExportBackup = z.infer<typeof ExportBackupSchema>;

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
