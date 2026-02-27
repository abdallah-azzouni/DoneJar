import { userNotes, type Note } from '$lib/stores/userData';
import { nanoid } from 'nanoid';

export const dataActions = {
	/*
		Creates a new project
		@param name: The name of the project
		@param color: The color of the project
		@returns void
	*/
	createProject: (name: string, color: string) => {
		const newProject = {
			id: nanoid(),
			name,
			color,
			columns: { todo: [], doing: [], done: [] }
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
			projects: state.projects
				.map((p) => (p.id === projectInfo.id ? { ...p, name: projectInfo.name } : p))
				.map((p) => (p.id === projectInfo.id ? { ...p, color: projectInfo.color } : p))
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
	createNote: (note: Note) => {
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
					? { ...p, columns: { ...p.columns, todo: [...p.columns.todo, newNote] } }
					: p
			)
		}));
	},

	/*
		Edit a note
		@param note: The new note data
		@returns void
	*/
	editNote: (note: Note) => {
		if (!note.createdAt) {
			note.createdAt = Date.now();
		}
		note.updatedAt = Date.now();
		userNotes.update((state) => ({
			...state,
			projects: state.projects.map((project) => {
				if (project.id !== note.projectId) return project;

				const updateColumn = (column: Note[]) => column.map((n) => (n.id === note.id ? note : n));

				return {
					...project,
					columns: {
						todo: updateColumn(project.columns.todo),
						doing: updateColumn(project.columns.doing),
						done: updateColumn(project.columns.done)
					}
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

				const removeNote = (column: Note[]) => column.filter((n) => n.id !== noteId);

				return {
					...project,
					columns: {
						todo: removeNote(project.columns.todo),
						doing: removeNote(project.columns.doing),
						done: removeNote(project.columns.done)
					}
				};
			})
		}));
	}
};
