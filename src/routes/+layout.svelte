<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import { initLifecycle } from '$lib/lifecycle.svelte';
	import 'doodle.css/doodle.css';
	import favicon from '$lib/assets/favicon.png';

	initLifecycle();

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
<Toaster
	position="bottom-right"
	toastOptions={{
		classes: {
			toast: 'bg-background text-foreground border-border border shadow-lg rounded-xl font-sans',
			title: 'text-sm font-medium',
			description: 'text-xs text-muted-foreground',
			closeButton: 'bg-background border-border text-foreground hover:bg-muted'
		}
	}}
/>
