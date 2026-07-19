<script lang="ts">
	import { deleteProject, deleteNote } from '$lib/actions';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { notify } from '$lib/stores/notificationStore';
	import { deleteConfirmStore, closeDelete } from '$lib/stores/dialog';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';

	let target = $derived(deleteConfirmStore.data);
	let isOpen = $derived(deleteConfirmStore.isOpen);

	async function handleDelete(e: Event) {
		e.preventDefault();
		if (!target) return;

		let result;

		if (target.type === 'projects' && projectStore.projects) {
			result = await deleteProject(target.id);
			projectStore.select(null);
			goto(resolve(ROUTES.APP));

			if (result.type === 'error') {
				notify(result);
				return;
			}
		} else {
			result = await deleteNote(target.id);
			if (result.type === 'error') {
				notify(result);
				return;
			}
		}

		closeDelete();
	}
</script>

<ThemedDialog {isOpen} onClose={closeDelete}>
	<h1 class="m-4 text-2xl font-bold">
		Delete {target?.type === 'projects' ? 'project' : 'note'}?
	</h1>
	<hr class="border-gray-500" />
	<div class="m-4 mx-16 space-y-4">
		<span>
			The <b>{target?.name}</b>
			{target?.type === 'projects' ? 'project and all of its tasks' : 'note and all of its data'} will
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
