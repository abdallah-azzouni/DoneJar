import { writable } from 'svelte/store';

function createNow() {
	const { subscribe, set } = writable(new Date());

	let interval: ReturnType<typeof setInterval> | null = null;
	let subscribers = 0;

	return {
		subscribe(fn: (value: Date) => void) {
			const unsub = subscribe(fn);
			subscribers++;

			if (subscribers === 1) {
				interval = setInterval(() => set(new Date()), 60_000);
			}

			return () => {
				unsub();
				subscribers--;
				if (subscribers === 0 && interval) {
					clearInterval(interval);
					interval = null;
				}
			};
		}
	};
}

export const now = createNow();
