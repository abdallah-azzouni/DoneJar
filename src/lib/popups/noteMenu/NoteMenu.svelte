<script lang="ts">
	import { dataActions } from '$lib/Actions';
	import type { Note } from '$lib/stores/userData';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import DeleteNConfermation from './DeleteNConfermation.svelte';
	import DatePicker from './DatePicker.svelte';
	import { currentProject } from '$lib/stores/userData';
	import QEditor from '$lib/components/QEditor.svelte';
	import { formatDueDate, isDueDatePast } from '$lib/UiHelper';

	let { isOpen = $bindable(false), note }: { isOpen: boolean; note: Note } = $props();

	// warning is ignored, we reset workingNote in effect.
	// svelte-ignore state_referenced_locally
	let workingNote = $state({ ...note });
	let showDeleteNote = $state(false);
	let showDatePicker = $state(false);

	$effect(() => {
		if (isOpen) {
			workingNote = { ...note };
		}
	});

	function handleSubmit() {
		if (workingNote.id === '') {
			dataActions.createNote(workingNote);
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
<DatePicker
	bind:isOpen={showDatePicker}
	initialDate={workingNote.dueDate}
	onSave={(date) => {
		workingNote.dueDate = date;
	}}
/>
<ThemedDialog bind:isOpen>
	<div class="flex flex-row gap-4">
		<form class="space-y-4" onsubmit={handleSubmit}>
			<input
				type="text"
				class="doodle-border w-full text-2xl font-bold outline-none"
				placeholder="Note title..."
				bind:value={workingNote.title}
				required
			/>
			<hr class=" border border-gray-500" />

			<!-- 
				{#key isOpen} forces QEditor to reinitialize when dialog opens/closes.
				This clears old descriptions on new notes, but recreates the editor every time.
				Performance impact is negligible now, but revisit if needed optimization.
				Alternative: track a {unique key} that only changes on actual note switches.
			-->
			{#key isOpen}
				<QEditor bind:description={workingNote.description} />
			{/key}

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
		<div class=" w-0.5 bg-gray-500"></div>
		<div class="flex w-fit flex-col gap-5 font-patrick-hand text-2xl">
			<span class="doodle-border">Project: {$currentProject.name}</span>
			<span class="doodle-border flex items-center gap-5"
				>Color <input type="color" bind:value={workingNote.color} /></span
			>
			<!-- <span class="doodle-border flex w-fit items-center gap-5 font-patrick-hand text-2xl"
				>Tags</span
		> -->
			<button
				class="doodle-border flex w-full justify-center"
				onclick={() => (showDatePicker = true)}
			>
				{#if workingNote.dueDate}
					<span class={isDueDatePast(workingNote.dueDate, new Date()) ? 'text-red-500' : ''}>
						{formatDueDate(workingNote.dueDate)}
					</span>
				{:else}
					Date
				{/if}
			</button>
			<button
				class="mt-auto size-fit rounded-2xl bg-red-700 px-10 py-4 font-bold text-white"
				class:hidden={workingNote.id === ''}
				onclick={() => {
					isOpen = false;
					showDeleteNote = true;
				}}>Delete</button
			>
		</div>
	</div>
</ThemedDialog>
