<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';
	import { projectStore } from '$lib/stores/projects.svelte';

	onMount(() => {
		const all = projectStore.projects ?? [];
		if (all.length > 0) {
			goto(resolve(ROUTES.PROJECT(all[0].id)));
		} else {
			goto(resolve(ROUTES.APP));
		}
	});
</script>
