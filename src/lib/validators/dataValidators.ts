import type { Project as ProjectT, Column as ColumnT, Note as NoteT } from '$lib/types';
import { NoteSchema, ColumnSchema, ProjectSchema, DataSchema } from '$lib/types';

export const isValidNote = (val: unknown): val is NoteT => {
	const result = NoteSchema.safeParse(val);
	if (!result.success) console.error('[isValidNote]', result.error.issues);
	return result.success;
};

export const isValidColumn = (val: unknown): val is ColumnT => {
	const result = ColumnSchema.safeParse(val);
	if (!result.success) console.error('[isValidColumn]', result.error.issues);
	return result.success;
};

export const isValidProject = (val: unknown): val is ProjectT => {
	const result = ProjectSchema.safeParse(val);
	if (!result.success) console.error('[isValidProject]', result.error.issues);
	return result.success;
};

export const isValidData = (val: unknown): { valid: boolean; errors: string | null } => {
	const result = DataSchema.safeParse(val);
	if (!result.success) {
		return { valid: false, errors: JSON.stringify(result.error.issues, null, 2) };
	}
	return { valid: true, errors: null };
};
