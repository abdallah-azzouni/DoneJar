<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';

	onMount(() => {
		goto(resolve(ROUTES.APP));
	});
</script>
