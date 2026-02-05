<script lang="ts">
	import { dataActions } from '$lib/Actions';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';

	let { isOpen = $bindable(false) } = $props();

	let project_name: string = $state('');
	let project_color: string = $state('#495057');

	function handleSubmit() {
		dataActions.createProject(project_name.trim(), project_color);
		project_name = '';
		isOpen = false;
	}
</script>

<ThemedDialog bind:isOpen>
	<h1 class="m-4 text-2xl font-bold">Create a new project</h1>
	<hr class="border-gray-500" />

	<!-- svelte-ignore component_name_lowercase -->
	<form id="project-form" class="m-4 mx-16 space-y-4" onsubmit={handleSubmit}>
		<span><b>Name</b></span>
		<div>
			<input
				type="text"
				bind:value={project_name}
				class="w-full rounded-md border border-gray-500 focus:outline-none"
				required
				maxlength="25"
				placeholder="Project Name..."
			/>
		</div>
		<span><b>Color</b></span>
		<div>
			<input type="color" bind:value={project_color} />
		</div>
	</form>

	<div class="mx-8 mt-auto mb-6 flex justify-end gap-3">
		<button
			class="rounded-2xl bg-gray-500 p-4 font-bold text-white"
			onclick={() => (isOpen = false)}
		>
			Cancel
		</button>
		<button
			type="submit"
			form="project-form"
			class="rounded-2xl bg-green-500 p-4 font-bold text-white"
		>
			Create
		</button>
	</div>
</ThemedDialog>
