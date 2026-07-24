<script lang="ts">
	import ProjectMenu from '$lib/popups/ProjectMenu/ProjectMenu.svelte';
	import ProjectSettings from '$lib/popups/ProjectMenu/ProjectSettings.svelte';
	import ProjectMembers from '$lib/popups/ProjectMenu/ProjectMembers.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { appStore, getAppState } from '$lib/stores/appState.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import ProjectSidebarContent from '$lib/components/ProjectSidebarContent.svelte';
	import { Dialog } from 'bits-ui';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { signOut } from '$lib/sb/auth';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { projectSideBarStore, projectMenuStore } from '$lib/stores/dialog';
	import ConfirmationMenu from '$lib/popups/ConfirmationMenu.svelte';
	import { notify } from '$lib/stores/notificationStore';
	import { MediaQuery } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let { children } = $props();

	let currentProjectId: string | null = null;

	const isDesktop = new MediaQuery('(min-width: 1024px)');

	$effect(() => {
		if (!projectSideBarStore.isOpen) {
			projectMenuStore.close();
		}
	});

	$effect(() => {
		if (isDesktop.current) {
			projectSideBarStore.open();
		} else {
			projectSideBarStore.close();
		}
	});

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
<ProjectSettings />
<ProjectMembers />
<ConfirmationMenu />

{#if !appStore.isLoaded || !projectStore.isReady}
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
				<Dialog.Root
					open={projectSideBarStore.isOpen}
					onOpenChange={(open) => {
						if (!open) projectSideBarStore.close();
					}}
				>
					<Dialog.Portal to="body">
						<Dialog.Overlay class="fixed inset-0 z-9997 bg-black/50 backdrop-blur-[1px]" />
						<Dialog.Content
							class="fixed top-20 left-2 z-9997 mt-10 h-[calc(100vh-130px)] w-40 rounded-2xl  p-6  shadow-lg"
						>
							<ProjectSidebarContent />
						</Dialog.Content>
						<Dialog.Overlay />
					</Dialog.Portal>
				</Dialog.Root>
			{/if}

			{@render children()}
		</div>
	</div>
{/if}
