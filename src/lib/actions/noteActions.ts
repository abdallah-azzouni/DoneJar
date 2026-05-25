import { nanoid } from 'nanoid';
import Delta from 'quill-delta';
import { noteRepository, columnRepository } from '$lib/db/dal';

import { failure, success, type ActionResult, type Note, NoteSchema } from '$lib/types';
import { softDelete } from '$lib/actions';

/**
 * Creates a new note in the inbox column of a project.
 * @param note the note payload (title, color, projectId, etc.)
 */
export async function createNote(note: Note): Promise<ActionResult> {
	const validationResult = NoteSchema.safeParse(note);
	if (!validationResult.success) {
		console.error('Note validation failed:', validationResult.error);
		return failure('Invalid note data');
	}

	const validNote = validationResult.data;

	try {
		const col = await columnRepository.findInboxColumn(validNote.projectId);

		if (!col) {
			return failure('Inbox column not found for the specified project');
		}

		const newNote: Note = {
			id: validNote.id || nanoid(),
			columnId: col.id,
			projectId: validNote.projectId,
			title: validNote.title,
			tags: validNote.tags,
			description: new Delta(validNote.description),
			color: validNote.color,
			dueDate: validNote.dueDate,
			priority: validNote.priority,
			position: validNote.position,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			pinned: validNote.pinned,
			synced: false,
			version: null
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
	const validationResult = NoteSchema.safeParse(note);
	if (!validationResult.success) {
		console.error('Note validation failed:', validationResult.error);
		return failure('Invalid note data');
	}

	const validNote = validationResult.data;

	let col = await columnRepository.get(validNote.columnId);
	if (!col) {
		return failure('Inbox column not found for the specified project');
	}

	try {
		// Change columnId to inbox if note is moved to new project.
		if (col?.projectId != validNote.projectId) {
			col = await columnRepository.findInboxColumn(validNote.projectId);
			if (!col) {
				return failure('System error: Target project is missing an Inbox');
			}
		}

		const updateResult = await noteRepository.update({
			id: validNote.id,
			columnId: col.id,
			projectId: validNote.projectId,
			title: validNote.title,
			tags: validNote.tags,
			description: new Delta(validNote.description),
			color: validNote.color,
			dueDate: validNote.dueDate,
			priority: validNote.priority,
			position: validNote.position,
			createdAt: validNote.createdAt || Date.now(),
			updatedAt: Date.now(),
			pinned: validNote.pinned,
			synced: validNote.synced || false,
			version: validNote.version || null
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
		await softDelete(noteId, 'note');
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

export async function togglePinNote(noteId: string): Promise<ActionResult> {
	try {
		const note = await noteRepository.get(noteId);
		if (!note) {
			return failure('Note not found');
		}

		note.pinned = !note.pinned;
		note.updatedAt = Date.now();

		const result = await noteRepository.update(note);
		if (result === 0) return failure('Note not found or no changes made');
	} catch (error) {
		return failure(`Error toggling pin on note: ${error}`);
	}
	return success('Note pin toggled successfully');
}
