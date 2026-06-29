<script lang="ts">
	import './layout.css';
	import Toast from '$lib/components/Toast.svelte';
	import { initLifecycle } from '$lib/lifecycle.svelte';
	import 'doodle.css/doodle.css';
	import favicon from '$lib/assets/favicon.png';

	initLifecycle();

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toast />
{@render children()}
