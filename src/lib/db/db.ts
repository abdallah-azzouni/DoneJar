import { Dexie, type EntityTable } from 'dexie';
import { DB_VERSION } from '$lib/constants';
import type { Note, Column, Project, Attachment, DeletedLog } from '$lib/types';

const db = new Dexie('DoneJarDB') as Dexie & {
	projects: EntityTable<Project, 'id'>;
	notes: EntityTable<Note, 'id'>;
	columns: EntityTable<Column, 'id'>;
	attachments: EntityTable<Attachment, 'id'>;
	deleted_log: EntityTable<DeletedLog, 'id'>;
};

// Schema declaration:
db.version(DB_VERSION).stores({
	projects: 'id, createdAt, synced',
	columns: 'id, projectId, [projectId+specialType], synced',
	notes: 'id, columnId, projectId, synced',
	attachments: 'id, noteId, synced',
	deleted_log: 'id, itemId, itemType, synced'
});

export { db };
