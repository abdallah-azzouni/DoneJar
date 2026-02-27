export function textColorFromHex(hex: string) {
	const c = hex.replace('#', '');
	const num = parseInt(
		c.length === 3
			? c
					.split('')
					.map((x) => x + x)
					.join('')
			: c,
		16
	);

	const r = (num >> 16) & 255;
	const g = (num >> 8) & 255;
	const b = num & 255;

	const luminance = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);

	return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Formats a due date timestamp for display.
 * - Omits year if it's the current year.
 * - Omits time if stored at exactly midnight (date-only).
 */
export function formatDueDate({
	timestamp,
	hasTime
}: {
	timestamp: number;
	hasTime: boolean;
}): string {
	const d = new Date(timestamp);
	const now = new Date();
	const sameYear = d.getFullYear() === now.getFullYear();

	const dateStr = d.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		...(sameYear ? {} : { year: 'numeric' })
	});

	if (!hasTime || !sameYear) return dateStr;

	const timeStr = d.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit'
	});

	return `${dateStr}, ${timeStr}`;
}

/**
 * Checks whether a due date is in the past.
 * For date-only entries, considers the due date passed only after the day ends.
 */
export function isDueDatePast(
	dueDate: { timestamp: number; hasTime: boolean },
	now: Date
): boolean {
	const due = new Date(dueDate.timestamp);
	if (!dueDate.hasTime) {
		due.setDate(due.getDate() + 1); // date-only: overdue after end of day
	}
	return due < now;
}
