<script>
	import ProjectMenu from '$lib/popups/ProjectMenu.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ProjectItem from '$lib/components/ProjectItem.svelte';
	import { projects, isLoaded } from '$lib/stores/userData';
	import Loading from '$lib/components/Loading.svelte';
	import CorruptDataDialog from '$lib/popups/CorruptDataDialog.svelte';
	import { page } from '$app/state';
	import { currentProjectId, currentProject } from '$lib/stores/currentProject';
	import { openProjectMenu } from '$lib/stores/projectMenuStore';
	import DeleteConfirmation from '$lib/popups/DeleteConfirmation.svelte';

	let { children } = $props();

	$effect(() => {
		currentProjectId.set(page.params.id ?? null);
	});
</script>

<svelte:head>
	{#if $currentProject}
		<title>DoneJar - {$currentProject.name}</title>
	{:else}
		<title>DoneJar - Track and organize your tasks</title>
	{/if}
</svelte:head>

<ProjectMenu />
<DeleteConfirmation />

{#if !$isLoaded}
	<Loading />
{:else if $projects.length === 0}
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
	<CorruptDataDialog />

	<div class="flex h-screen flex-col overflow-hidden">
		<AppHeader />
		<div class="flex flex-1 flex-row overflow-hidden">
			<!-- Project Sidebar -->
			<div class="hand-drawn-border doodle-border m-2 w-1/9 overflow-x-clip overflow-y-scroll">
				<div class="flex max-h-full flex-col items-center text-sm">
					{#each $projects as project (project.id)}
						<ProjectItem {project} />
					{/each}
				</div>
			</div>

			{@render children()}
		</div>
	</div>
{/if}
