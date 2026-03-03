<script lang="ts">
	import './layout.css';
	import Toast from '$lib/components/Toast.svelte';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toast />
{@render children()}
