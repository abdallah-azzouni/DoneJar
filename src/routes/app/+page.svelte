<script lang="ts">
	// components
	import ProjectItem from '$lib/components/ProjectItem.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import Board from '$lib/components/board.svelte';
	// popups
	import ProjectMenu from '$lib/popups/ProjectMenu.svelte';
	// stores
	import { isLoaded } from '$lib/stores/userData';
	import { userNotes, currentProject } from '$lib/stores/userData';
	// external libraries
	import 'doodle.css/doodle.css';
	const notes = $derived($userNotes);
	let showCreateProject = $state(false);
</script>

<svelte:head>
	{#if $currentProject}
		<title>DoneJar - {$currentProject.name}</title>
	{:else}
		<title>DoneJar - Track and organize your tasks</title>
	{/if}
</svelte:head>

<ProjectMenu bind:isOpen={showCreateProject} projectInfo={{ name: '', color: '', id: '' }} />
{#if !$isLoaded}
	<Loading />
{:else if notes.projects.length === 0 || $currentProject === undefined}
	<div
		class="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white px-6"
	>
		<div class="doodle-border max-w-2xl bg-white p-12 text-center shadow-xl">
			<h1 class="mb-4 font-patrick-hand text-6xl font-bold text-gray-900">Let's Get Started! 🎉</h1>
			<p class="mb-8 text-xl text-gray-600">
				Create your first project to start tracking tasks. Projects help you organize work, personal
				life, or anything else separately.
			</p>
			<button
				class="doodle-border bg-yellow-400 px-8 py-4 font-patrick-hand text-3xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
				onclick={() => (showCreateProject = true)}
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
		<AppHeader
			onCreateProject={() => (showCreateProject = true)}
			currentProjectName={$currentProject.name}
			currentProjectColor={$currentProject.color}
		/>
		<div class="flex flex-1 flex-row overflow-hidden">
			<div class="hand-drawn-border doodle-border m-2 w-1/9 overflow-x-clip overflow-y-scroll">
				<div class="flex max-h-full flex-col items-center text-sm">
					{#each notes.projects as project}
						<ProjectItem
							projectName={project.name}
							projectColor={project.color}
							projectId={project.id}
						/>
					{/each}
				</div>
			</div>
			<Board />
		</div>
	</div>
{/if}
