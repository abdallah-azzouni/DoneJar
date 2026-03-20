import { type ActionResult, type Note, failure, success } from '$lib/types';
import { HEX_COLOR_REGEX, MAX_NOTE_TITLE_LENGTH } from '$lib/constants';

export function validateNoteTitle(title: string): ActionResult {
	if (title.length > MAX_NOTE_TITLE_LENGTH)
		return failure(`Note title cannot be longer than ${MAX_NOTE_TITLE_LENGTH} characters`);
	if (title.trim().length === 0) return failure('Note title cannot be empty');
	return success(''); // empty because the caller doesn't need a specific success message
}

export function validateNoteColor(color: string): ActionResult {
	if (!HEX_COLOR_REGEX.test(color)) return failure('Note color must be a valid hex color');
	return success('');
}

export function validateNoteDueDate(dueDate: Note['dueDate']): ActionResult {
	if (dueDate === null) return success('');
	if (!Number.isFinite(dueDate.timestamp)) return failure('Due date timestamp is invalid');
	return success('');
}

export function validateNoteCreation(note: Note): ActionResult {
	let res = validateNoteTitle(note.title);
	if (res.type === 'error') return res;
	res = validateNoteColor(note.color);
	if (res.type === 'error') return res;
	res = validateNoteDueDate(note.dueDate);
	if (res.type === 'error') return res;
	return success('');
}

export function validateNoteEdit(note: Note): ActionResult {
	return validateNoteCreation(note); // currently same validation as creation.
}
