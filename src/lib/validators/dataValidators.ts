import type { ZodType } from 'zod';
import { failure, success, type ActionResult } from '$lib/types';

export const validateData = (
	schema: ZodType,
	val: unknown,
	successMessage = 'Valid'
): ActionResult => {
	const result = schema.safeParse(val);
	if (!result.success) return failure(result.error.issues.map((issue) => issue.message).join(', '));
	return success(successMessage);
};
