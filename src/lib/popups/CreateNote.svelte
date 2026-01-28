<script lang="ts">
	import { dataActions } from '$lib/Actions';

	let { isOpen = $bindable(false), projectId = $bindable('') } = $props();

	let title: string = $state('');
	let color: string = $state('#fab005');
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (isOpen) {
			dialog.showModal();
		} else {
			dialog.close();
		}
	});

	function handleSubmit() {
		dataActions.createNote(projectId, title.trim(), color);
		title = '';
		isOpen = false;
	}
</script>

<dialog
	bind:this={dialog}
	onclose={() => (isOpen = false)}
	class="mt-[10%] h-fit w-1/2 justify-self-center rounded-2xl"
>
	<div class="flex h-full flex-col">
		<h1 class="m-4 text-2xl font-bold">Create a new note</h1>
		<hr class="border-gray-500" />

		<!-- svelte-ignore component_name_lowercase -->
		<form id="note-form" class="m-4 mx-16 space-y-4" onsubmit={handleSubmit}>
			<span><b>Title</b></span>
			<div>
				<input
					type="text"
					bind:value={title}
					class="w-full rounded-md border border-gray-500 focus:outline-none"
					required
					maxlength="25"
					placeholder="Note Title..."
				/>
			</div>
			<span><b>Color</b></span>
			<div>
				<input type="color" bind:value={color} />
			</div>
		</form>

		<div class="mx-8 mt-auto mb-6 flex justify-end gap-3">
			<button
				class="rounded-2xl bg-gray-500 p-4 font-bold text-white"
				onclick={() => (isOpen = false)}
			>
				Cancel
			</button>
			<button
				type="submit"
				form="note-form"
				class="rounded-2xl bg-green-500 p-4 font-bold text-white"
			>
				Create
			</button>
		</div>
	</div>
</dialog>
