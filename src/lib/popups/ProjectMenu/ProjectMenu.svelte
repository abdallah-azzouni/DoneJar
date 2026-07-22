<script lang="ts">
	import { deleteProject } from '$lib/actions';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { confirmMenu } from '$lib/stores/dialog';
	import { projectStore } from '$lib/stores/projects.svelte';
	import {
		projectMenuStore,
		closeProjectMenu,
		openProjectMembers,
		openProjectSetting
	} from '$lib/stores/dialog';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';
	import { notify } from '$lib/stores/notificationStore';

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
				if (!data?.project?.id) {
					notify({ type: 'error', message: 'No project selected for deletion.' });
					return;
				}
				closeProjectMenu();
				confirmMenu({
					title: 'Delete Project?',
					body: `The "${data?.project?.name}" project and all of its tasks will be permanently deleted.`,
					actionLabel: 'Delete',
					actionColor: 'danger',
					onConfirm: async () => {
						const result = await deleteProject(data?.project?.id || '');
						if (result.type !== 'error') {
							projectStore.select(null);
							goto(resolve(ROUTES.APP));
						}
						return result;
					}
				});
			}}
		>
			Delete Project
		</button>
	</div>
</ThemedDialog>
