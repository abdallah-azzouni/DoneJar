<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { exportStore } from '$lib/stores/dialog';
	import { projectColumnsStore } from '$lib/stores/projectColumnsStore.svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { exportBackup } from '$lib/actions/backupActions';
	import { notify } from '$lib/stores/notificationStore';
	import { failure } from '$lib/types';
	import { onMount } from 'svelte';
	import type { BackupDocType } from '$lib/db/schemas';

	// FIX 1: Keep it reactive using $derived
	let projectsWithColumns = $derived(projectColumnsStore.data);

	async function onExport(payload: { projectIds: string[]; columnIds: string[] }) {
		const { result, backup } = await exportBackup(payload);
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
	const expandedProjects = new SvelteSet<string>();
	const selectedCols = new SvelteMap<string, SvelteSet<string>>();

	// FIX 2: Reset tracking safely using an effect only for synchronization
	$effect(() => {
		// This runs whenever projectsWithColumns array reference changes
		selectedCols.clear();
		expandedProjects.clear();
		for (const p of projectsWithColumns) {
			selectedCols.set(p.id, new SvelteSet(p.columns.map((c) => c.id)));
		}
	});

	onMount(() => {
		return () => projectColumnsStore.destroy();
	});

	function getProjectState(pid: string): 'all' | 'some' | 'none' {
		const cols = selectedCols.get(pid);
		const project = projectsWithColumns.find((p) => p.id === pid);
		if (!cols || !project || cols.size === 0) return 'none';
		if (cols.size === project.columns.length) return 'all';
		return 'some';
	}

	// FIX 3: Leverage native SvelteSet / SvelteMap reactive mutations instead of cloning copies
	function toggleProject(pid: string) {
		const current = getProjectState(pid);
		const project = projectsWithColumns.find((p) => p.id === pid);
		if (!project) return;

		if (current === 'all') {
			selectedCols.get(pid)?.clear();
		} else {
			selectedCols.set(pid, new SvelteSet(project.columns.map((c) => c.id)));
		}
	}

	function toggleColumn(pid: string, cid: string) {
		if (!selectedCols.has(pid)) {
			selectedCols.set(pid, new SvelteSet());
		}
		const cols = selectedCols.get(pid)!;
		if (cols.has(cid)) {
			cols.delete(cid);
		} else {
			cols.add(cid);
		}
	}

	function toggleExpand(pid: string) {
		if (expandedProjects.has(pid)) {
			expandedProjects.delete(pid);
		} else {
			expandedProjects.add(pid);
		}
	}

	function selectAllState(): 'all' | 'some' | 'none' {
		if (projectsWithColumns.length === 0) return 'none';
		const states = projectsWithColumns.map((p) => getProjectState(p.id));
		if (states.every((s) => s === 'all')) return 'all';
		if (states.every((s) => s === 'none')) return 'none';
		return 'some';
	}

	function toggleSelectAll() {
		const current = selectAllState();
		for (const p of projectsWithColumns) {
			if (current === 'all') {
				selectedCols.get(p.id)?.clear();
			} else {
				selectedCols.set(p.id, new SvelteSet(p.columns.map((c) => c.id)));
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
	let totalSelectedCols = $derived([...selectedCols.values()].reduce((acc, s) => acc + s.size, 0));
	let totalSelectedProjects = $derived(
		projectsWithColumns.filter((p) => (selectedCols.get(p.id)?.size ?? 0) > 0).length
	);
	let totalCols = $derived(projectsWithColumns.reduce((acc, p) => acc + p.columns.length, 0));
	let canExport = $derived(totalSelectedCols > 0);
	let loading = $state(false);

	async function handleExport() {
		if (!canExport) return;
		loading = true;

		const selectedProjectIds = projectsWithColumns
			.filter((p) => (selectedCols.get(p.id)?.size ?? 0) > 0)
			.map((p) => p.id);

		const selectedColumnIds = [...selectedCols.entries()].flatMap(([, cols]) => [...cols]);

		await onExport({ projectIds: selectedProjectIds, columnIds: selectedColumnIds });
		loading = false;
	}
</script>

<ThemedDialog
	w="w-1/2"
	h="h-fit"
	isOpen={$exportStore.isOpen}
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
				{totalSelectedProjects} of {projectsWithColumns.length} projects · {totalSelectedCols} of {totalCols}
				columns
			</span>
		</div>

		<div class="max-h-96 overflow-y-auto">
			<!-- Project list -->
			<div class="flex flex-col gap-2 pr-1">
				{#each projectsWithColumns as project (project.id)}
					{@const projState = getProjectState(project.id)}
					{@const isExpanded = expandedProjects.has(project.id)}
					{@const selectedCount = selectedCols.get(project.id)?.size ?? 0}

					<div class="doodle-border overflow-hidden rounded-xl">
						<!-- Project header -->
						<div
							class="flex w-full items-center gap-3 bg-gray-50 px-3 py-2.5 transition-colors select-none hover:bg-gray-100"
						>
							<input
								type="checkbox"
								class="h-4 w-4 shrink-0 cursor-pointer accent-yellow-400"
								checked={projState === 'all'}
								use:bindIndeterminate={projState === 'some'}
								onchange={() => toggleProject(project.id)}
							/>
							<span
								class="flex-1 cursor-pointer text-left font-patrick-hand text-lg"
								onclick={() => toggleExpand(project.id)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && toggleExpand(project.id)}
							>
								{project.name}
							</span>
							<span class="font-patrick-hand text-sm text-gray-400">
								{selectedCount}/{project.columns.length} cols
							</span>
							<button
								class="cursor-pointer px-1 text-gray-400 transition-transform duration-150 {isExpanded
									? 'rotate-180'
									: ''}"
								onclick={() => toggleExpand(project.id)}
								aria-label="Toggle columns"
							>
								▾
							</button>
						</div>
						<!-- Columns -->
						{#if isExpanded}
							<div
								class="flex flex-col gap-2 border-t border-gray-100 bg-white px-3 pt-2 pb-3 pl-9"
							>
								{#each project.columns as col (col.id)}
									<label class="flex cursor-pointer items-center gap-2 select-none">
										<input
											type="checkbox"
											class="h-4 w-4 cursor-pointer accent-yellow-400"
											checked={selectedCols.get(project.id)?.has(col.id) ?? false}
											onchange={() => toggleColumn(project.id, col.id)}
										/>
										<span class="font-patrick-hand text-base">{col.name}</span>
									</label>
								{/each}
							</div>
						{/if}
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
