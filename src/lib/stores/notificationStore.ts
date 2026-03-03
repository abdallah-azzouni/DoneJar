// notificationStore.ts
import { writable } from 'svelte/store';

type ActionResult = { success: boolean; message: string; type: 'error' | 'success' };

export const notification = writable<{ message: string; type: 'error' | 'success' } | null>(null);

export function notify(result: ActionResult) {
	if (!result.success && result.type === 'error') {
		notification.set({ message: result.message, type: 'error' });
		setTimeout(() => notification.set(null), 5000);
	} else if (result.success && result.type === 'success') {
		notification.set({ message: result.message, type: 'success' });
		setTimeout(() => notification.set(null), 3000);
	}
}
