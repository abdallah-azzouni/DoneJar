<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		w = 'w-2/3',
		h = 'max-h-3/4',
		mt = 'mt-[5%]',
		isOpen = $bindable(false),
		cancelable = true,
		onClose,
		children
	}: {
		w?: string;
		h?: string;
		mt?: string;
		isOpen?: boolean;
		cancelable?: boolean;
		onClose?: () => void;
		children?: Snippet;
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
		onClose?.();
	}
</script>

<dialog
	bind:this={dialog}
	onclose={closeDialog}
	oncancel={(e) => {
		if (!cancelable) e.preventDefault();
	}}
	class="{mt} {h} {w} justify-self-center rounded-2xl bg-white p-6 shadow-lg"
>
	<div class="flex h-full flex-col">
		{@render children?.()}
	</div>
</dialog>
