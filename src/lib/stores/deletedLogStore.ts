import { liveQuery } from 'dexie';
import { readable } from 'svelte/store';
import { type DeletedLog, failure } from '$lib/types';
import { deletedLogRepository } from '$lib/db/dal';
import { notify } from './notificationStore';

export const deletedLogStore = readable<DeletedLog[]>([], (set) => {
	const subscription = liveQuery(async () => {
		return await deletedLogRepository.getAll();
	}).subscribe({
		next: (val) => set(val),
		error: (err) => notify(failure(err))
	});

	return () => subscription.unsubscribe();
});
