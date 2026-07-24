<script lang="ts">
	import { confirmMenuStore } from '$lib/stores/dialog';
	import { Dialog } from 'bits-ui';

	let target = $derived(confirmMenuStore.data);

	const colors = {
		primary: '#3b82f6',
		danger: '#ef4444',
		success: '#10b981',
		info: '#3b82f6'
	};
</script>

<Dialog.Root
	open={confirmMenuStore.isOpen}
	onOpenChange={(o) => {
		if (!o) confirmMenuStore.respond(false);
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9999 bg-black/50 backdrop-blur-[1px]" />
		<Dialog.Content
			interactOutsideBehavior="ignore"
			class="fixed top-[5%] left-1/2 z-9999 max-h-3/4 w-2/3 -translate-x-1/2 justify-self-center rounded-2xl bg-white p-6 shadow-lg"
		>
			<h1 class="m-4 text-2xl font-bold">
				{target?.title ?? 'Confirm Action'}
			</h1>
			<hr class="border-gray-500" />
			<div class="m-4 space-y-4">
				<span>
					{target?.body ?? 'Are you sure you want to proceed?'}
				</span>
			</div>
			<div class="mx-8 mt-auto mb-6 flex justify-end gap-3">
				<button
					class="rounded-2xl bg-gray-500 p-4 font-bold text-white"
					onclick={() => confirmMenuStore.respond(false)}
				>
					{target?.cancelLabel ?? 'Cancel'}
				</button>
				<button
					class="rounded-2xl p-4 font-bold text-white"
					style="background-color: {colors[target?.actionColor ?? 'primary']};"
					onclick={() => confirmMenuStore.respond(true)}
				>
					{target?.actionLabel ?? 'Confirm'}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
