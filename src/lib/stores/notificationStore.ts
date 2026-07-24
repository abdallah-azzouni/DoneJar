import { toast } from 'svelte-sonner';
import type { ActionResult } from '$lib/types';

const SUCCESS_DURATION = 3000; // 3 seconds
const ERROR_DURATION = 5000; // 5 seconds
const INFO_DURATION = 4000; // 4 seconds

export function notify(result: ActionResult) {
	if (result.type === 'error') {
		toast.error(result.message, {
			duration: ERROR_DURATION
		});
	} else if (result.type === 'success') {
		toast.success(result.message, {
			duration: SUCCESS_DURATION
		});
	} else if (result.type === 'info') {
		toast.info(result.message, {
			duration: INFO_DURATION
		});
	}
}
