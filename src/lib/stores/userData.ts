
import { persisted } from 'svelte-persisted-store';
import { browser } from '$app/environment';

export let isLoaded = false;

if (browser) {
    isLoaded = true;
}

export const userNotes = persisted('userNotes', {
  activeProjectId: '',
  projects : <any>[]
});