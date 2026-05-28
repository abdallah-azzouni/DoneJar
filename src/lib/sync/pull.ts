import { getAllDataFromServer } from '$lib/pb/pbRepository';
import { syncService } from '$lib/db/dal';
import {
	ProjectSchema,
	ColumnSchema,
	NoteSchema,
	attachmentSchema,
	deletedLogSchema
} from '$lib/types';

export async function pull() {
	try {
		const raw = await getAllDataFromServer();

		if (!raw) {
			throw new Error('No data received from server');
		}

		const data = {
			projects: raw.projects.map((p) => ({ ...ProjectSchema.parse(p), synced: 1 })),
			columns: raw.columns.map((c) => ({ ...ColumnSchema.parse(c), synced: 1 })),
			notes: raw.notes.map((n) => ({ ...NoteSchema.parse(n), synced: 1 })),
			attachments: raw.attachments.map((a) => ({ ...attachmentSchema.parse(a), synced: 1 })),
			deletedLogs: raw.deletedLogs.map((d) => ({ ...deletedLogSchema.parse(d), synced: 1 }))
		};
		await syncService.putAll(data);
	} catch (error) {
		throw new Error(`Pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
