import { type ActionResult, type Column, failure, success } from '$lib/types';
import { HEX_COLOR_REGEX, MAX_PROJECT_NAME_LENGTH } from '$lib/constants';

export function validateProjectName(name: string): ActionResult {
	if (name.trim().length === 0) return failure('Project name cannot be empty');
	if (name.length > MAX_PROJECT_NAME_LENGTH)
		return failure(`Project name cannot be longer than ${MAX_PROJECT_NAME_LENGTH} characters`);
	return success('');
}

export function validateProjectType(type: unknown): ActionResult {
	if (type !== 'default' && type !== 'blank' && type !== 'custom')
		return failure('Invalid project type');
	return success('');
}

export function validateProjectColor(color: string): ActionResult {
	if (!HEX_COLOR_REGEX.test(color)) return failure('Project color must be a valid hex color');
	return success('');
}

export function validateCustomColumns(columns?: Column[]): ActionResult {
	if (!columns || columns.length === 0)
		return failure('Custom projects must have at least 1 column');
	const hasEmptyName = columns.some((c) => c.name.trim().length === 0);
	if (hasEmptyName) return failure('All columns must have a name');
	return success('');
}

export function validateProjectCreation(
	name: string,
	type: 'default' | 'blank' | 'custom',
	color: string,
	customColumns?: Column[]
): ActionResult {
	let res = validateProjectName(name);
	if (res.type === 'error') return res;
	res = validateProjectType(type);
	if (res.type === 'error') return res;
	res = validateProjectColor(color);
	if (res.type === 'error') return res;
	if (type === 'custom') {
		res = validateCustomColumns(customColumns);
		if (res.type === 'error') return res;
	}
	return success('');
}

export function validateProjectEdit(projectInfo: {
	name: string;
	color: string;
	id: string;
}): ActionResult {
	let res = validateProjectName(projectInfo.name);
	if (res.type === 'error') return res;
	res = validateProjectColor(projectInfo.color);
	if (res.type === 'error') return res;
	return success('');
}
