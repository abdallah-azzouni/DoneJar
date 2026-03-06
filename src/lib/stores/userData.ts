import { browser } from '$app/environment';
import { persisted } from 'svelte-persisted-store';
import { derived, writable } from 'svelte/store';
import { notify } from './notificationStore';
import type { Project } from '$lib/types';

export const isLoaded = writable(browser);

const defaultProjects = <Project[]>[];
const defaultActiveProjectId = '';

//Validation function to check if data corrupted
function isValidData(val: unknown): boolean {
	try {
		if (val === null || val === undefined) return false;
		if (!Array.isArray(val)) return false;

		for (const project of val) {
			if (typeof project !== 'object' || project === null) return false;
			if (typeof project.id !== 'string') return false;
			if (typeof project.name !== 'string') return false;
			if (!['default', 'blank', 'custom'].includes(project.type)) return false;
			if (typeof project.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(project.color))
				return false;
			if (typeof project.createdAt !== 'number') return false;
			if (typeof project.updatedAt !== 'number') return false;
			if (!Array.isArray(project.columns)) return false;

			for (const column of project.columns) {
				if (typeof column !== 'object' || column === null) return false;
				if (typeof column.name !== 'string') return false;
				if (!Array.isArray(column.notes)) return false;
				if (
					column.specialType !== undefined &&
					column.specialType !== null &&
					column.specialType !== 'jar' &&
					column.specialType !== 'inbox'
				)
					return false;

				for (const note of column.notes) {
					if (typeof note !== 'object' || note === null) return false;
					if (typeof note.id !== 'string') return false;
					if (typeof note.title !== 'string') return false;
					if (typeof note.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(note.color)) return false;
					if (typeof note.projectId !== 'string') return false;
					if (typeof note.createdAt !== 'number') return false;
					if (typeof note.updatedAt !== 'number') return false;

					// Validate description is a Delta-like object with ops array
					if (typeof note.description !== 'object' || note.description === null) return false;
					if (!Array.isArray(note.description.ops)) return false;

					for (const op of note.description.ops) {
						if (typeof op !== 'object' || op === null) return false;
						if (
							op.insert !== undefined &&
							typeof op.insert !== 'string' &&
							typeof op.insert !== 'object'
						)
							return false;
					}

					// Validate dueDate
					if (note.dueDate !== null) {
						if (typeof note.dueDate !== 'object') return false;
						if (typeof note.dueDate.timestamp !== 'number') return false;
						if (typeof note.dueDate.hasTime !== 'boolean') return false;
					}
				}
			}
		}

		return true;
	} catch {
		return false;
	}
}

export const projects = persisted('projects', defaultProjects, {
	beforeRead: (val) => {
		if (!isValidData(val)) {
			notify({
				success: false,
				message: 'Saved data is corrupted. Data has been reset.',
				type: 'error'
			});
			return defaultProjects;
		}
		return val;
	},
	onWriteError: () => {
		notify({
			success: false,
			message: 'Failed to save data. Storage may be full or unavailable.',
			type: 'error'
		});
	},
	onParseError: () => {
		notify({
			success: false,
			message: 'Saved data is corrupted. Data has been reset.',
			type: 'error'
		});
	}
});

export const activeProjectId = persisted('activeProjectId', defaultActiveProjectId);

export const currentProject = derived(
	[projects, activeProjectId],
	([$projects, $activeProjectId]) => $projects.find((p) => p.id === $activeProjectId) || null
);
