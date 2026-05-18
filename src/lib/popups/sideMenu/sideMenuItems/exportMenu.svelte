<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { exportStore } from '$lib/stores/dialog';
	import { createProjectColumnsStore } from '$lib/stores/projectColumnsStore';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { exportBackup } from '$lib/actions/backupActions';
	import { notify } from '$lib/stores/notificationStore';
	import { failure } from '$lib/types';

	const projectsWithColumns = createProjectColumnsStore();

	async function onExport(payload: { projectIds: string[]; columnIds: string[] }) {
		const { result, backup } = await exportBackup(payload);
		if (result.type === 'error') {
			notify(failure(`Export failed: ${result.message}`));
			return;
		}

		downloadObjectAsJson(backup, `DoneJar_Export_${new Date().toISOString()}`);

		exportStore.close();
	}

	// Source - https://stackoverflow.com/a/30800715
	// Posted by mlimper, modified by community. See post 'Timeline' for change history
	// Retrieved 2026-05-18, License - CC BY-SA 4.0
	function downloadObjectAsJson(exportObj: unknown, exportName: string) {
		var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj));
		var downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute('href', dataStr);
		downloadAnchorNode.setAttribute('download', exportName + '.json');
		document.body.appendChild(downloadAnchorNode); // required for firefox
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}

	// ============================================================
	// UI STATE — no backend dependency below this line
	// ============================================================

	let expandedProjects = $state(<SvelteSet<string>>new SvelteSet());
	let selectedCols = $state(
		<SvelteMap<string, SvelteSet<string>>>(
			new SvelteMap(
				$projectsWithColumns.map((p) => [p.id, new SvelteSet(p.columns.map((c) => c.id))])
			)
		)
	);

	// Reset selections whenever the projects list changes
	$effect(() => {
		selectedCols = new SvelteMap(
			$projectsWithColumns.map((p) => [p.id, new SvelteSet(p.columns.map((c) => c.id))])
		);
		expandedProjects = new SvelteSet();
	});

	function getProjectState(pid: string): 'all' | 'some' | 'none' {
		const cols = selectedCols.get(pid);
		const project = $projectsWithColumns.find((p) => p.id === pid);
		if (!cols || !project) return 'none';
		if (cols.size === 0) return 'none';
		if (cols.size === project.columns.length) return 'all';
		return 'some';
	}

	function toggleProject(pid: string) {
		const current = getProjectState(pid);
		const project = $projectsWithColumns.find((p) => p.id === pid);
		if (!project) return;
		const next = new SvelteMap(selectedCols);
		next.set(
			pid,
			current === 'all' ? new SvelteSet() : new SvelteSet(project.columns.map((c) => c.id))
		);
		selectedCols = next;
	}

	function toggleColumn(pid: string, cid: string) {
		const next = new SvelteMap(selectedCols);
		const cols = new SvelteSet(next.get(pid) ?? []);
		if (cols.has(cid)) {
			cols.delete(cid);
		} else {
			cols.add(cid);
		}
		next.set(pid, cols);
		selectedCols = next;
	}

	function toggleExpand(pid: string) {
		const next = new SvelteSet(expandedProjects);
		if (next.has(pid)) {
			next.delete(pid);
		} else {
			next.add(pid);
		}
		expandedProjects = next;
	}

	function selectAllState(): 'all' | 'some' | 'none' {
		const states = $projectsWithColumns.map((p) => getProjectState(p.id));
		if (states.every((s) => s === 'all')) return 'all';
		if (states.every((s) => s === 'none')) return 'none';
		return 'some';
	}

	function toggleSelectAll() {
		const current = selectAllState();
		const next = new SvelteMap<string, SvelteSet<string>>();
		$projectsWithColumns.forEach((p) => {
			next.set(
				p.id,
				current === 'all' ? new SvelteSet() : new SvelteSet(p.columns.map((c) => c.id))
			);
		});
		selectedCols = next;
	}

	function bindIndeterminate(node: HTMLInputElement, indeterminate: boolean) {
		node.indeterminate = indeterminate;
		return {
			update(val: boolean) {
				node.indeterminate = val;
			}
		};
	}

	let totalSelectedCols = $derived([...selectedCols.values()].reduce((acc, s) => acc + s.size, 0));
	let totalSelectedProjects = $derived(
		$projectsWithColumns.filter((p) => (selectedCols.get(p.id)?.size ?? 0) > 0).length
	);
	let totalCols = $derived($projectsWithColumns.reduce((acc, p) => acc + p.columns.length, 0));
	let canExport = $derived(totalSelectedCols > 0);
	let loading = $state(false);

	async function handleExport() {
		if (!canExport) return;
		loading = true;

		const selectedProjectIds = $projectsWithColumns
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
				{totalSelectedProjects} of {$projectsWithColumns.length} projects · {totalSelectedCols} of {totalCols}
				columns
			</span>
		</div>

		<div class="max-h-96 overflow-y-auto">
			<!-- Project list -->
			<div class="flex flex-col gap-2 pr-1">
				{#each $projectsWithColumns as project (project.id)}
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
