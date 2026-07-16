<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { exportStore } from '$lib/stores/dialog';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { exportBackup } from '$lib/actions/backupActions';
	import { notify } from '$lib/stores/notificationStore';
	import { failure } from '$lib/types';
	import type { BackupDocType } from '$lib/db/schemas';

	async function onExport(projectIds: string[]) {
		const { result, backup } = await exportBackup(projectIds);
		if (result.type === 'error') {
			notify(failure(`Export failed: ${result.message}`));
			return;
		}

		if (!backup) {
			notify(failure('Export failed: No backup data received'));
			return;
		}
		downloadObjectAsJson(backup, `DoneJar_Export_${new Date().toISOString()}`);
		exportStore.close();
	}

	function downloadObjectAsJson(exportObj: BackupDocType, exportName: string) {
		const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj));
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute('href', dataStr);
		downloadAnchorNode.setAttribute('download', exportName + '.json');
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}

	// ============================================================
	// UI STATE — completely reactive mutations
	// ============================================================
	const selectedProjects = new SvelteSet<string>();

	$effect(() => {
		selectedProjects.clear();
		for (const p of projectStore.projects) {
			selectedProjects.add(p.id);
		}
	});

	function toggleProject(pid: string) {
		if (selectedProjects.has(pid)) {
			selectedProjects.delete(pid);
		} else {
			selectedProjects.add(pid);
		}
	}

	function selectAllState(): 'all' | 'some' | 'none' {
		if (projectStore.projects.length === 0) return 'none';
		if (selectedProjects.size === projectStore.projects.length) return 'all';
		if (selectedProjects.size === 0) return 'none';
		return 'some';
	}

	function toggleSelectAll() {
		const current = selectAllState();
		if (current === 'all') {
			selectedProjects.clear();
		} else {
			for (const p of projectStore.projects) {
				selectedProjects.add(p.id);
			}
		}
	}

	// Modern Svelte 5 standard for action signatures
	function bindIndeterminate(node: HTMLInputElement, indeterminate: boolean) {
		node.indeterminate = indeterminate;
		return {
			update(val: boolean) {
				node.indeterminate = val;
			}
		};
	}

	// Derived states stay perfectly in sync
	let totalSelectedProjects = $derived(selectedProjects.size);
	let canExport = $derived(totalSelectedProjects > 0);
	let loading = $state(false);

	async function handleExport() {
		if (!canExport) return;
		loading = true;

		const selectedProjectIds = [...selectedProjects];

		await onExport(selectedProjectIds);
		loading = false;
	}
</script>

<ThemedDialog
	w="w-1/2"
	h="h-fit"
	isOpen={exportStore.isOpen}
	closeOnBackdrop={true}
	onClose={exportStore.close}
>
	<div>
		<h2 class="mb-6 font-patrick-hand text-2xl font-bold">Export 📤</h2>

		<!-- Select all row -->
		<div class="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
			<label
				class="flex cursor-pointer items-center gap-2 font-patrick-hand text-base text-gray-500 select-none"
			>
				<input
					type="checkbox"
					class="h-4 w-4 cursor-pointer accent-yellow-400"
					checked={selectAllState() === 'all'}
					use:bindIndeterminate={selectAllState() === 'some'}
					onchange={toggleSelectAll}
				/>
				Select all
			</label>
			<span class="font-patrick-hand text-sm text-gray-400">
				{totalSelectedProjects} of {projectStore.projects.length} projects
			</span>
		</div>

		<div class="max-h-96 overflow-y-auto">
			<!-- Project list -->
			<div class="flex flex-col gap-2 pr-1">
				{#each projectStore.projects as project (project.id)}
					<div class="doodle-border overflow-hidden rounded-xl">
						<!-- Project header -->
						<div
							class="flex w-full items-center gap-3 bg-gray-50 px-3 py-2.5 transition-colors select-none hover:bg-gray-100"
						>
							<input
								type="checkbox"
								class="h-4 w-4 shrink-0 cursor-pointer accent-yellow-400"
								checked={selectedProjects.has(project.id)}
								onchange={() => toggleProject(project.id)}
							/>
							<span class="flex-1 text-left font-patrick-hand text-lg">
								{project.name}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
		<!-- Actions -->
		<div class="mt-6 flex justify-end gap-3">
			<button
				class="doodle-border rounded-lg px-4 py-2 font-patrick-hand text-lg hover:bg-gray-100"
				onclick={exportStore.close}
			>
				Cancel
			</button>
			<button
				class="doodle-border rounded-lg bg-yellow-300 px-4 py-2 font-patrick-hand text-lg hover:bg-yellow-400 disabled:opacity-40"
				disabled={!canExport || loading}
				onclick={handleExport}
			>
				{loading ? 'Exporting...' : 'Download'}
			</button>
		</div>
	</div>
</ThemedDialog>
