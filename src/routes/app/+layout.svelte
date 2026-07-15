<script lang="ts">
	import ProjectMenu from '$lib/popups/ProjectMenu.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { appStore, getAppState } from '$lib/stores/appState.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import ProjectSidebarContent from '$lib/components/ProjectSidebarContent.svelte';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { signOut } from '$lib/sb/auth';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { projectSideBarStore } from '$lib/stores/dialog';
	import DeleteConfirmation from '$lib/popups/DeleteConfirmation.svelte';
	import { notify } from '$lib/stores/notificationStore';
	import { projectColumnsStore } from '$lib/stores/projectColumnsStore.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let { children } = $props();

	let currentProjectId: string | null = null;

	const isDesktop = new MediaQuery('(min-width: 1024px)');

	$effect(() => {
		const state = getAppState();
		if (state == 'LOGGED_OUT') {
			signOut().then(() => {
				goto(resolve('/auth/login'));
			});
		}
	});

	$effect(() => {
		currentProjectId = page.params.id ?? null;
		if (currentProjectId && projectStore.isReady) {
			const found = projectStore.projects.find((p) => p.id === currentProjectId);
			if (!found) {
				currentProjectId = null;
				notify({ type: 'error', message: 'The project you are looking for does not exist.' });
			} else {
				projectStore.select(found.id);
			}
		}
	});
</script>

<svelte:head>
	{#if projectStore.current}
		<title>DoneJar - {projectStore.current.name}</title>
	{:else}
		<title>DoneJar - Track and organize your tasks</title>
	{/if}
</svelte:head>

<ProjectMenu />
<DeleteConfirmation />

{#if !appStore.isLoaded || !projectStore.isReady || !projectColumnsStore.isReady}
	<Loading />
{:else}
	<div class="flex h-screen flex-col overflow-hidden">
		<AppHeader />
		<div class="flex flex-1 flex-row overflow-hidden">
			{#if isDesktop.current}
				<!-- Desktop permanent sidebar -->

				{#if projectSideBarStore.isOpen}
					<aside
						transition:fly={{ x: -100, duration: 200, easing: quintOut }}
						class="hand-drawn-border doodle-border m-2 flex w-40 flex-col bg-[#E6DEC9]"
					>
						<ProjectSidebarContent />
					</aside>
				{/if}
			{:else}
				<!-- Mobile overlay sidebar -->
				<div class="bg-[#E6DEC9]">
					<ThemedDialog
						isOpen={projectSideBarStore.isOpen}
						onClose={() => projectSideBarStore.close()}
						closeOnBackdrop={true}
						w="w-40"
						h="h-[calc(100vh-108px)]"
						mt="mt-25"
						cls="justify-self-start ml-2 border-2 border-dashed border-gray-500"
					>
						<ProjectSidebarContent />
					</ThemedDialog>
				</div>
			{/if}

			{@render children()}
		</div>
	</div>
{/if}
