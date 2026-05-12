// import { nanoid } from 'nanoid';
import { type Attachment } from '$lib/types';
import { attachmentRepository } from '$lib/db/dal';

import { failure, success, type ActionResult } from '$lib/types';

/**
 *  Saves attachments for a note, handling both new attachments and deletions.
 * @param noteId
 * @param attachments
 * @param deletedIds
 * @returns
 */
export async function saveNoteAttachments(
	noteId: string,
	attachments: Attachment[],
	deletedIds: string[]
): Promise<ActionResult> {
	try {
		for (const id of deletedIds) {
			await attachmentRepository.delete(id);
		}
		for (const attachment of attachments) {
			if (!attachment.id) {
				// new attachment, needs id and timestamps
				await attachmentRepository.add({
					...attachment,
					noteId,
					url: null,
					synced: false,
					createdAt: Date.now(),
					updatedAt: Date.now()
				});
			} else {
				await attachmentRepository.put(attachment);
			}
		}
	} catch (error) {
		return failure(`Error saving attachments: ${error}`);
	}
	return success('Attachments saved');
}
