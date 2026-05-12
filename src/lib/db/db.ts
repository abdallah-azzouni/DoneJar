import { Dexie, type EntityTable } from 'dexie';
import { DB_VERSION } from '$lib/constants';
import type { Note, Column, Project, Attachment } from '$lib/types';

const db = new Dexie('DoneJarDB') as Dexie & {
	projects: EntityTable<Project, 'id'>;
	notes: EntityTable<Note, 'id'>;
	columns: EntityTable<Column, 'id'>;
	attachments: EntityTable<Attachment, 'id'>;
};

// Schema declaration:
db.version(DB_VERSION).stores({
	projects: 'id, createdAt',
	columns: 'id, projectId, [projectId+specialType]',
	notes: 'id, columnId, projectId',
	attachments: 'id, noteId'
});

export { db };
