// notificationStore.ts
import { writable } from 'svelte/store';
import type { ActionResult } from '$lib/types';

export const notification = writable<{
	message: string;
	type: 'error' | 'success' | 'info';
} | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;

const SUCCESS_DURATION = 3000; // 3 seconds
const ERROR_DURATION = 5000; // 5 seconds
const INFO_DURATION = 4000; // 4 seconds

export function notify(result: ActionResult) {
	if (timer) clearTimeout(timer);
	if (result.type === 'error') {
		notification.set({ message: result.message, type: 'error' });
		timer = setTimeout(() => {
			notification.set(null);
			timer = null;
		}, ERROR_DURATION);
	} else if (result.type === 'success') {
		notification.set({ message: result.message, type: 'success' });
		timer = setTimeout(() => {
			notification.set(null);
			timer = null;
		}, SUCCESS_DURATION);
	} else if (result.type === 'info') {
		notification.set({ message: result.message, type: 'info' });
		timer = setTimeout(() => {
			notification.set(null);
			timer = null;
		}, INFO_DURATION);
	}
}
