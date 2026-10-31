import { persisted } from 'svelte-persisted-store';

export type Theme = 'light' | 'dark' | 'system';
export const theme = persisted<Theme>('theme', 'light');
