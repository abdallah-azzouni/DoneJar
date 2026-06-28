// import { nanoid } from 'nanoid';
import { attachmentRepository } from '$lib/db/dal';
import { failure, success, type ActionResult } from '$lib/types';
import type { AttachmentDocType } from '$lib/db/schemas/attachment';

/**
 *  Saves attachments for a note, handling both new attachments and deletions.
 * @param noteId
 * @param attachments
 * @param deletedIds
 * @returns
 */
export async function saveNoteAttachments(
	noteId: string,
	attachments: AttachmentDocType[],
	deletedIds: string[],
	blobs: Map<string, Blob>
): Promise<ActionResult> {
	try {
		for (const id of deletedIds) {
			await attachmentRepository.delete(id);
		}

		const failedFiles: string[] = [];
		for (const attachment of attachments) {
			const blob = blobs.get(attachment.id);
			if (!blob) {
				failedFiles.push(attachment.filename || attachment.id);
				continue;
			}
			await attachmentRepository.add(
				{
					...attachment,
					noteId,
					url: undefined,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				},
				blob
			);
		}

		if (failedFiles.length > 0) {
			// Tell the user some files worked, but some failed
			return success(`Saved attachments, but failed to upload: ${failedFiles.join(', ')}`);
		}
	} catch (error) {
		return failure(`Error saving attachments: ${error}`);
	}
	return success('Attachments saved');
}
