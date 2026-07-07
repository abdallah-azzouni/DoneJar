// data access layer
import { db, closeDb, resetDb } from '$lib/db/db.svelte';
import { switchMap, map } from 'rxjs/operators';
import { combineLatest, of, from } from 'rxjs';
import { removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';

import { DB_NAME } from '$lib/constants';

import type {
	ProjectDocType,
	ColumnDocType,
	NoteDocType,
	AttachmentDocType,
	BackupDocType
} from '$lib/db/schemas';
import { nanoid } from 'nanoid';

export async function clearDatabase() {
	await closeDb();
	const rawDexie = getRxStorageDexie();
	const compressedDexie = wrappedKeyCompressionStorage({ storage: rawDexie });
	await removeRxDatabase(DB_NAME, compressedDexie);

	resetDb();
}

export const noteRepository = {
	get: async (id: string): Promise<NoteDocType | null> => {
		const db$ = await db();
		return await db$.notes.findOne(id).exec();
	},
	getByColumnId: async (columnId: string): Promise<NoteDocType[]> => {
		const db$ = await db();
		return await db$.notes.find({ selector: { columnId } }).exec();
	},
	add: async (note: NoteDocType) => {
		const db$ = await db();
		await db$.notes.insert(note);
	},
	update: async (note: Partial<NoteDocType> & Pick<NoteDocType, 'id'>): Promise<void> => {
		const db$ = await db();
		const doc = await db$.notes.findOne(note.id).exec();
		if (!doc) return;
		await doc.incrementalPatch(note);
	},
	updatePosition: async (id: string, position: number): Promise<void> => {
		const db$ = await db();
		const doc = await db$.notes.findOne(id).exec();
		if (!doc) return;
		await doc.incrementalPatch({ position });
	},
	reorderAll: async (noteIds: string[]): Promise<void> => {
		const db$ = await db();
		const docs = await db$.notes.findByIds(noteIds).exec();
		await Promise.all(
			noteIds.map((id, index) => {
				const doc = docs.get(id);
				return doc ? doc.incrementalPatch({ position: index }) : Promise.resolve();
			})
		);
	},
	getBulkByIds: async (ids: string[]): Promise<NoteDocType[]> => {
		const db$ = await db();
		const map = await db$.notes.findByIds(ids).exec();
		return [...map.values()];
	},
	bulkUpsert: async (notes: NoteDocType[]) => {
		const db$ = await db();
		await db$.notes.bulkUpsert(notes);
	},

	deleteFullNote: async (noteId: string) => {
		const db$ = await db();
		const attachments = await db$.attachments.find({ selector: { noteId } }).exec();
		await Promise.all(attachments.map((a) => a.incrementalRemove()));
		const note = await db$.notes.findOne(noteId).exec();
		if (note) await note.incrementalRemove();
	}
};

export const columnRepository = {
	get: async (id: string): Promise<ColumnDocType | null> => {
		const db$ = await db();
		return await db$.columns.findOne(id).exec();
	},

	getByProjectId: async (projectId: string): Promise<ColumnDocType[]> => {
		const db$ = await db();
		return await db$.columns.find({ selector: { projectId } }).exec();
	},

	add: async (column: ColumnDocType): Promise<void> => {
		const db$ = await db();
		await db$.columns.insert(column);
	},

	addAll: async (columns: ColumnDocType[]): Promise<void> => {
		const db$ = await db();
		await db$.columns.bulkInsert(columns);
	},

	bulkUpsert: async (columns: ColumnDocType[]): Promise<void> => {
		const db$ = await db();
		await db$.columns.bulkUpsert(columns);
	},

	update: async (column: Partial<ColumnDocType> & Pick<ColumnDocType, 'id'>): Promise<void> => {
		const db$ = await db();
		const doc = await db$.columns.findOne(column.id).exec();
		if (!doc) return;
		await doc.incrementalPatch(column);
	},

	getBulkByIds: async (ids: string[]): Promise<ColumnDocType[]> => {
		const db$ = await db();
		const map = await db$.columns.findByIds(ids).exec();
		return [...map.values()];
	},

	findInboxColumn: async (projectId: string): Promise<ColumnDocType | null> => {
		const db$ = await db();
		return await db$.columns.findOne({ selector: { projectId, specialType: 'inbox' } }).exec();
	},

	deleteFullColumn: async (columnId: string): Promise<void> => {
		const db$ = await db();
		const notes = await db$.notes.find({ selector: { columnId } }).exec();
		for (const note of notes) {
			const attachments = await db$.attachments.find({ selector: { noteId: note.id } }).exec();
			await Promise.all(attachments.map((a) => a.incrementalRemove()));
			await note.incrementalRemove();
		}
		const col = await db$.columns.findOne(columnId).exec();
		if (col) await col.incrementalRemove();
	}
};

export const projectRepository = {
	get: async (id: string): Promise<ProjectDocType | null> => {
		const db$ = await db();
		return await db$.projects.findOne(id).exec();
	},

	getAll: async (): Promise<ProjectDocType[]> => {
		const db$ = await db();
		return await db$.projects.find({ sort: [{ createdAt: 'asc' }] }).exec();
	},

	add: async (project: ProjectDocType): Promise<void> => {
		const db$ = await db();
		await db$.projects.insert(project);
	},

	update: async (project: Partial<ProjectDocType> & Pick<ProjectDocType, 'id'>): Promise<void> => {
		const db$ = await db();
		const doc = await db$.projects.findOne(project.id).exec();
		if (!doc) return;
		await doc.incrementalPatch(project);
	},

	getBulkByIds: async (ids: string[]): Promise<ProjectDocType[]> => {
		const db$ = await db();
		const map = await db$.projects.findByIds(ids).exec();
		return [...map.values()];
	},

	bulkUpsert: async (projects: ProjectDocType[]): Promise<void> => {
		const db$ = await db();
		await db$.projects.bulkUpsert(projects);
	},

	hasElements: async (): Promise<boolean> => {
		const db$ = await db();
		const count = await db$.projects.count().exec();
		return count > 0;
	},

	deleteFullProject: async (projectId: string): Promise<void> => {
		const db$ = await db();
		const notes = await db$.notes.find({ selector: { projectId } }).exec();
		for (const note of notes) {
			const attachments = await db$.attachments.find({ selector: { noteId: note.id } }).exec();
			await Promise.all(attachments.map((a) => a.incrementalRemove()));
			await note.incrementalRemove();
		}
		const columns = await db$.columns.find({ selector: { projectId } }).exec();
		await Promise.all(columns.map((c) => c.incrementalRemove()));
		const project = await db$.projects.findOne(projectId).exec();
		if (project) await project.incrementalRemove();
	}
};

export const attachmentRepository = {
	// Helper to abstract Cache API
	_getBlobFromCache: async (id: string): Promise<Blob | null> => {
		const cache = await caches.open('donejar-attachments');
		const response = await cache.match(id);
		return response ? await response.blob() : null;
	},

	get: async (id: string): Promise<{ doc: AttachmentDocType; blob: Blob | null } | null> => {
		const db$ = await db();
		const doc = await db$.attachments.findOne(id).exec();
		if (!doc) return null;

		const blob = await attachmentRepository._getBlobFromCache(id);
		return { doc, blob };
	},
	getManyByNoteId: async (
		noteId: string
	): Promise<{ doc: AttachmentDocType | undefined; blob: Blob | null }[]> => {
		const db$ = await db();
		const docs = await db$.attachments
			.find({ selector: { noteId }, sort: [{ createdAt: 'asc' }] })
			.exec();

		return await Promise.all(
			docs.map(async (doc) => {
				const blob = await attachmentRepository._getBlobFromCache(doc.id);
				return { doc, blob };
			})
		);
	},
	add: async (attachment: AttachmentDocType, blob: Blob) => {
		const db$ = await db();
		const doc = await db$.notes.findOne(attachment.noteId).exec();
		if (!doc) throw new Error('Note not found for attachment');
		await db$.attachments.insert(attachment);

		const cache = await caches.open('donejar-attachments');
		await cache.put(attachment.id, new Response(blob));
	},

	getBulkByIds: async (ids: string[]): Promise<{ doc: AttachmentDocType; blob: Blob | null }[]> => {
		const db$ = await db();
		const map = await db$.attachments.findByIds(ids).exec();
		const docs = [...map.values()];

		return await Promise.all(
			docs.map(async (doc) => {
				const blob = await attachmentRepository._getBlobFromCache(doc.id);
				return { doc, blob };
			})
		);
	},
	delete: async (id: string) => {
		const db$ = await db();
		const doc = await db$.attachments.findOne(id).exec();
		if (!doc) return;
		await doc.incrementalRemove();
		const cache = await caches.open('donejar-attachments');
		await cache.delete(id);
	}
};

export const projectService = {
	/**
	 * Orchestrates project & column creation in one atomic step.
	 * Uses existing repos to maintain consistency.
	 */
	createProjectWithColumns: async (project: ProjectDocType, columns: ColumnDocType[]) => {
		await projectRepository.add(project);
		await columnRepository.addAll(columns);
	},
	observeAll: () =>
		from(db()).pipe(
			switchMap((database) => {
				return database.projects
					.find({ sort: [{ createdAt: 'asc' }] })
					.$.pipe(map((docs) => docs.map((d) => d.toJSON())));
			})
		),

	observeProjectsWithColumns: () =>
		from(db()).pipe(
			switchMap((database) =>
				database.projects.find({ sort: [{ createdAt: 'asc' }] }).$.pipe(
					switchMap((projects) => {
						if (projects.length === 0) return of([]);
						return combineLatest(
							projects.map((proj) =>
								database.columns
									.find({ selector: { projectId: proj.id }, sort: [{ position: 'asc' }] })
									.$.pipe(
										map((cols) => ({
											...proj.toJSON(),
											columns: cols.map((c) => c.toJSON())
										}))
									)
							)
						);
					})
				)
			)
		)
};

export const columnService = {
	observeColumnsByProjectIdWithNotes: (projectId: string) =>
		from(db()).pipe(
			switchMap((database) =>
				database.columns.find({ selector: { projectId }, sort: [{ position: 'asc' }] }).$.pipe(
					switchMap((cols) => {
						if (cols.length === 0) return of([]);
						return combineLatest(
							cols.map((col) =>
								database.notes
									.find({ selector: { columnId: col.id }, sort: [{ position: 'asc' }] })
									.$.pipe(
										map((notes) => ({ ...col.toJSON(), notes: notes.map((n) => n.toJSON()) }))
									)
							)
						);
					})
				)
			)
		)
};

export const backupService = {
	import: async (backup: BackupDocType) => {
		// Add projects
		const projectIdMap: Record<string, string> = {};
		const projectsToInsert = backup.projects.map((project) => {
			const newId = nanoid();
			projectIdMap[project.id] = newId;
			return { ...project, id: newId };
		});

		if (projectsToInsert.length) await projectRepository.bulkUpsert(projectsToInsert);

		// Add columns
		const columnIdMap: Record<string, string> = {};
		const columnsToInsert = backup.columns.map((column) => {
			const newId = nanoid();
			columnIdMap[column.id] = newId;
			return { ...column, id: newId, projectId: projectIdMap[column.projectId] };
		});
		if (columnsToInsert.length) await columnRepository.bulkUpsert(columnsToInsert);

		// Add notes
		const noteIdMap: Record<string, string> = {};
		const notesToInsert = backup.notes.map((note) => {
			const newId = nanoid();
			noteIdMap[note.id] = newId;
			return {
				...note,
				id: newId,
				columnId: columnIdMap[note.columnId],
				projectId: projectIdMap[note.projectId]
			};
		});
		if (notesToInsert.length) await noteRepository.bulkUpsert(notesToInsert);

		// Add attachments & blobs
		const blobLookup = new Map(backup.blobs.map((b) => [b.attachmentId, b.data]));
		const attachmentPromises = backup.attachments.map(async (attachment) => {
			const newAttachment = {
				...attachment,
				id: nanoid(),
				noteId: noteIdMap[attachment.noteId]
			};

			const rawData = blobLookup.get(attachment.id) || '';
			let blob: Blob;
			if (rawData) {
				const res = await fetch(rawData);
				blob = await res.blob();
			} else {
				blob = new Blob([]); // empty blob as fallback if data is missing
			}

			return attachmentRepository.add(newAttachment, blob);
		});

		await Promise.all(attachmentPromises);
	},

	export: async (_payload: {
		projectIds: string[];
		columnIds: string[];
	}): Promise<BackupDocType> => {
		const db$ = await db();

		const projects = await db$.projects
			.findByIds(_payload.projectIds)
			.exec()
			.then((map) => [...map.values()]);

		const columns = await db$.columns
			.findByIds(_payload.columnIds)
			.exec()
			.then((map) => [...map.values()]);

		const notes = await db$.notes
			.find({ selector: { columnId: { $in: _payload.columnIds } } })
			.exec();

		const noteIds = notes.map((note) => note.id);
		const attachments = await db$.attachments
			.find({ selector: { noteId: { $in: noteIds } } })
			.exec();

		const attachmentIds = attachments.map((a) => a.id);
		const blobs = await Promise.all(
			attachmentIds.map(async (id: string) => {
				const blob = await attachmentRepository._getBlobFromCache(id);
				const data = blob ? await blobToBase64(blob) : '';
				return { attachmentId: id, data };
			})
		);

		return {
			projects: projects.map((p) => p.toJSON()),
			columns: columns.map((c) => c.toJSON()),
			notes: notes.map((n) => n.toJSON()),
			attachments: attachments.map((a) => a.toJSON()),
			blobs: blobs
		};
	}
};

function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}
