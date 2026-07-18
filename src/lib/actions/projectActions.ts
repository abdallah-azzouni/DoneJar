import { nanoid } from 'nanoid';
import type { ActionResult } from '$lib/types';
import { createColumn } from '$lib/types';
import { failure, success } from '$lib/types';
import { validateProjectCreation } from '$lib/validators/projectValidators';
import { goto } from '$app/navigation';
import { ROUTES } from '$lib/constants';
import { resolve } from '$app/paths';
import { projectRepository, projectService } from '$lib/db/dal';
import type { ColumnDocType, ProjectDocType } from '$lib/db/schemas/index';

/**
 * Creates a new project and adds it to the projects store.
 * @param name the project name
 * @param type the project type, determines the initial column structure
 * @param color hex color string
 * @param customColumns only required if type is 'custom'; ignored otherwise
 * @returns ActionResult indicating success or failure and an accompanying message
 */
export async function createProject(
	name: string,
	type: 'default' | 'blank' | 'custom',
	color: string,
	maxCapacity: number,
	customColumns?: ColumnDocType[]
): Promise<ActionResult> {
	const validationResult = validateProjectCreation(type, customColumns);
	if (validationResult.type === 'error') return validationResult;

	const projectId = nanoid();

	let newColumns: ColumnDocType[] = [];
	if (type === 'default') {
		newColumns = [
			createColumn({ id: nanoid(), projectId, name: 'TODO', position: 0, specialType: 'inbox' }),
			createColumn({ id: nanoid(), projectId, name: 'DOING', position: 1 }),
			createColumn({ id: nanoid(), projectId, name: 'DONE', position: 2, specialType: 'jar' })
		];
	} else if (type === 'blank') {
		newColumns = [
			createColumn({ id: nanoid(), projectId, name: '', position: 0, specialType: 'inbox' })
		];
	} else if (type === 'custom') {
		newColumns = (customColumns || []).map((col, i) => ({
			...col,
			id: nanoid(),
			projectId,
			position: i
		}));
	}

	try {
		// Create project with columns
		const newProject: ProjectDocType = {
			id: projectId,
			name,
			type,
			color,
			maxCapacity,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		await projectService.createProjectWithColumns(newProject, newColumns);
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
export async function editProject(projectInfo: {
	name: string;
	color: string;
	id: string;
}): Promise<ActionResult> {
	try {
		await projectRepository.update({
			...projectInfo,
			updatedAt: new Date().toISOString()
		});
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
export async function deleteProject(projectId: string): Promise<ActionResult> {
	try {
		await projectRepository.deleteFullProject(projectId);
	} catch (error) {
		return failure(`Error deleting project: ${error}`);
	}
	return success('Project deleted successfully');
}
