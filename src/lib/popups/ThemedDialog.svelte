<script lang="ts">
	let {
		w = 'w-2/3',
		h = 'max-h-3/4',
		mt = 'mt-[5%]',
		isOpen = $bindable(false),
		children
	} = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (isOpen) {
			dialog.showModal();
		} else {
			dialog.close();
		}
	});

	function closeDialog() {
		isOpen = false;
	}
</script>

<dialog
	bind:this={dialog}
	onclose={closeDialog}
	class="{mt} {h} {w} justify-self-center rounded-2xl bg-white p-6 shadow-lg"
>
	<div class="flex h-full flex-col">
		{@render children?.()}
	</div>
</dialog>
