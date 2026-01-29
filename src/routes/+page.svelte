<script lang="ts">
	import createButton from '$lib/assets/elements/create-button.svg';

	// components
	import ProjectMenu from '$lib/components/ProjectMenu.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import Board from '$lib/components/board.svelte';

	// popups
	import CreateProject from '$lib/popups/CreateProject.svelte';

	// stores
	import { isLoaded } from '$lib/stores/userData';
	import { userNotes } from '$lib/stores/userData';

	// helpers
	import { textColorFromHex } from '$lib/UiHelper';

	// external libraries
	import 'doodle.css/doodle.css';

	const notes = $derived($userNotes);

	const currentProject = $derived(notes.projects.find((p) => p.id === notes.activeProjectId));

	let showCreateProject = $state(false);
</script>

<CreateProject bind:isOpen={showCreateProject} />

{#if !$isLoaded}
	<Loading />
{:else if notes.projects.length === 0 || currentProject === undefined}
	<div class="mt-[15%] flex h-screen flex-col items-center">
		<h1 class="font-patrick-hand text-7xl">Welcome to DoneJar</h1>

		<div class="flex flex-row items-center">
			<h3 class="font-patrick-hand text-3xl text-gray-500">Create your first project</h3>
			<button
				class="cursor-pointer border-none bg-transparent p-0"
				aria-label="Create new project"
				onclick={() => (showCreateProject = true)}
			>
				<img src={createButton} alt="create" class="pointer-events-none select-none" />
			</button>
		</div>
	</div>
{:else}
	<div class="flex h-screen flex-col overflow-hidden">
		<AppHeader
			onCreateProject={() => (showCreateProject = true)}
			{textColorFromHex}
			currentProjectName={currentProject.name}
			currentProjectColor={currentProject.color}
		/>
		<div class=" flex flex-1 flex-row">
			<div class=" hand-drawn-border doodle-border m-2 h-0 min-h-full w-1/9 overflow-y-scroll">
				<div class="flex flex-col items-center text-sm">
					{#each notes.projects as project}
						<ProjectMenu
							projectName={project.name}
							projectColor={project.color}
							{textColorFromHex}
							projectId={project.id}
							currentProject={currentProject.id}
						/>
					{/each}
				</div>
			</div>
			<Board cls={'flex flex-row w-full'} {currentProject} />
		</div>
	</div>
{/if}
