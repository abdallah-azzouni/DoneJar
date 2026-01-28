import { userNotes } from '$lib/stores/userData';
import { get } from 'svelte/store';
import { nanoid } from 'nanoid';

export const dataActions = {
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
