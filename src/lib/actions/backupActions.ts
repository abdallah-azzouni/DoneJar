import {
	failure,
	success,
	type ActionResult,
	BackupSchema,
	type Backup,
	type ExportBackup,
	ExportBackupSchema
} from '$lib/types';
import { backupService } from '$lib/db/dal';

/**
 * Imports a backup file, adding its data to existing data.
 * @param backup the backup payload
 */
export async function importBackup(backup: Backup): Promise<ActionResult> {
	const validationResult = BackupSchema.safeParse(backup);
	if (!validationResult.success) {
		console.error('Backup validation failed:', validationResult.error);
		return failure('Invalid backup data');
	}

	const validBackup = validationResult.data;
	if (!validBackup) return failure('Invalid backup data');

	try {
		await backupService.import(validBackup);
	} catch (error) {
		return failure(`Error importing backup: ${error}`);
	}
	return success('Backup imported successfully');
}

/**
 * Export a backup file, adding its data to existing data.
 * @param backup the backup payload
 */
export async function exportBackup(payload: {
	projectIds: string[];
	columnIds: string[];
}): Promise<{ result: ActionResult; backup: ExportBackup | null }> {
	try {
		const backup = await backupService.export(payload);
		const result = ExportBackupSchema.safeParse(backup);
		if (!result.success) {
			console.error('Backup validation failed:', result.error);
			return { result: failure('Exported backup data is invalid'), backup: null };
		}

		const validBackup = result.data;
		return { result: success('Backup exported successfully'), backup: validBackup };
	} catch (error) {
		return { result: failure(`Error exporting backup: ${error}`), backup: null };
	}
}
