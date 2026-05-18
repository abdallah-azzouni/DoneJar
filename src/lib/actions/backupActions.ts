import { failure, success, type ActionResult, BackupSchema, type Backup } from '$lib/types';
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
		await backupService.importBackup(validBackup);
	} catch (error) {
		return failure(`Error importing backup: ${error}`);
	}
	return success('Backup imported successfully');
}
