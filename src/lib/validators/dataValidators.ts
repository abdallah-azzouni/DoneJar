import type {
	Project as ProjectT,
	Column as ColumnT,
	Note as NoteT,
	Backup as BackupT
} from '$lib/types';
import { NoteSchema, ColumnSchema, ProjectSchema, BackupSchema } from '$lib/types';
import { notify } from '$lib/stores/notificationStore';

export const isValidNote = (val: unknown): val is NoteT => {
	const result = NoteSchema.safeParse(val);
	if (!result.success)
		notify({
			type: 'error',
			message: result.error.issues.map((issue) => issue.message).join(', ')
		});
	return result.success;
};

export const isValidColumn = (val: unknown): val is ColumnT => {
	const result = ColumnSchema.safeParse(val);
	if (!result.success)
		notify({
			type: 'error',
			message: result.error.issues.map((issue) => issue.message).join(', ')
		});
	return result.success;
};

export const isValidProject = (val: unknown): val is ProjectT => {
	const result = ProjectSchema.safeParse(val);
	if (!result.success)
		notify({
			type: 'error',
			message: result.error.issues.map((issue) => issue.message).join(', ')
		});
	return result.success;
};

export const isValidBackup = (val: unknown): val is BackupT => {
	const result = BackupSchema.safeParse(val);
	if (!result.success)
		notify({
			type: 'error',
			message: result.error.issues.map((issue) => issue.message).join(', ')
		});
	return result.success;
};
