<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import { initLifecycle } from '$lib/lifecycle.svelte';
	import 'doodle.css/doodle.css';
	import { theme } from '$lib/stores/settings';

	$effect(() => {
		const mq = matchMedia('(prefers-color-scheme: dark)');
		const apply = () =>
			document.documentElement.classList.toggle(
				'dark',
				$theme === 'dark' || ($theme === 'system' && mq.matches)
			);
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	});

	initLifecycle();

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" /></svelte:head>
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
