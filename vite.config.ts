import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			org: 'abdallah-azzouni-5f',
			project: 'donejar'
		}),
		tailwindcss(),
		sveltekit()
	],
	server: {
		hmr: false
	},
	ssr: {
		noExternal: ['svelte-sonner']
	},
	optimizeDeps: {
		include: ['svelte-sonner']
	}
});
