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
			class="fixed top-[15%] left-1/2 z-9999 w-full max-w-lg -translate-x-1/2 rounded-2xl bg-white p-6 shadow-xl"
		>
			<Dialog.Title class="m-2 text-xl font-bold text-gray-900">
				{target?.title ?? 'Confirm Action'}
			</Dialog.Title>

			<hr class="my-3 border border-gray-300" />

			<Dialog.Description class="m-2 leading-relaxed whitespace-pre-line text-gray-600">
				{target?.body ?? 'Are you sure you want to proceed?'}
			</Dialog.Description>

			<div class="mt-6 flex justify-end gap-3">
				{#if target?.cancelLabel}
					<button
						type="button"
						class="rounded-xl bg-gray-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
						onclick={() => confirmMenuStore.respond(false)}
					>
						{target?.cancelLabel}
					</button>
				{/if}
				<button
					type="button"
					class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
					style="background-color: {colors[target?.actionColor ?? 'primary']};"
					onclick={() => confirmMenuStore.respond(true)}
				>
					{target?.actionLabel ?? 'Confirm'}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
