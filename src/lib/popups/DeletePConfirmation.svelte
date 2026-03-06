<script lang="ts">
	import { dataActions } from '$lib/Actions';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { notify } from '$lib/stores/notificationStore';

	let { isOpen = $bindable(false), projectName, projectId } = $props();

	let capturedProjectId = $state('');
	let capturedProjectName = $state('');

	$effect(() => {
		if (isOpen) {
			capturedProjectId = projectId;
			capturedProjectName = projectName;
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		const result = dataActions.deleteProject(capturedProjectId);
		if (!result.success) notify(result);
		if (result.success) isOpen = false;
	}
</script>

<ThemedDialog bind:isOpen>
	<h1 class="m-4 text-2xl font-bold">Delete project?</h1>
	<hr class="border-gray-500" />

	<div class="m-4 mx-16 space-y-4">
		<span
			>The <b>{capturedProjectName}</b> project and all of its tasks will be permanently deleted.</span
		>
	</div>

	<div class="mx-8 mt-auto mb-6 flex justify-end gap-3">
		<button
			class="rounded-2xl bg-gray-500 p-4 font-bold text-white"
			onclick={() => (isOpen = false)}
		>
			Cancel
		</button>
		<button class="rounded-2xl bg-red-700 p-4 font-bold text-white" onclick={handleSubmit}>
			Delete
		</button>
	</div>
</ThemedDialog>
