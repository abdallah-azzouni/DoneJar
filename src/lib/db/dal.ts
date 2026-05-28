// data access layer
import { db } from '$lib/db/db';
import type {
	Project,
	Column,
	Note,
	Attachment,
	Backup,
	SerializedAttachment,
	ExportBackup,
	DeletedLog
} from '$lib/types';
import { nanoid } from 'nanoid';
import { get } from 'svelte/store';
import { serverVersion } from '$lib/stores/appState';

export function clearDatabase() {
	return db.transaction('rw', [db.projects, db.columns, db.notes, db.attachments], async () => {
		await db.attachments.clear();
		await db.notes.clear();
		await db.columns.clear();
		await db.projects.clear();
	});
}

export const noteRepository = {
	get: async (id: string): Promise<Note | undefined> => {
		return db.notes.get(id);
	},
	getByColumnId: async (columnId: string): Promise<Note[]> => {
		return await db.notes.where('columnId').equals(columnId).toArray();
	},
	update: async (note: Partial<Note> & Pick<Note, 'id'>): Promise<number> => {
		return await db.notes.update(note.id, note);
	},
	add: async (note: Note) => await db.notes.add(note),
	getBulkByIds: async (ids: string[]): Promise<Note[]> => {
		return await db.notes.where('id').anyOf(ids).toArray();
	},
	bulkPut: async (notes: Note[]) => await db.notes.bulkPut(notes),
	delete: async (id: string) => await db.notes.delete(id),
	updatePosition: async (id: string, index: number): Promise<number> => {
		return await db.notes.update(id, { position: index });
	},
	reorderAll: async (noteIds: string[]): Promise<void> => {
		await db.transaction('rw', db.notes, async () => {
			for (const [index, id] of noteIds.entries()) {
				await db.notes.update(id, { position: index });
			}
		});
	},
	deleteFullNote: async (noteId: string) => {
		return await db.transaction('rw', [db.notes, db.attachments], async () => {
			await db.attachments.where('noteId').equals(noteId).delete();
			await db.notes.delete(noteId);
		});
	}
};

export const columnRepository = {
	get: async (id: string): Promise<Column | undefined> => {
		return db.columns.get(id);
	},
	getByProjectId: async (projectId: string): Promise<Column[]> => {
		return await db.columns.where('projectId').equals(projectId).toArray();
	},
	// we can take partial column but we need the id.
	update: async (column: Partial<Column> & Pick<Column, 'id'>): Promise<number> => {
		return await db.columns.update(column.id, column);
	},
	getBulkByIds: async (ids: string[]): Promise<Column[]> => {
		return await db.columns.where('id').anyOf(ids).toArray();
	},
	addAll: async (columns: Column[]) => await db.columns.bulkAdd(columns),
	add: async (column: Column) => await db.columns.add(column),
	findInboxColumn: async (projectId: string): Promise<Column | undefined> => {
		return db.columns.where('[projectId+specialType]').equals([projectId, 'inbox']).first();
	},
	deleteFullColumn: async (columnId: string) => {
		return await db.transaction('rw', [db.notes, db.attachments, db.columns], async () => {
			const noteIds = await db.notes.where('columnId').equals(columnId).primaryKeys();
			for (const noteId of noteIds) {
				await db.attachments.where('noteId').equals(noteId).delete();
				await db.notes.delete(noteId);
			}
			await db.columns.delete(columnId);
		});
	}
};

export const projectRepository = {
	get: async (id: string): Promise<Project | undefined> => {
		return await db.projects.get(id);
	},
	getAll: async (): Promise<Project[]> => {
		return await db.projects.orderBy('createdAt').toArray();
	},
	// we can take partial project but we need the id.
	update: async (project: Partial<Project> & Pick<Project, 'id'>): Promise<number> => {
		return await db.projects.update(project.id, project);
	},
	add: async (project: Project) => await db.projects.add(project),
	getBulkByIds: async (ids: string[]): Promise<Project[]> => {
		return await db.projects.where('id').anyOf(ids).toArray();
	},
	bulkPut: async (projects: Project[]) => await db.projects.bulkPut(projects),
	delete: async (id: string) => await db.projects.delete(id),
	hasElements: async () => (await db.projects.limit(1).count()) > 0,
	deleteFullProject: async (projectId: string) => {
		return await db.transaction(
			'rw',
			[db.projects, db.columns, db.notes, db.attachments],
			async () => {
				const noteIds = await db.notes.where('projectId').equals(projectId).primaryKeys();
				await db.attachments.where('noteId').anyOf(noteIds).delete();
				await db.notes.where('projectId').equals(projectId).delete();
				await db.columns.where('projectId').equals(projectId).delete();
				await db.projects.delete(projectId);
			}
		);
	}
};

export const attachmentRepository = {
	add: async (attachment: Attachment) => {
		await db.attachments.add(attachment);
	},
	getManyByNoteId: async (id: string): Promise<Attachment[]> => {
		return await db.attachments.where('noteId').equals(id).sortBy('createdAt');
	},
	get: async (id: string): Promise<Attachment | undefined> => {
		return await db.attachments.get(id);
	},
	update: async (attachment: Partial<Attachment> & Pick<Attachment, 'id'>): Promise<number> => {
		return await db.attachments.update(attachment.id, attachment);
	},
	getBulkByIds: async (ids: string[]): Promise<Attachment[]> => {
		return await db.attachments.where('id').anyOf(ids).toArray();
	},
	put: async (attachment: Attachment) => {
		await db.attachments.put(attachment);
	},
	delete: async (id: string) => await db.attachments.delete(id)
};

export const deletedLogRepository = {
	add: async (log: DeletedLog) => await db.deleted_log.add(log),
	getAll: async (): Promise<DeletedLog[]> => {
		return await db.deleted_log.toArray();
	},
	update: async (log: Partial<DeletedLog> & Pick<DeletedLog, 'id'>): Promise<number> => {
		return await db.deleted_log.update(log.id, log);
	},
	delete: async (id: string) => await db.deleted_log.delete(id)
};

export const projectService = {
	/**
	 * Orchestrates project & column creation in one atomic step.
	 * Uses existing repos to maintain consistency.
	 */
	createProjectWithColumns: async (project: Project, columns: Column[]) => {
		return await db.transaction('rw', [db.projects, db.columns], async () => {
			await projectRepository.add(project);
			await columnRepository.addAll(columns);
		});
	}
};

export const backupService = {
	import: async (backup: Backup) => {
		await db.transaction('rw', [db.projects, db.columns, db.notes, db.attachments], async () => {
			// Add projects
			const projectIdMap: Record<string, string> = {};
			for (const project of backup.projects) {
				const newProject = { ...project, id: nanoid() };
				projectIdMap[project.id] = newProject.id;
				await projectRepository.add(newProject);
			}

			// Add columns
			const columnIdMap: Record<string, string> = {};
			for (const column of backup.columns) {
				const newColumn = { ...column, id: nanoid(), projectId: projectIdMap[column.projectId] };
				columnIdMap[column.id] = newColumn.id;
				await columnRepository.add(newColumn);
			}

			// Add notes
			const noteIdMap: Record<string, string> = {};
			for (const note of backup.notes) {
				const newNote = {
					...note,
					id: nanoid(),
					columnId: columnIdMap[note.columnId],
					projectId: projectIdMap[note.projectId]
				};
				noteIdMap[note.id] = newNote.id;
				await noteRepository.add(newNote);
			}

			// Add attachments
			for (const attachment of backup.attachments) {
				const newAttachment = { ...attachment, id: nanoid(), noteId: noteIdMap[attachment.noteId] };
				await attachmentRepository.add(newAttachment);
			}
		});
	},

	export: async (payload: { projectIds: string[]; columnIds: string[] }): Promise<ExportBackup> => {
		const { projectIds, columnIds } = payload;

		// Fetch projects
		const projects = await db.projects.where('id').anyOf(projectIds).toArray();

		// Fetch columns
		const columns = await db.columns.where('id').anyOf(columnIds).toArray();

		// Fetch notes for the selected columns
		const notes = await db.notes.where('columnId').anyOf(columnIds).toArray();

		// Fetch attachments for the selected notes
		const noteIds = notes.map((note) => note.id);
		const rawAttachments = await db.attachments.where('noteId').anyOf(noteIds).toArray();

		// Process attachments to convert binary Blobs into Base64 strings
		const attachments: SerializedAttachment[] = await Promise.all(
			rawAttachments.map(async (attachment) => {
				if (attachment.localBlob instanceof Blob) {
					return {
						...attachment,
						// Convert the real Blob into a text string for the JSON file
						localBlob: await blobToBase64(attachment.localBlob)
					};
				}
				return {
					...attachment,
					localBlob: attachment.localBlob ?? null
				};
			})
		);

		return {
			projects,
			columns,
			notes,
			attachments
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

export const syncService = {
	getUnsynced: async (): Promise<{
		projects: Project[];
		columns: Column[];
		notes: Note[];
		attachments: Attachment[];
		deletedLogs: DeletedLog[];
	}> => {
		const projects = await db.projects.where('synced').equals(0).toArray();
		const columns = await db.columns.where('synced').equals(0).toArray();
		const notes = await db.notes.where('synced').equals(0).toArray();
		const attachments = await db.attachments.where('synced').equals(0).toArray();
		const deletedLogs = await db.deleted_log.where('synced').equals(0).toArray();

		return { projects, columns, notes, attachments, deletedLogs };
	},

	getServerVersion: (): number | null => {
		return get(serverVersion);
	},

	setServerVersion: (version: number) => {
		serverVersion.set(version);
	},

	putAll: async (data: {
		projects: Project[];
		columns: Column[];
		notes: Note[];
		attachments: Attachment[];
		deletedLogs: DeletedLog[];
	}) => {
		await db.transaction(
			'rw',
			[db.projects, db.columns, db.notes, db.attachments, db.deleted_log],
			async () => {
				await db.deleted_log.bulkPut(data.deletedLogs);
				await db.projects.bulkPut(data.projects);
				await db.columns.bulkPut(data.columns);
				await db.notes.bulkPut(data.notes);
				await db.attachments.bulkPut(data.attachments);
			}
		);
	}
};
