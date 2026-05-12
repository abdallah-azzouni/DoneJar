import { writable } from 'svelte/store';

export const boardInvalidator = writable(0);

export function invalidateBoard() {
	boardInvalidator.update((n) => n + 1); // increment instead of bool, safer
}
