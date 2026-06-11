<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { importStore } from '$lib/stores/dialog';
	import { importBackup } from '$lib/actions';
	import { notify } from '$lib/stores/notificationStore';
	import { failure } from '$lib/types';
	import type { BackupDocType } from '$lib/db/schemas';

	let dragOver = $state(false);
	let selectedFile = $state<File | null>(null);
	let fileInput: HTMLInputElement;

	async function handleImport() {
		if (!selectedFile) return;
		const file = await selectedFile.text();

		let backupData: BackupDocType;
		try {
			backupData = JSON.parse(file);
		} catch {
			notify(failure('Invalid JSON file'));
			return;
		}

		const result = await importBackup(backupData);
		if (result.type === 'error') {
			notify(failure(result.message));
			return;
		} else {
			importStore.close();
		}
	}
</script>

<ThemedDialog isOpen={$importStore.isOpen} closeOnBackdrop={true} w="w-1/2" h="h-fit">
	<h2 class="mb-6 font-patrick-hand text-2xl font-bold">Import 📥</h2>

	<!-- Drop zone -->
	<button
		class="doodle-border flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-8 transition-colors {dragOver
			? 'bg-yellow-50'
			: 'bg-gray-50 hover:bg-gray-100'}"
		ondragover={(e) => {
			e.preventDefault();
			dragOver = true;
		}}
		ondragleave={() => (dragOver = false)}
		ondrop={(e) => {
			e.preventDefault();
			dragOver = false;
			selectedFile = e.dataTransfer?.files[0] ?? null;
		}}
		onclick={() => fileInput.click()}
	>
		<span class="text-4xl">📂</span>
		<span class="font-patrick-hand text-lg text-gray-500">
			{dragOver ? 'Drop it!' : 'Click or drag a JSON file here'}
		</span>
	</button>

	<input
		bind:this={fileInput}
		type="file"
		accept=".json"
		class="hidden"
		onchange={(e) => (selectedFile = e.currentTarget.files?.[0] ?? null)}
	/>

	<!-- Selected file -->
	{#if selectedFile}
		<div class="doodle-border mt-4 flex items-center justify-between rounded-lg px-4 py-2">
			<span class="font-patrick-hand text-lg">📄 {selectedFile.name}</span>
			<button class="text-gray-400 hover:text-red-400" onclick={() => (selectedFile = null)}
				>✕</button
			>
		</div>
	{/if}

	<!-- Actions -->
	<div class="mt-6 flex justify-end gap-3">
		<button
			class="doodle-border rounded-lg px-4 py-2 font-patrick-hand text-lg hover:bg-gray-100"
			onclick={() => importStore.close()}
		>
			Cancel
		</button>
		<button
			class="doodle-border rounded-lg bg-yellow-300 px-4 py-2 font-patrick-hand text-lg hover:bg-yellow-400 disabled:opacity-40"
			disabled={!selectedFile}
			onclick={handleImport}
		>
			Import
		</button>
	</div>
</ThemedDialog>
