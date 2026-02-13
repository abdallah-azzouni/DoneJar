<script lang="ts">
	import { dataActions } from '$lib/Actions';
	import { nanoid } from 'nanoid';
	import type { Note, Project } from '$lib/stores/userData';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import DeleteNConfermation from './DeleteNConfermation.svelte';
	import { userNotes, currentProject } from '$lib/stores/userData';

	let { isOpen = $bindable(false), note }: { isOpen: boolean; note: Note } = $props();

	let workingNote = $state<Note>({ ...note });
	let showDeleteNote = $state(false);

	$effect(() => {
		if (isOpen) {
			workingNote = {
				...note,
				color: note.color || '#fab005'
			};
		}
	});

	const projects = $userNotes.projects;

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (workingNote.id === '') {
			const newNote = { ...workingNote, id: nanoid() };
			dataActions.createNote(newNote);
		} else {
			dataActions.editNote(workingNote);
		}
		isOpen = false;
	}

	function handleCancel() {
		isOpen = false;
	}
</script>

<DeleteNConfermation bind:isOpen={showDeleteNote} {note} />
<ThemedDialog bind:isOpen>
	<div class="flex flex-row gap-4">
		<form class="space-y-4" onsubmit={handleSubmit}>
			<input
				type="text"
				class="doodle-border text-2xl font-bold"
				placeholder="Note title..."
				bind:value={workingNote.title}
				required
			/>
			<hr class=" border border-gray-500" />
			<textarea
				rows="8"
				name=""
				id=""
				class="doodle-border w-full resize-none"
				placeholder="Description..."
				bind:value={workingNote.description}
			></textarea>
			<div class="flex justify-end gap-3">
				<button
					class="rounded-2xl bg-gray-500 p-4 font-bold text-white"
					type="button"
					onclick={handleCancel}
				>
					Cancel
				</button>
				<button class="rounded-2xl bg-green-500 p-4 font-bold text-white" type="submit">
					Save
				</button>
			</div>
		</form>
		<div class=" w-1 bg-gray-500"></div>
		<div class="flex w-full flex-col gap-5">
			<span>Project</span>
			<span class="doodle-border w-full">{$currentProject.name}</span>
			<span class="doodle-border flex w-fit items-center gap-5 font-patrick-hand text-2xl"
				>Color <input type="color" bind:value={workingNote.color} /></span
			>
			<!-- <span class="doodle-border flex w-fit items-center gap-5 font-patrick-hand text-2xl"
				>Tags</span
			>
			<span class="doodle-border flex w-fit items-center gap-5 font-patrick-hand text-2xl"
				>Date
			</span> -->
			<button
				class="size-fit rounded-2xl bg-red-700 px-10 py-4 font-bold text-white"
				class:hidden={workingNote.id === ''}
				onclick={() => {
					isOpen = false;
					showDeleteNote = true;
				}}>Delete</button
			>
		</div>
	</div>
</ThemedDialog>
