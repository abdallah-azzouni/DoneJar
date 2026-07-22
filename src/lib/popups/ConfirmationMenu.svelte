<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { notify } from '$lib/stores/notificationStore';
	import { confirmMenuStore, closeConfirmMenu } from '$lib/stores/dialog';

	let target = $derived(confirmMenuStore.data);
	let isOpen = $derived(confirmMenuStore.isOpen);

	let isWorking = $state(false);
	async function handleAction(e: Event) {
		e.preventDefault();
		if (!target?.onConfirm) return;
		if (isWorking) return;
		isWorking = true;
		try {
			const result = await target.onConfirm();
			if (result && typeof result === 'object' && result.type === 'error') {
				notify({
					type: 'error',
					message: result.message ?? 'An error occurred.'
				});
				return;
			}
			closeConfirmMenu();
		} catch (err) {
			notify({
				type: 'error',
				message: err instanceof Error ? err.message : `Failed to confirm: ${err}`
			});
		} finally {
			isWorking = false;
		}
	}

	const colors = {
		primary: '#3b82f6',
		danger: '#ef4444',
		success: '#10b981',
		info: '#3b82f6'
	};
</script>

<ThemedDialog {isOpen} onClose={closeConfirmMenu}>
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
		<button class="rounded-2xl bg-gray-500 p-4 font-bold text-white" onclick={closeConfirmMenu}>
			{target?.cancelLabel ?? 'Cancel'}
		</button>
		<button
			class="rounded-2xl p-4 font-bold text-white"
			style="background-color: {colors[target?.actionColor ?? 'primary']};"
			onclick={handleAction}
		>
			{target?.actionLabel ?? 'Confirm'}
		</button>
	</div>
</ThemedDialog>
