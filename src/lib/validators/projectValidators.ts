import { type ActionResult, failure, success } from '$lib/types';
import type { ColumnDocType } from '$lib/db/schemas';

export function validateProjectCreation(
	type: 'default' | 'blank' | 'custom',
	customColumns?: ColumnDocType[]
): ActionResult {
	if (type === 'custom') {
		if (!customColumns || customColumns.length === 0) {
			return failure('Custom projects must have at least 1 column');
		}
		const hasEmptyName = customColumns.some((c) => c.name.trim().length === 0);
		if (hasEmptyName) {
			return failure('All columns must have a name');
		}
	}
	return success('');
}
