import {
	userNotes,
	type NoteInterface,
	type Column,
	type ProjectInterface
} from '$lib/stores/userData';
import { nanoid } from 'nanoid';

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
	) => {
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
				alert('Error during project creation: Custom projects must have at least 1 column');
				return;
			}
		} else {
			alert('Error during project creation: Invalid project type');
			return;
		}
		const newProject = {
			id: nanoid(),
			name,
			type,
			color,
			columns: newColumns,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		userNotes.update((state) => ({
			...state,
			projects: [...state.projects, newProject],
			activeProjectId: newProject.id
		}));
	},

	setActiveProject: (projectId: string) => {
		userNotes.update((state) => ({
			...state,
			activeProjectId: projectId
		}));
	},

	/*
		Edits a project
		@param project: The new project data
		@returns void
	*/
	editProject: (projectInfo: { name: string; color: string; id: string }) => {
		userNotes.update((state) => ({
			...state,
			projects: state.projects.map((p) =>
				p.id === projectInfo.id
					? { ...p, name: projectInfo.name, color: projectInfo.color, updatedAt: Date.now() }
					: p
			)
		}));
	},

	/*
		Deletes a project
		@param projectId: The id of the project to delete
		@returns void
	*/
	deleteProject: (projectId: string) => {
		userNotes.update((state) => {
			const { projects, activeProjectId } = state;

			// State 1: Not deleting the active project
			if (projectId !== activeProjectId) {
				return {
					...state,
					projects: projects.filter((p) => p.id !== projectId)
				};
			}

			// State 2: Deleting the active project
			const deleteIndex = projects.findIndex((p) => p.id === projectId);
			const updatedProjects = projects.filter((p) => p.id !== projectId);

			let newActiveId = null;
			if (updatedProjects.length > 0) {
				const nextIndex = Math.min(deleteIndex, updatedProjects.length - 1); // Prevent going out of bounds
				newActiveId = updatedProjects[nextIndex].id;
			}

			return {
				...state,
				projects: updatedProjects,
				activeProjectId: newActiveId
			};
		});
	},

	/*
		Creates a new note
		@param projectId: The id of the project to add the note to
		@param title: The title of the note
		@param color: The color of the note
		@returns void
	*/
	createNote: (note: NoteInterface, columnIndex: number = 0) => {
		const newNote = {
			id: nanoid(),
			title: note.title,
			color: note.color,
			projectId: note.projectId,
			description: note.description,
			dueDate: note.dueDate,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		userNotes.update((state) => ({
			...state,
			projects: state.projects.map((p) =>
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
		}));
	},

	/*
		Edit a note
		@param note: The new note data
		@returns void
	*/
	editNote: (note: NoteInterface) => {
		if (!note.createdAt) {
			note.createdAt = Date.now();
		}
		note.updatedAt = Date.now();
		userNotes.update((state) => ({
			...state,
			projects: state.projects.map((project) => {
				if (project.id !== note.projectId) return project;

				return {
					...project,
					updatedAt: Date.now(),
					columns: project.columns.map((col) => ({
						...col,
						notes: col.notes.map((n) => (n.id === note.id ? note : n))
					}))
				};
			})
		}));
	},

	/*
		Deletes a note
		@param noteId: The id of the note to delete
		@param projectId: The id of the project the note belongs to
		@returns void
	*/
	deleteNote: (noteId: string, projectId: string) => {
		userNotes.update((state) => ({
			...state,
			projects: state.projects.map((project) => {
				if (project.id !== projectId) return project;

				return {
					...project,
					updatedAt: Date.now(),
					columns: project.columns.map((col) => ({
						...col,
						notes: col.notes.filter((n) => n.id !== noteId)
					}))
				};
			})
		}));
	}
};
