<script lang="ts">
	import { dataActions } from '$lib/Actions';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import DeletePConfermation from './DeletePConfermation.svelte';

	let {
		isOpen = $bindable(false),
		projectInfo
	}: { isOpen: boolean; projectInfo: { name: string; color: string; id: string } } = $props();

	let newProject = $state(projectInfo);
	let showDeleteProject = $state(false);

	$effect(() => {
		if (isOpen) {
			newProject = {
				...projectInfo,
				color: projectInfo.color || '#495057'
			};
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (newProject.id === '') {
			dataActions.createProject(newProject.name.trim(), newProject.color);
			newProject = {
				name: '',
				color: '#495057',
				id: ''
			};
			isOpen = false;
		} else {
			newProject.name = newProject.name.trim();
			dataActions.editProject(newProject);
			isOpen = false;
		}
	}
</script>

<DeletePConfermation
	bind:isOpen={showDeleteProject}
	projectName={newProject.name}
	projectId={newProject.id}
/>
<ThemedDialog bind:isOpen>
	<h1 class="m-4 text-2xl font-bold">
		{#if newProject.id === ''}Create a new{:else}Edit
		{/if} project
	</h1>
	<hr class="border-gray-500" />

	<form class="m-4 mx-16 space-y-4" onsubmit={handleSubmit}>
		<span><b>Name</b></span>
		<div>
			<input
				type="text"
				bind:value={newProject.name}
				class="w-full rounded-md border border-gray-500 focus:outline-none"
				required
				maxlength="25"
				placeholder="Project Name..."
			/>
		</div>
		<span><b>Color</b></span>
		<div>
			<input type="color" bind:value={newProject.color} />
		</div>
		<div class="mx-8 mt-auto mb-6 flex justify-end gap-3">
			<div>
				<button
					class="size-fit rounded-2xl bg-red-700 p-4 font-bold text-white {newProject.id === ''
						? 'hidden'
						: ''}"
					onclick={() => {
						isOpen = false;
						showDeleteProject = true;
					}}>Delete</button
				>
			</div>
			<div>
				<button
					class="rounded-2xl bg-gray-500 p-4 font-bold text-white"
					type="button"
					onclick={() => (isOpen = false)}
				>
					Cancel
				</button>
				<button type="submit" class="rounded-2xl bg-green-500 p-4 font-bold text-white">
					{#if newProject.id === ''}Create{:else}Save{/if}
				</button>
			</div>
		</div>
	</form>
</ThemedDialog>
