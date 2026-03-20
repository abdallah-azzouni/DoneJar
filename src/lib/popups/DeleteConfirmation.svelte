<script lang="ts">
	import { deleteProject, deleteNote } from '$lib/actions';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { notify } from '$lib/stores/notificationStore';
	import { deleteConfirmStore, closeDelete } from '$lib/stores/deleteConfirmStore';

	let target = $derived($deleteConfirmStore);
	let isOpen = $derived(target !== null);

	function handleDelete(e: Event) {
		e.preventDefault();
		if (!target) return;

		const result =
			target.type === 'project'
				? deleteProject(target.id)
				: deleteNote(target.id, target.projectId);

		if (result.type === 'error') {
			notify(result);
			return;
		}

		closeDelete();
	}
</script>

<ThemedDialog {isOpen} onClose={closeDelete}>
	<h1 class="m-4 text-2xl font-bold">
		Delete {target?.type === 'project' ? 'project' : 'note'}?
	</h1>
	<hr class="border-gray-500" />
	<div class="m-4 mx-16 space-y-4">
		<span>
			The <b>{target?.name}</b>
			{target?.type === 'project' ? 'project and all of its tasks' : 'note and all of its data'} will
			be permanently deleted.
		</span>
	</div>
	<div class="mx-8 mt-auto mb-6 flex justify-end gap-3">
		<button class="rounded-2xl bg-gray-500 p-4 font-bold text-white" onclick={closeDelete}>
			Cancel
		</button>
		<button class="rounded-2xl bg-red-700 p-4 font-bold text-white" onclick={handleDelete}>
			Delete
		</button>
	</div>
</ThemedDialog>
