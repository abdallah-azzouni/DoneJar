// $lib/stores/columnStore.ts
import { liveQuery } from 'dexie';
import { readable } from 'svelte/store';
import { columnRepository, noteRepository } from '$lib/db/dal';
import type { ColumnWithNotes } from '$lib/types';
import { notify } from './notificationStore';

export function createColumnNotesStore(projectId: string) {
	return readable<ColumnWithNotes[]>([], (set) => {
		const subscription = liveQuery(async () => {
			const cols = await columnRepository.getByProjectId(projectId);
			return await Promise.all(
				cols
					.sort((a, b) => a.position - b.position)
					.map(async (col) => ({
						...col,
						notes: await noteRepository.getByColumnId(col.id)
					}))
			);
		}).subscribe({
			next: set,
			error: (err) => notify({ type: 'error', message: err })
		});

		return () => subscription.unsubscribe();
	});
}
