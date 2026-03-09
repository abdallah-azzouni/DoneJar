import { projects } from '$lib/stores/userData';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';
import { failure, success, type ActionResult, type Note } from '$lib/types';
import { validateNoteCreation, validateNoteEdit } from '$lib/validators/noteValidators';

/**
 * Creates a new note in the specified column of a project.
 * @param note the note payload (title, color, projectId, etc.)
 * @param columnIndex index of the column to add the note to (defaults to 0)
 */
export function createNote(note: Note, columnIndex: number = 0): ActionResult {
	const validationResult = validateNoteCreation(note);
	if (validationResult.type === 'error') return validationResult;

	try {
		const newNote = {
			id: nanoid(),
			title: note.title,
			color: note.color,
			projectId: note.projectId,
			description: note.description,
			dueDate: note.dueDate,
			priority: note.priority,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		projects.update((state) =>
			state.map((p) =>
				p.id === note.projectId
					? {
							...p,
							updatedAt: Date.now(),
							columns: p.columns.map((col, i) =>
								i === columnIndex ? { ...col, notes: [...col.notes, newNote] } : col
							)
						}
					: p
			)
		);
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
export function editNote(note: Note): ActionResult {
	const validationResult = validateNoteEdit(note);
	if (validationResult.type === 'error') return validationResult;

	const updated = {
		...note,
		dueDate: note.dueDate ? { ...note.dueDate } : null,
		description: new Delta(note.description.ops),
		updatedAt: Date.now(),
		createdAt: note.createdAt || Date.now()
	};

	try {
		if (!updated.createdAt) {
			updated.createdAt = Date.now();
		}
		updated.updatedAt = Date.now();
		projects.update((state) =>
			state.map((project) => {
				if (project.id !== updated.projectId) return project;

				return {
					...project,
					updatedAt: Date.now(),
					columns: project.columns.map((col) => ({
						...col,
						notes: col.notes.map((n: Note) => (n.id === updated.id ? updated : n))
					}))
				};
			})
		);
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
export function deleteNote(noteId: string, projectId: string): ActionResult {
	try {
		projects.update((state) =>
			state.map((project) => {
				if (project.id !== projectId) return project;
				return {
					...project,
					updatedAt: Date.now(),
					columns: project.columns.map((col) => ({
						...col,
						notes: col.notes.filter((n: Note) => n.id !== noteId)
					}))
				};
			})
		);
	} catch (error) {
		return failure(`Error deleting note: ${error}`);
	}
	return success('Note deleted successfully');
}

/**
 * Replaces the notes array for a single column.
 * @param projectId the ID of the project containing the column
 * @param columnIndex the index of the column to update
 * @param notes the new array of notes for the column
 * @returns ActionResult indicating success or failure of the operation
 */
export function reorderColumnNotes(
	projectId: string,
	columnIndex: number,
	notes: Note[]
): ActionResult {
	try {
		projects.update((state) =>
			state.map((p) =>
				p.id === projectId
					? {
							...p,
							updatedAt: Date.now(),
							columns: p.columns.map((col, i) => (i === columnIndex ? { ...col, notes } : col))
						}
					: p
			)
		);
	} catch (error) {
		return failure(`Error reordering notes: ${error}`);
	}
	return success('Notes reordered successfully');
}
