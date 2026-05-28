import { liveQuery } from 'dexie';
import { db } from '$lib/db/db';
import type { Column, Note, Project, Attachment, DeletedLog } from '$lib/types';
import { failure } from '$lib/types';
import { notify } from '$lib/stores/notificationStore';
import { readable } from 'svelte/store';

export const unsyncedItemsStore = readable<{
	projects: Project[];
	columns: Column[];
	notes: Note[];
	attachments: Attachment[];
	deletedLogs: DeletedLog[];
}>(
	{
		projects: [],
		columns: [],
		notes: [],
		attachments: [],
		deletedLogs: []
	},
	(set) => {
		const subscription = liveQuery(async () => {
			const [projects, columns, notes, attachments, deletedLogs] = await Promise.all([
				db.projects.where('synced').equals(0).toArray(),
				db.columns.where('synced').equals(0).toArray(),
				db.notes.where('synced').equals(0).toArray(),
				db.attachments.where('synced').equals(0).toArray(),
				db.deleted_log.where('synced').equals(0).toArray()
			]);
			return { projects, columns, notes, attachments, deletedLogs };
		}).subscribe({
			next: (val) => set(val),
			error: (err) => notify(failure(err))
		});

		return () => subscription.unsubscribe();
	}
);
