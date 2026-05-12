import { writable } from 'svelte/store';
import type { Project } from '$lib/types';

export const currentProject = writable<Project | null>(null);
