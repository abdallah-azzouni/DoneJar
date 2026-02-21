<script lang="ts">
	let { isOpen = $bindable(false), children } = $props();

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
	class="mt-[5%] max-h-3/4 w-2/3 justify-self-center rounded-2xl bg-white p-6 shadow-lg"
>
	<div class="flex h-full flex-col">
		{@render children?.()}
	</div>
</dialog>
