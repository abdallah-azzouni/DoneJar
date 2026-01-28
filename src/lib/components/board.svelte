<script lang="ts">
	// components
	import StickyNote from '$lib/components/StickyNote.svelte';
	import Crumple from '$lib/components/Crumple.svelte';
	import BeakerPhysics from './BeakerPhysics.svelte';
	// popups
	import CreateNote from '$lib/popups/CreateNote.svelte';
	// external libraries
	import { dndzone } from 'svelte-dnd-action';
	// assets
	import beaker from '$lib/assets/elements/beaker.png';
	// stores
	import { userNotes } from '$lib/stores/userData';

	let { cls, currentProject } = $props();
	let showCreateNote = $state(false);

	let BeakerWidth = $state(0);
	let BeakerHeight = $state(0);

	const flipDurationMs = 300;

	function handleDnd(column: 'todo' | 'doing' | 'done', type: 'consider' | 'finalize', e: any) {
		const items = e.detail.items;

		// 1. Update the local reactive state immediately
		if (column === 'todo') itemsTodo = items;
		if (column === 'doing') itemsDoing = items;
		if (column === 'done') itemsDone = items; // This triggers the BeakerPhysics effect

		// 2. Persist to store
		if (type === 'finalize') {
			userNotes.update((state) => {
				const project = state.projects.find((p) => p.id === currentProject.id);
				if (project) {
					project.columns[column] = items;
				}
				return state;
			});
		}
	}

	let itemsTodo = $state(currentProject.columns.todo);
	let itemsDoing = $state(currentProject.columns.doing);
	let itemsDone = $state(currentProject.columns.done);

	$effect(() => {
		itemsTodo = currentProject.columns.todo;
		itemsDoing = currentProject.columns.doing;
		itemsDone = currentProject.columns.done;
	});
</script>

<CreateNote bind:isOpen={showCreateNote} bind:projectId={currentProject.id} />
<div class={cls}>
	<div class="relative m-2 flex w-5/9 flex-col items-center">
		<span class="font-patrick-hand text-7xl font-bold">TODO</span>
		<div
			class="doodle-border relative h-full w-full"
			use:dndzone={{ items: itemsTodo, flipDurationMs: flipDurationMs }}
			onconsider={(e) => handleDnd('todo', 'consider', e)}
			onfinalize={(e) => handleDnd('todo', 'finalize', e)}
		>
			{#each itemsTodo as note (note.id)}
				<StickyNote title={note.title} color={note.color} />
			{/each}
		</div>
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
	<div class="m-2 flex w-3/9 flex-col items-center">
		<span class="font-patrick-hand text-7xl font-bold">DOING</span>
		<div
			class="doodle-border flex h-full w-full flex-col items-center"
			use:dndzone={{ items: itemsDoing, flipDurationMs: flipDurationMs }}
			onconsider={(e) => handleDnd('doing', 'consider', e)}
			onfinalize={(e) => handleDnd('doing', 'finalize', e)}
		>
			{#each itemsDoing as note (note.id)}
				<StickyNote title={note.title} color={note.color} />
			{/each}
		</div>
	</div>
	<div class="relative m-2 aspect-777/1024 w-3/9 justify-end self-end">
		<div
			class="relative flex items-center justify-center border-2 border-dashed border-gray-400 p-16"
			use:dndzone={{ items: itemsDone, flipDurationMs: flipDurationMs }}
			onconsider={(e) => handleDnd('done', 'consider', e)}
			onfinalize={(e) => handleDnd('done', 'finalize', e)}
		>
			{#each itemsDone as note (note.id)}
				<div
					class="pointer-events-none absolute top-0 left-0 size-10 opacity-0"
					data-id={note.id}
				></div>
			{/each}

			<span class="pointer-events-none absolute z-0 object-contain text-gray-400">
				Drop notes here!
			</span>
		</div>

		<div
			class="relative aspect-777/1024 w-full"
			bind:clientWidth={BeakerWidth}
			bind:clientHeight={BeakerHeight}
		>
			<button class="size-full">
				<BeakerPhysics items={itemsDone} width={BeakerWidth} height={BeakerHeight} />

				<img src={beaker} alt="beaker" class="pointer-events-none h-full w-full" />
			</button>
		</div>
	</div>
</div>
