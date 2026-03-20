import { nanoid } from 'nanoid';
import type { ActionResult, Column } from '$lib/types';
import { failure, success } from '$lib/types';
import { validateProjectCreation, validateProjectEdit } from '$lib/validators/projectValidators';
import { projects } from '$lib/stores/userData';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { currentProjectId } from '$lib/stores/currentProject';
import { ROUTES } from '$lib/constants';
import { resolve } from '$app/paths';

/**
 * Creates a new project and adds it to the projects store.
 * @param name the project name
 * @param type the project type, determines the initial column structure
 * @param color hex color string
 * @param customColumns only required if type is 'custom'; ignored otherwise
 * @returns ActionResult indicating success or failure and an accompanying message
 */
export function createProject(
	name: string,
	type: 'default' | 'blank' | 'custom',
	color: string,
	customColumns?: Column[]
): ActionResult {
	const validationResult = validateProjectCreation(name, type, color, customColumns);
	if (validationResult.type === 'error') return validationResult;

	let newColumns: Column[] = [];
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
		setActiveProject(newProject.id);
	} catch (error) {
		return failure(`Error during project creation: ${error}`);
	}

	return success('Project created successfully');
}

/**
 * Sets the active project
 * @param projectId the id of the project to set as active
 * @returns ActionResult indicating success or failure and an accompanying message
 */
export function setActiveProject(projectId: string): ActionResult {
	try {
		goto(resolve(ROUTES.PROJECT(projectId)));
		return success('Active project set successfully');
	} catch (error) {
		return failure(`Error setting active project: ${error}`);
	}
}

/**
 * Edits an existing project
 * @param projectInfo the new project data; must include the id of the project to edit
 * @returns ActionResult indicating success or failure and an accompanying message
 */
export function editProject(projectInfo: {
	name: string;
	color: string;
	id: string;
}): ActionResult {
	const validationResult = validateProjectEdit(projectInfo);
	if (validationResult.type === 'error') return validationResult;

	try {
		projects.update((state) =>
			state.map((p) =>
				p.id === projectInfo.id
					? { ...p, name: projectInfo.name, color: projectInfo.color, updatedAt: Date.now() }
					: p
			)
		);
	} catch (error) {
		return failure(`Error editing project: ${error}`);
	}
	return success('Project edited successfully');
}

/**
 * Deletes a project
 * @param projectId the id of the project to delete
 * @returns ActionResult indicating success or failure and an accompanying message
 */
export function deleteProject(projectId: string): ActionResult {
	try {
		const currentProjects = get(projects);
		const currentActiveId = get(currentProjectId);

		const deleteIndex = currentProjects.findIndex((p) => p.id === projectId);
		const updatedProjects = currentProjects.filter((p) => p.id !== projectId);
		projects.set(updatedProjects);

		// Update active project if we deleted the active one
		if (projectId === currentActiveId) {
			if (updatedProjects.length === 0) {
				goto(resolve(ROUTES.APP));
			} else {
				let newActiveId = '';
				const nextIndex = Math.min(deleteIndex, updatedProjects.length - 1);
				newActiveId = updatedProjects[nextIndex].id;
				setActiveProject(newActiveId);
			}
		}
	} catch (error) {
		return failure(`Error deleting project: ${error}`);
	}
	return success('Project deleted successfully');
}
