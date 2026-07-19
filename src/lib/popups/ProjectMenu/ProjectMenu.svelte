<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { confirmDelete } from '$lib/stores/dialog';
	import {
		projectMenuStore,
		closeProjectMenu,
		openProjectMembers,
		openProjectSetting
	} from '$lib/stores/dialog';

	let data = $derived(projectMenuStore.data);
</script>

<ThemedDialog
	isOpen={projectMenuStore.isOpen}
	onClose={closeProjectMenu}
	closeOnBackdrop={true}
	blur={false}
	w="w-48"
	h="h-fit"
	cls="shadow-[4px_4px_0px_rgba(0,0,0,0.15)] border-2 border-black rounded-xl overflow-hidden"
	pad="p-0"
	style="position: fixed; margin: 0; top: {data?.position.y}px; left: {data?.position.x}px;"
>
	<div class="flex flex-col bg-[#FDFBF7]">
		<button
			type="button"
			class="w-full border-b-2 border-black/5 px-4 py-3 text-left font-bold text-gray-800 transition-colors hover:bg-gray-200"
			onclick={() => {
				closeProjectMenu();
				openProjectSetting(data?.project);
			}}
		>
			Edit Project
		</button>

		<button
			type="button"
			class="w-full border-b-2 border-black/5 px-4 py-3 text-left font-bold text-gray-800 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
			disabled={true}
			onclick={() => {
				closeProjectMenu();
				openProjectMembers(data?.project);
			}}
		>
			Members ( Soon... )
		</button>

		<button
			type="button"
			class="w-full px-4 py-3 text-left font-bold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
			onclick={() => {
				closeProjectMenu();
				confirmDelete({
					type: 'projects',
					id: data?.project?.id || '',
					name: data?.project?.name || ''
				});
			}}
		>
			Delete Project
		</button>
	</div>
</ThemedDialog>
