import { nanoid } from 'nanoid';
import Delta from 'quill-delta';
import { noteRepository, columnRepository } from '$lib/db/dal';

import { failure, success, type ActionResult, type Note } from '$lib/types';
import { validateNoteCreation, validateNoteEdit } from '$lib/validators/noteValidators';

/**
 * Creates a new note in the inbox column of a project.
 * @param note the note payload (title, color, projectId, etc.)
 */
export async function createNote(note: Note): Promise<ActionResult> {
	const validationResult = validateNoteCreation(note);
	if (validationResult.type === 'error') return validationResult;

	try {
		const col = await columnRepository.findInboxColumn(note.projectId);

		if (!col) {
			return failure('Inbox column not found for the specified project');
		}

		const newNote: Note = {
			id: note.id || nanoid(),
			columnId: col?.id || '',
			projectId: note.projectId,
			title: note.title,
			tags: note.tags,
			description: new Delta(note.description),
			color: note.color,
			dueDate: note.dueDate,
			priority: note.priority,
			position: note.position,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			synced: false,
			serverVersion: null
		};

		await noteRepository.add(newNote);
	} catch (error) {
		return failure(`Error creating note: ${error}`);
	}
	return success('Note created successfully');
}

/**
 * Updates an existing note.
 * @param note the full note object with updated fields; must include id and projectId
 * @returns ActionResult indicating success or failure of the operation
 */
export async function editNote(note: Note): Promise<ActionResult> {
	const validationResult = validateNoteEdit(note);
	if (validationResult.type === 'error') return validationResult;

	let col = await columnRepository.get(note.columnId);
	if (!col) {
		return failure('Inbox column not found for the specified project');
	}

	try {
		// Change columnId to inbox if note is moved to new project.
		if (col?.projectId != note.projectId) {
			col = await columnRepository.findInboxColumn(note.projectId);
			if (!col) {
				return failure('System error: Target project is missing an Inbox');
			}
		}

		const updateResult = await noteRepository.update({
			id: note.id,
			columnId: col?.id || '',
			projectId: note.projectId,
			title: note.title,
			tags: note.tags,
			description: new Delta(note.description),
			color: note.color,
			dueDate: note.dueDate,
			priority: note.priority,
			position: note.position,
			createdAt: note.createdAt || Date.now(),
			updatedAt: Date.now()
		} as Note);
		if (updateResult === 0) {
			return failure('Note not found or no changes made');
		}
	} catch (error) {
		return failure(`Error editing note: ${error}`);
	}
	return success('Note edited successfully');
}

/**
 * Removes a note from a project column.
 * @param noteId the ID of the note to delete
 * @param projectId the ID of the project containing the note
 * @returns ActionResult indicating success or failure of the operation
 */
export async function deleteNote(noteId: string): Promise<ActionResult> {
	try {
		await noteRepository.delete(noteId);
	} catch (error) {
		return failure(`Error deleting note: ${error}`);
	}
	return success('Note deleted successfully');
}

/**
 * Moves a note to a different column (used for drag-and-drop).
 * @param noteId the ID of the note to move
 * @param newColumnId the ID of the column to move the note to
 * @returns ActionResult indicating success or failure of the operation
 */
export async function moveNote(noteId: string, newColumnId: string): Promise<ActionResult> {
	try {
		const note = await noteRepository.get(noteId);
		if (!note) {
			return failure('Note not found');
		}

		note.columnId = newColumnId;
		note.updatedAt = Date.now();

		const result = await noteRepository.update(note);
		if (result === 0) return failure('Note not found or no changes made');
	} catch (error) {
		return failure(`Error moving note: ${error}`);
	}
	return success('Note moved successfully');
}

/**
 * Reorders notes within a column based on an array of note IDs in the desired order.
 * @param noteIds an array of note IDs in the desired order
 */
export async function reorderNotes(noteIds: string[]): Promise<ActionResult> {
	try {
		await noteRepository.reorderAll(noteIds);
	} catch (error) {
		return failure(`Error reordering notes: ${error}`);
	}
	return success('Notes reordered successfully');
}
