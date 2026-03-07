<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { corruptDataState, projects, activeProjectId } from '$lib/stores/userData';

	let isOpen = $derived($corruptDataState.detected);

	function downloadBackup() {
		const snapshot = $corruptDataState.rawSnapshot;
		if (!snapshot) return;

		const blob = new Blob([snapshot], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `donejar-backup-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handleReset() {
		projects.set([]);
		activeProjectId.set('');
		corruptDataState.set({ detected: false, rawSnapshot: null });
	}
</script>

<ThemedDialog bind:isOpen cancelable={false} w="w-1/2">
	<h1 class="m-4 text-2xl font-bold">⚠️ Corrupted Data Detected</h1>
	<hr class="border-gray-300" />

	<div class="m-4 space-y-3 text-gray-700">
		<p>
			Your saved data appears to be corrupted and could not be loaded. It has been cleared from
			memory to prevent further issues.
		</p>
		<p class="text-sm text-gray-500">
			Before resetting, you can download a backup of the raw data. While it cannot be automatically
			restored, it may help you recover information manually.
		</p>
	</div>

	<div class="mx-8 mt-auto mb-6 flex flex-col gap-3">
		{#if $corruptDataState.rawSnapshot}
			<button
				class="rounded-2xl border border-gray-400 bg-white p-4 font-bold text-gray-800"
				onclick={downloadBackup}
			>
				📥 Download Raw Backup
			</button>
		{/if}
		<button class="rounded-2xl bg-red-700 p-4 font-bold text-white" onclick={handleReset}>
			Reset & Continue
		</button>
	</div>
</ThemedDialog>
