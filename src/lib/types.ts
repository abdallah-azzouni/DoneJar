import Delta from 'quill-delta';
import { z } from 'zod';

export type ActionResult = { type: 'error' | 'success'; message: string };
export const failure = (message: string): ActionResult => ({ type: 'error', message });
export const success = (message: string): ActionResult => ({ type: 'success', message });

// --- runtime schemas --------------------------------------------------

const colorRegex = /^#[0-9a-fA-F]{6}$/;

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
	title: z.string(),
	color: z.string().regex(colorRegex),
	description: DeltaSchema.transform((d) => d as unknown as Delta),
	projectId: z.string(),
	dueDate: z.object({ timestamp: z.number(), hasTime: z.boolean() }).nullable(),
	priority: z.enum(['low', 'medium', 'high']).nullable().catch(null),
	createdAt: z.number(),
	updatedAt: z.number()
});

export const ColumnSchema = z.object({
	name: z.string(),
	notes: z.array(NoteSchema),
	specialType: z.enum(['jar', 'inbox']).nullable().optional()
});

export const ProjectSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.enum(['default', 'blank', 'custom']),
	color: z.string().regex(colorRegex),
	columns: z.array(ColumnSchema),
	createdAt: z.number(),
	updatedAt: z.number()
});

export const DataSchema = z.array(ProjectSchema);

// derive TS types from schemas for consumption elsewhere
export type Note = z.infer<typeof NoteSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type Project = z.infer<typeof ProjectSchema>;

// helpers that construct empty objects

export function createEmptyNote({ color = '', projectId = '' }): Note {
	return {
		id: '',
		title: '',
		color: color,
		description: new Delta(),
		projectId: projectId,
		dueDate: null,
		priority: null,
		createdAt: 0,
		updatedAt: 0
	};
}

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

export type NoteInsertTarget =
	| { type: 'index'; value: number }
	| { type: 'specialType'; value: 'inbox' | 'jar' };

export type DeleteTarget =
	| { type: 'project'; id: string; name: string }
	| { type: 'note'; id: string; projectId: string; name: string }
	| null;
