<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { importStore } from '$lib/stores/dialog';
	import { importBackup } from '$lib/actions';
	import { notify } from '$lib/stores/notificationStore';
	import { failure } from '$lib/types';
	import type { BackupDocType } from '$lib/db/schemas';
	import { subscriptionStore } from '$lib/stores/subscription.svelte';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { FREE_MAX_PROJECTS } from '$lib/constants';

	let dragOver = $state(false);
	let selectedFile = $state<File | null>(null);
	let parsedBackup = $state<BackupDocType | null>(null);
	let selectedProjectIds = $state<Set<string>>(new Set());
	let importing = $state(false);
	let fileInput: HTMLInputElement;

	$effect(() => {
		const file = selectedFile;
		if (!file) {
			parsedBackup = null;
			return;
		}
		parseFile(file);
	});

	async function parseFile(file: File) {
		const text = await file.text();
		if (file !== selectedFile) return;
		try {
			parsedBackup = JSON.parse(text) as BackupDocType;
		} catch {
			notify(failure('Invalid JSON file'));
			selectedFile = null;
			parsedBackup = null;
		}
	}

	$effect(() => {
		const _ = parsedBackup;
		selectedProjectIds = new Set();
	});

	const isPro = $derived(subscriptionStore.isPro);
	const currentProjectCount = $derived(projectStore.projects.length);
	const availableSlots = $derived(Math.max(0, FREE_MAX_PROJECTS - currentProjectCount));
	const backupProjectCount = $derived(parsedBackup?.projects.length ?? 0);
	const hasAttachments = $derived((parsedBackup?.attachments.length ?? 0) > 0);

	const isBlocked = $derived(!isPro && backupProjectCount > 0 && availableSlots === 0);
	const needsPicker = $derived(!isPro && !isBlocked && backupProjectCount > availableSlots);
	const willStripAttachments = $derived(!isPro && hasAttachments);

	const canImport = $derived(
		!!parsedBackup && !isBlocked && (!needsPicker || selectedProjectIds.size > 0)
	);

	function removeFile() {
		selectedFile = null;
		parsedBackup = null;
		selectedProjectIds = new Set();
	}

	function toggleProject(id: string) {
		const next = new SvelteSet(selectedProjectIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			if (next.size >= availableSlots) return;
			next.add(id);
		}
		selectedProjectIds = next;
	}
	function filterBackup(
		backup: BackupDocType,
		{ projectIds, stripAttachments }: { projectIds: Set<string>; stripAttachments: boolean }
	): BackupDocType {
		const projects = backup.projects.filter((p) => projectIds.has(p.id));
		const columns = backup.columns.filter((c) => projectIds.has(c.projectId));
		const columnIds = new Set(columns.map((c) => c.id));

		const notes = backup.notes.filter((n) => columnIds.has(n.columnId));
		const noteIds = new Set(notes.map((n) => n.id));

		let attachments = backup.attachments.filter((a) => noteIds.has(a.noteId));
		let blobs: BackupDocType['blobs'];

		if (stripAttachments) {
			attachments = [];
			blobs = [];
		} else {
			const attachmentIds = new Set(attachments.map((a) => a.id));
			blobs = backup.blobs.filter((b) => attachmentIds.has(b.attachmentId));
		}

		return { ...backup, projects, columns, notes, attachments, blobs };
	}

	async function handleImport() {
		if (!parsedBackup || !canImport) return;

		let toImport = parsedBackup;

		if (!isPro) {
			const projectIds = needsPicker
				? selectedProjectIds
				: new Set(parsedBackup.projects.map((p) => p.id));

			toImport = filterBackup(parsedBackup, {
				projectIds,
				stripAttachments: true
			});
		}

		importing = true;
		const result = await importBackup(toImport);
		importing = false;

		if (result.type === 'error') {
			notify(failure(result.message));
			return;
		}
		importStore.close();
	}
</script>

<Dialog.Root
	open={importStore.isOpen}
	onOpenChange={(o) => {
		if (!o) importStore.close();
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9998 bg-black/50 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-[5%] left-1/2 z-9998 h-fit max-h-[90vh] w-1/2 -translate-x-1/2 justify-self-center overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
		>
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
					<button class="text-gray-400 hover:text-red-400" onclick={removeFile}>✕</button>
				</div>
			{/if}

			{#if parsedBackup}
				{#if isBlocked}
					<!-- Blocked: no room for any projects -->
					<div class="doodle-border mt-4 rounded-lg bg-red-50 p-4">
						<p class="font-patrick-hand text-lg text-red-600">
							You already have {FREE_MAX_PROJECTS} projects (Free plan max), so this backup can't be imported.
							Delete a project, or upgrade to Pro to bring in {backupProjectCount === 1
								? 'this project'
								: `all ${backupProjectCount} projects`}.
						</p>
					</div>
				{:else}
					{#if needsPicker}
						<!-- Picker: choose which projects fit in remaining slots -->
						<div class="mt-4">
							<p class="mb-2 font-patrick-hand text-lg text-gray-600">
								You have {availableSlots} project slot{availableSlots === 1 ? '' : 's'} left. Choose up
								to {availableSlots} to import ({selectedProjectIds.size}/{availableSlots} selected).
							</p>
							<div
								class="doodle-border flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg p-2"
							>
								{#each parsedBackup.projects as project (project.id)}
									{@const checked = selectedProjectIds.has(project.id)}
									{@const disabled = !checked && selectedProjectIds.size >= availableSlots}
									<label
										class="flex items-center gap-2 rounded-md px-2 py-1.5 font-patrick-hand text-lg {disabled
											? 'opacity-40'
											: 'cursor-pointer hover:bg-gray-50'}"
									>
										<input
											type="checkbox"
											{checked}
											{disabled}
											onchange={() => toggleProject(project.id)}
										/>
										<span
											class="inline-block h-3 w-3 rounded-full"
											style="background-color: {project.color}"
										></span>
										{project.name}
									</label>
								{/each}
							</div>
						</div>
					{/if}

					{#if willStripAttachments}
						<!-- Attachment warning: always applies to free users when the backup has any -->
						<div class="doodle-border mt-4 rounded-lg bg-yellow-50 p-3">
							<p class="font-patrick-hand text-lg text-yellow-700">
								⚠️ Attachments won't be imported on the Free plan. Upgrade to Pro to keep them.
							</p>
						</div>
					{/if}
				{/if}
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
					disabled={!canImport || importing}
					onclick={handleImport}
				>
					{importing ? 'Importing...' : 'Import'}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
