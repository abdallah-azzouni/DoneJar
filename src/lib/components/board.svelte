<script lang="ts">
	// components
	import StickyNote from '$lib/components/StickyNote.svelte';
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

	const flipDurationMs = 300;

	let itemsTodo = $state(currentProject.columns.todo);
	let itemsDoing = $state(currentProject.columns.doing);

	$effect(() => {
		itemsTodo = currentProject.columns.todo;
		itemsDoing = currentProject.columns.doing;
	});

	function handleDndConsiderTodo(e: any) {
		itemsTodo = e.detail.items;
	}
	function handleDndFinalizeTodo(e: any) {
		itemsTodo = e.detail.items;
		userNotes.update((state) => {
			const project = state.projects.find((p) => p.id === currentProject.id);
			if (project) project.columns.todo = e.detail.items;
			return state;
		});
	}

	function handleDndConsiderDoing(e: any) {
		itemsDoing = e.detail.items;
	}
	function handleDndFinalizeDoing(e: any) {
		itemsDoing = e.detail.items;
		userNotes.update((state) => {
			const project = state.projects.find((p) => p.id === currentProject.id);
			if (project) project.columns.doing = e.detail.items;
			return state;
		});
	}
</script>

<CreateNote bind:isOpen={showCreateNote} bind:projectId={currentProject.id} />
<div class={cls}>
	<div class="m-2 flex w-5/9 flex-col items-center">
		<span class="font-patrick-hand text-7xl font-bold">TODO</span>
		<div
			class="doodle-border relative h-full w-full"
			use:dndzone={{ items: itemsTodo, flipDurationMs: 0 }}
			onconsider={handleDndConsiderTodo}
			onfinalize={handleDndFinalizeTodo}
		>
			{#each itemsTodo as note (note.id)}
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
	<div class="m-2 flex w-3/9 flex-col items-center">
		<span class="font-patrick-hand text-7xl font-bold">DOING</span>
		<div
			class="doodle-border flex h-full w-full flex-col items-center"
			use:dndzone={{ items: itemsDoing, flipDurationMs: 0 }}
			onconsider={handleDndConsiderDoing}
			onfinalize={handleDndFinalizeDoing}
		>
			{#each itemsDoing as note (note.id)}
				<StickyNote title={note.title} color={note.color} />
			{/each}
		</div>
	</div>
	<div class="m-2 w-3/9 self-end">
		<div><img src={beaker} alt="beaker" /></div>
	</div>
</div>
