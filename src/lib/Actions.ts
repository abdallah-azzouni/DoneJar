import { userNotes } from '$lib/stores/userData';
import { get } from 'svelte/store';
import { nanoid } from 'nanoid';

export const dataActions = {
	/*
		Creates a new project in the user's notes
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
		Deletes a project from the user's notes
		@param projectId: The id of the project to delete
		@returns void
	*/
	deleteProject: (projectId: any) => {
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
		Creates a new note in the user's notes
		@param projectId: The id of the project to add the note to
		@param title: The title of the note
		@param color: The color of the note
		@returns void
	*/
	createNote: (projectId: string, title: string, color: string) => {
		const newNote = {
			id: nanoid(),
			title,
			color,
			projectId
		};
		console.log(newNote);
		userNotes.update((state) => ({
			...state,
			projects: state.projects.map((p) =>
				p.id === projectId
					? { ...p, columns: { ...p.columns, todo: [...p.columns.todo, newNote] } }
					: p
			)
		}));
	}
};

export const uiActions = {
	createProject: () => {}
};
