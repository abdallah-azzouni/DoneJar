import {
	failure,
	success,
	type ActionResult,
	BackupSchema,
	type Backup,
	type ExportBackup,
	ExportBackupSchema
} from '$lib/types';
import { validateData } from '$lib/validators/dataValidators';
import { backupService } from '$lib/db/dal';

/**
 * Imports a backup file, adding its data to existing data.
 * @param backup the backup payload
 */
export async function importBackup(backup: Backup): Promise<ActionResult> {
	const validationResult = validateData(BackupSchema, backup, 'Valid Backup');
	if (validationResult.type === 'error') return failure(validationResult.message);

	const validBackup = backup;
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
		const result = validateData(ExportBackupSchema, backup, 'Valid Backup');
		if (result.type === 'error') return { result: failure(result.message), backup: null };

		return { result: success('Backup exported successfully'), backup };
	} catch (error) {
		return { result: failure(`Error exporting backup: ${error}`), backup: null };
	}
}
