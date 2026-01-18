<script lang="ts">
	import StickyNote from '$lib/components/StickyNote.svelte';
	import CreateNote from '$lib/popups/CreateNote.svelte';
	import ProjectMenu from '$lib/components/ProjectMenu.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CreateProject from '$lib/popups/CreateProject.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { isLoaded } from '$lib/stores/userData';
	import { userNotes } from '$lib/stores/userData';
	import { textColorFromHex } from '$lib/UiHelper';
	import 'doodle.css/doodle.css';

	import beaker from '$lib/assets/elements/beaker.png';

	const notes = $derived($userNotes);

	const currentProject = $derived(notes.projects.find((p) => p.id === notes.activeProjectId));

	let showCreateProject = $state(false);
	let showCreateNote = $state(false);
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
				<img
					src="src/lib/assets/elements/create-button.svg"
					alt="create"
					class="pointer-events-none select-none"
				/>
			</button>
		</div>
	</div>
{:else}
	<CreateNote bind:isOpen={showCreateNote} bind:projectId={currentProject.id} />
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

			<div class="m-2 flex w-4/9 flex-col items-centerz">
				<span class="font-patrick-hand text-7xl font-bold">TODO</span>
				<div class="doodle-border relative h-full w-full">
					{#each currentProject.columns.todo as note}
						<StickyNote title={note.title} color={note.color} />
					{/each}
					<button
						class="absolute right-0 bottom-0 m-2 size-15 cursor-pointer rounded-full border border-black bg-transparent p-2"
						onclick={() => (showCreateNote = true)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
							><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
								d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"
							/></svg
						>
					</button>
				</div>
			</div>
			<div class="m-2 flex w-2/9 flex-col items-center">
				<span class="font-patrick-hand text-7xl font-bold">DOING</span>
				<div class="doodle-border flex h-full w-full justify-center"></div>
			</div>
			<div class="m-2 w-2/9 self-end">
				<div><img src={beaker} alt="beaker" /></div>
			</div>
		</div>
	</div>
{/if}
