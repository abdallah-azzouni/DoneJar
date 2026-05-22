import { deletedLogRepository } from '$lib/db/dal';
import type { DeletedLog } from '$lib/types';
import { nanoid } from 'nanoid';

export * from './noteActions';
export * from './projectActions';
export * from './attachmentActions';
export * from './backupActions';

export const softDelete = async (itemId: string, itemType: DeletedLog['itemType']) => {
	await deletedLogRepository.add({
		id: nanoid(),
		itemId,
		itemType,
		synced: false,
		deletedAt: Date.now()
	});
};
