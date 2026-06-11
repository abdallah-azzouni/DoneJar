import type { NoteDocType } from '$lib/db/schemas';
import { type SortOption } from '$lib/types';

// ═══ Sort options ═══

export const sortOptions: SortOption[] = [
	{ key: 'newest', label: 'Newest first', compare: (a, b) => b.createdAt - a.createdAt },
	{ key: 'oldest', label: 'Oldest first', compare: (a, b) => a.createdAt - b.createdAt },
	{
		key: 'due-date',
		label: 'Due date',
		compare: (a, b) => {
			if (!a.dueDate && !b.dueDate) return 0;
			if (!a.dueDate) return 1;
			if (!b.dueDate) return -1;
			return a.dueDate.timestamp - b.dueDate.timestamp;
		}
	},
	{
		key: 'priority',
		label: 'Priority',
		compare: (a, b) => {
			const priorityValue = (note: NoteDocType) => {
				if (note.priority === 'high') return 3;
				if (note.priority === 'medium') return 2;
				if (note.priority === 'low') return 1;
				return 0; // No priority
			};
			return priorityValue(b) - priorityValue(a); // Higher priority first
		}
	},
	{ key: 'title-az', label: 'Title A → Z', compare: (a, b) => a.title.localeCompare(b.title) },
	{ key: 'title-za', label: 'Title Z → A', compare: (a, b) => b.title.localeCompare(a.title) }
];

export function getSortComparator(key: string): (a: NoteDocType, b: NoteDocType) => number {
	return sortOptions.find((o) => o.key === key)?.compare ?? (() => 0);
}
