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
	import { openProjectMenu, projectSideBarStore } from '$lib/stores/dialog';
	import DeleteConfirmation from '$lib/popups/DeleteConfirmation.svelte';
	import { notify } from '$lib/stores/notificationStore';

	let { children } = $props();

	let currentProjectId: string | null = null;

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
		const projects = projectStore.projects;
		if (currentProjectId && projects) {
			const found = projects.find((p) => p.id === currentProjectId);
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

{#if !appStore.isLoaded}
	<Loading />
{:else if projectStore.projects.length == 0}
	<div
		class="flex h-screen flex-col items-center justify-center bg-linear-to-b from-amber-50 to-white px-6"
	>
		<div class="doodle-border max-w-2xl bg-white p-12 text-center shadow-xl">
			<h1 class="mb-4 font-patrick-hand text-6xl font-bold text-gray-900">Let's Get Started! 🎉</h1>
			<p class="mb-8 text-xl text-gray-600">
				Create your first project to start tracking tasks. Projects help you organize work, personal
				life, or anything else separately.
			</p>
			<button
				class="doodle-border bg-yellow-400 px-8 py-4 font-patrick-hand text-3xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
				onclick={() => openProjectMenu()}
			>
				Create Your First Project
			</button>
			<p class="mt-6 text-sm text-gray-500">
				Tip: Try naming it something like "Work" or "Personal"
			</p>
		</div>
	</div>
{:else}
	<div class="flex h-screen flex-col overflow-hidden">
		<AppHeader />
		<div class="flex flex-1 flex-row overflow-hidden">
			<!-- Desktop permanent sidebar -->
			<aside class="hand-drawn-border doodle-border m-2 hidden w-40 lg:flex lg:flex-col">
				<ProjectSidebarContent />
			</aside>

			<!-- Mobile overlay sidebar -->
			<div class="lg:hidden">
				<ThemedDialog
					isOpen={projectSideBarStore.isOpen}
					onClose={() => projectSideBarStore.close()}
					closeOnBackdrop={true}
					w="w-40"
					h="h-[86%]"
					mt="mt-25"
					cls="justify-self-start ml-2 border-2 border-dashed border-gray-500"
				>
					<ProjectSidebarContent />
				</ThemedDialog>
			</div>

			{@render children()}
		</div>
	</div>
{/if}
