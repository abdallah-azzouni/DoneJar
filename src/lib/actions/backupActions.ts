import { failure, success, type ActionResult } from '$lib/types';
import { backupService } from '$lib/db/dal';
import { backupSchemaLiteral, type BackupDocType } from '$lib/db/schemas';

/**
 * Imports a backup file, adding its data to existing data.
 * @param backup the backup payload
 */
export async function importBackup(backup: unknown): Promise<ActionResult> {
	const { default: Ajv } = await import('ajv');
	const ajv = new Ajv();
	const validate = ajv.compile(backupSchemaLiteral);

	try {
		const parsedBackup = JSON.parse(JSON.stringify(backup));
		if (!validate(parsedBackup)) return failure('Invalid backup data');

		await backupService.import(parsedBackup);
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
}): Promise<{ result: ActionResult; backup: BackupDocType | null }> {
	try {
		const backup = await backupService.export(payload);

		return { result: success('Backup exported successfully'), backup: backup };
	} catch (error) {
		return { result: failure(`Error exporting backup: ${error}`), backup: null };
	}
}
