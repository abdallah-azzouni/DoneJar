import { projects, activeProjectId } from '$lib/stores/userData';
import { nanoid } from 'nanoid';
import { get } from 'svelte/store';
import Delta from 'quill-delta';
import type { ActionResult, Column, Note } from '$lib/types';

export const dataActions = {
	/*
		Creates a new project
		@param name: The name of the project
		@param color: The color of the project
		@returns void
	*/
	createProject: (
		name: string,
		type: 'default' | 'blank' | 'custom',
		color: string,
		customColumns?: Column[]
	): ActionResult => {
		if (name.length > 100)
			return {
				success: false,
				message: 'Project name cannot be longer than 100 characters',
				type: 'error'
			};
		if (name.trim().length === 0) {
			return { success: false, message: 'Project name cannot be empty', type: 'error' };
		}
		let newColumns: Column[];
		if (type === 'default') {
			newColumns = [
				{ name: 'TODO', notes: [], specialType: 'inbox' },
				{ name: 'DOING', notes: [] },
				{ name: 'DONE', notes: [], specialType: 'jar' }
			];
		} else if (type === 'blank') {
			newColumns = [{ name: '', notes: [], specialType: 'inbox' }];
		} else if (type === 'custom') {
			newColumns = customColumns || [];
			if (newColumns.length === 0) {
				return {
					success: false,
					message: 'Custom projects must have at least 1 column',
					type: 'error'
				};
			}
		} else {
			return {
				success: false,
				message: 'Invalid project type',
				type: 'error'
			};
		}

		try {
			const newProject = {
				id: nanoid(),
				name,
				type,
				color,
				columns: newColumns,
				createdAt: Date.now(),
				updatedAt: Date.now()
			};
			projects.update((state) => [...state, newProject]);
			activeProjectId.set(newProject.id);
		} catch (error) {
			return { success: false, message: `Error during project creation: ${error}`, type: 'error' };
		}

		return { success: true, message: 'Project created successfully', type: 'success' };
	},

	setActiveProject: (projectId: string): ActionResult => {
		try {
			activeProjectId.set(projectId);
		} catch (error) {
			return { success: false, message: `Error setting active project: ${error}`, type: 'error' };
		}
		return { success: true, message: 'Active project set successfully', type: 'success' };
	},

	/*
		Edits a project
		@param project: The new project data
		@returns void
	*/
	editProject: (projectInfo: { name: string; color: string; id: string }): ActionResult => {
		if (projectInfo.name.length > 100)
			return {
				success: false,
				message: 'Project name cannot be longer than 100 characters',
				type: 'error'
			};
		if (projectInfo.name.trim().length === 0) {
			return { success: false, message: 'Project name cannot be empty', type: 'error' };
		}

		try {
			projects.update((state) =>
				state.map((p) =>
					p.id === projectInfo.id
						? { ...p, name: projectInfo.name, color: projectInfo.color, updatedAt: Date.now() }
						: p
				)
			);
		} catch (error) {
			return { success: false, message: `Error editing project: ${error}`, type: 'error' };
		}
		return { success: true, message: 'Project edited successfully', type: 'success' };
	},

	/*
		Deletes a project
		@param projectId: The id of the project to delete
		@returns void
	*/
	deleteProject: (projectId: string): ActionResult => {
		try {
			const currentProjects = get(projects);
			const currentActiveId = get(activeProjectId);

			const deleteIndex = currentProjects.findIndex((p) => p.id === projectId);
			const updatedProjects = currentProjects.filter((p) => p.id !== projectId);
			projects.set(updatedProjects);

			// Update active project if we deleted the active one
			if (projectId === currentActiveId) {
				let newActiveId = '';
				if (updatedProjects.length > 0) {
					const nextIndex = Math.min(deleteIndex, updatedProjects.length - 1);
					newActiveId = updatedProjects[nextIndex].id;
				}
				activeProjectId.set(newActiveId);
			}
		} catch (error) {
			return { success: false, message: `Error deleting project: ${error}`, type: 'error' };
		}
		return { success: true, message: 'Project deleted successfully', type: 'success' };
	},

	/*
		Creates a new note
		@param projectId: The id of the project to add the note to
		@param title: The title of the note
		@param color: The color of the note
		@returns void
	*/
	createNote: (note: Note, columnIndex: number = 0): ActionResult => {
		if (note.title.length > 100)
			return {
				success: false,
				message: 'Note title cannot be longer than 100 characters',
				type: 'error'
			};
		if (note.title.trim().length === 0) {
			return { success: false, message: 'Note title cannot be empty', type: 'error' };
		}
		try {
			const newNote = {
				id: nanoid(),
				title: note.title,
				color: note.color,
				projectId: note.projectId,
				description: note.description,
				dueDate: note.dueDate,
				priority: note.priority,
				createdAt: Date.now(),
				updatedAt: Date.now()
			};
			projects.update((state) =>
				state.map((p) =>
					p.id === note.projectId
						? {
								...p,
								updatedAt: Date.now(),
								columns: p.columns.map((col, i) =>
									i === columnIndex ? { ...col, notes: [...col.notes, newNote] } : col
								)
							}
						: p
				)
			);
		} catch (error) {
			return { success: false, message: `Error creating note: ${error}`, type: 'error' };
		}
		return { success: true, message: 'Note created successfully', type: 'success' };
	},

	/*
		Edit a note
		@param note: The new note data
		@returns void
	*/
	editNote: (note: Note): ActionResult => {
		// use updated to avoid mutation.
		const updated = {
			...note,
			dueDate: note.dueDate ? { ...note.dueDate } : null,
			description: new Delta(note.description.ops),
			updatedAt: Date.now(),
			createdAt: note.createdAt || Date.now()
		};
		if (updated.title.length > 100) {
			return {
				success: false,
				message: 'Note title cannot be longer than 100 characters',
				type: 'error'
			};
		}
		if (note.title.trim().length === 0) {
			return { success: false, message: 'Note title cannot be empty', type: 'error' };
		}
		try {
			if (!updated.createdAt) {
				updated.createdAt = Date.now();
			}
			updated.updatedAt = Date.now();
			projects.update((state) =>
				state.map((project) => {
					if (project.id !== updated.projectId) return project;

					return {
						...project,
						updatedAt: Date.now(),
						columns: project.columns.map((col) => ({
							...col,
							notes: col.notes.map((n: Note) => (n.id === updated.id ? updated : n))
						}))
					};
				})
			);
		} catch (error) {
			return { success: false, message: `Error editing note: ${error}`, type: 'error' };
		}
		return { success: true, message: 'Note edited successfully', type: 'success' };
	},

	/*
		Deletes a note
		@param noteId: The id of the note to delete
		@param projectId: The id of the project the note belongs to
		@returns void
	*/
	deleteNote: (noteId: string, projectId: string): ActionResult => {
		try {
			projects.update((state) =>
				state.map((project) => {
					if (project.id !== projectId) return project;
					return {
						...project,
						updatedAt: Date.now(),
						columns: project.columns.map((col) => ({
							...col,
							notes: col.notes.filter((n: Note) => n.id !== noteId)
						}))
					};
				})
			);
		} catch (error) {
			return { success: false, message: `Error deleting note: ${error}`, type: 'error' };
		}
		return { success: true, message: 'Note deleted successfully', type: 'success' };
	},

	reorderColumnNotes: (projectId: string, columnIndex: number, notes: Note[]): ActionResult => {
		try {
			projects.update((state) =>
				state.map((p) =>
					p.id === projectId
						? {
								...p,
								updatedAt: Date.now(),
								columns: p.columns.map((col, i) => (i === columnIndex ? { ...col, notes } : col))
							}
						: p
				)
			);
		} catch (error) {
			return { success: false, message: `Error reordering notes: ${error}`, type: 'error' };
		}
		return { success: true, message: 'Notes reordered successfully', type: 'success' };
	}
};
