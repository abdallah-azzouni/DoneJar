<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
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

<DropdownMenu.Root
	open={projectMenuStore.isOpen}
	onOpenChange={(open) => {
		if (!open) closeProjectMenu();
	}}
>
	<!-- 1. Portal directly to document body to escape parent stacking contexts -->
	<DropdownMenu.Portal to="body">
		<DropdownMenu.Content
			forceMount
			class="z-9999 focus:outline-none"
			style="position: fixed; top: {data?.position.y ?? 0}px; left: {data?.position.x ?? 0}px;"
>
			{#snippet child({ props, open })}
				{#if open}
					<div
						{...props}
						class="z-9999 flex w-48 flex-col overflow-hidden rounded-xl border-2 border-black bg-[#FDFBF7] shadow-[4px_4px_0px_rgba(0,0,0,0.15)]"
					>
						<DropdownMenu.Item
							class="w-full cursor-pointer border-b-2 border-black/5 px-4 py-3 text-left font-bold text-gray-800 transition-colors outline-none data-highlighted:bg-gray-200"
							onSelect={() => {
				closeProjectMenu();
				openProjectSetting(data?.project);
			}}
		>
			Edit Project
						</DropdownMenu.Item>

						<DropdownMenu.Item
							class="w-full cursor-pointer border-b-2 border-black/5 px-4 py-3 text-left font-bold text-gray-800 transition-colors outline-none data-highlighted:bg-gray-200"
							onSelect={() => {
				closeProjectMenu();
				openProjectMembers(data?.project);
			}}
		>
							Members
						</DropdownMenu.Item>

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
						</DropdownMenu.Item>
	</div>
				{/if}
			{/snippet}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
