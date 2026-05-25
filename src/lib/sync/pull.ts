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
			projects: raw.projects.map((p) => ({ ...ProjectSchema.parse(p), synced: true })),
			columns: raw.columns.map((c) => ({ ...ColumnSchema.parse(c), synced: true })),
			notes: raw.notes.map((n) => ({ ...NoteSchema.parse(n), synced: true })),
			attachments: raw.attachments.map((a) => ({ ...attachmentSchema.parse(a), synced: true })),
			deletedLogs: raw.deletedLogs.map((d) => ({ ...deletedLogSchema.parse(d), synced: true }))
		};

		await syncService.putAll(data);
	} catch (error) {
		throw new Error(`Pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
