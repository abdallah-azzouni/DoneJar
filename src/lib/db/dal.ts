// data access layer
import { db } from '$lib/db/db';
import type { Project, Column, Note, Attachment, Backup } from '$lib/types';
import { nanoid } from 'nanoid';

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
	addAll: async (columns: Column[]) => await db.columns.bulkAdd(columns),
	add: async (column: Column) => await db.columns.add(column),
	findInboxColumn: async (projectId: string): Promise<Column | undefined> => {
		return db.columns.where('[projectId+specialType]').equals([projectId, 'inbox']).first();
	}
};

export const projectRepository = {
	get: async (id: string): Promise<Project | undefined> => {
		return db.projects.get(id);
	},
	getAll: async (): Promise<Project[]> => {
		return await db.projects.orderBy('createdAt').toArray();
	},
	// we can take partial project but we need the id.
	update: async (project: Partial<Project> & Pick<Project, 'id'>): Promise<number> => {
		return await db.projects.update(project.id, project);
	},
	add: async (project: Project) => await db.projects.add(project),
	hasElements: async () => (await db.projects.limit(1).count()) > 0
};

export const attachmentRepository = {
	add: async (attachment: Attachment) => await db.attachments.add(attachment),
	getManyByNoteId: async (id: string): Promise<Attachment[]> => {
		return db.attachments.where('noteId').equals(id).sortBy('createdAt');
	},
	put: async (attachment: Attachment) => {
		await db.attachments.put(attachment);
	},
	delete: async (id: string) => await db.attachments.delete(id)
};

export const noteService = {
	deleteNoteWithAttachments: async (noteId: string): Promise<void> => {
		return await db.transaction('rw', [db.notes, db.attachments], async () => {
			// 1. delete attachments of the note
			await db.attachments.where('noteId').equals(noteId).delete();

			// 2. delete the note itself
			await db.notes.delete(noteId);
		});
	}
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
	},

	deleteFullProject: async (projectId: string) => {
		return await db.transaction(
			'rw',
			[db.projects, db.columns, db.notes, db.attachments],
			async () => {
				const noteIds = await db.notes.where('projectId').equals(projectId).primaryKeys();

				// 1. delete attachments of notes in the project
				await db.attachments.where('noteId').anyOf(noteIds).delete();

				// 2. delete notes in the project
				await db.notes.where('projectId').equals(projectId).delete();

				// 3. delete columns in the project
				await db.columns.where('projectId').equals(projectId).delete();

				// 4. delete the project itself
				await db.projects.delete(projectId);
			}
		);
	}
};

export const backupService = {
	importBackup: async (backup: Backup) => {
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
	}
};
