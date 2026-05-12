<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';
	import { projects } from '$lib/stores/projects';

	onMount(() => {
		const all = $projects;
		if (all.length > 0) {
			goto(resolve(ROUTES.PROJECT(all[0].id)));
		} else {
			goto(resolve(ROUTES.APP));
		}
	});
</script>
