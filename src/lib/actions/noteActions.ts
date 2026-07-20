import { nanoid } from 'nanoid';
import { noteRepository } from '$lib/db/dal';

import { failure, success, type ActionResult } from '$lib/types';
import type { NoteDocType } from '$lib/db/schemas/note';

/**
 * Creates a new note in the inbox column of a project.
 * @param note the note payload (title, color, etc.)
 */
export async function createNote(note: NoteDocType): Promise<ActionResult> {
	try {
		const newNote: NoteDocType = {
			id: note.id || nanoid(),
			columnId: note.columnId,
			title: note.title,
			description: note.description,
			color: note.color,
			dueDateHasTime: note.dueDateHasTime,
			dueDateTimestamp: note.dueDateTimestamp,
			priority: note.priority,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			pinned: note.pinned
		};

		await noteRepository.add(newNote);
	} catch (error) {
		return failure(`Error creating note: ${error}`);
	}
	return success('Note created successfully');
}

/**
 * Updates an existing note.
 * @param note the full note object with updated fields; must include id
 * @returns ActionResult indicating success or failure of the operation
 */
export async function editNote(note: NoteDocType): Promise<ActionResult> {
	try {
		await noteRepository.update({
			id: note.id,
			columnId: note.columnId,
			title: note.title,
			description: note.description,
			color: note.color,
			dueDateHasTime: note.dueDateHasTime,
			dueDateTimestamp: note.dueDateTimestamp,
			priority: note.priority,
			createdAt: note.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			pinned: note.pinned
		} as NoteDocType);
	} catch (error) {
		return failure(`Error editing note: ${error}`);
	}
	return success('Note edited successfully');
}

/**
 * Removes a note from a project column.
 * @param noteId the ID of the note to delete
 * @returns ActionResult indicating success or failure of the operation
 */
export async function deleteNote(noteId: string): Promise<ActionResult> {
	try {
		await noteRepository.deleteFullNote(noteId);
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

		await noteRepository.update({
			id: noteId,
			columnId: newColumnId,
			updatedAt: new Date().toISOString()
		});
	} catch (error) {
		return failure(`Error moving note: ${error}`);
	}
	return success('Note moved successfully');
}

export async function togglePinNote(noteId: string): Promise<ActionResult> {
	try {
		const note = await noteRepository.get(noteId);
		if (!note) {
			return failure('Note not found');
		}

		await noteRepository.update({
			id: noteId,
			pinned: !note.pinned,
			updatedAt: new Date().toISOString()
		});
	} catch (error) {
		return failure(`Error toggling pin on note: ${error}`);
	}
	return success('Note pin toggled successfully');
}
