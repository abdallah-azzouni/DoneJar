<script lang="ts">
	// components
	import StickyNote from '$lib/components/StickyNote.svelte';
	import BeakerPhysics from './BeakerPhysics.svelte';
	import SortFilter from '$lib/components/SortFilter.svelte';
	// popups
	import NoteMenu from '$lib/popups/noteMenu/NoteMenu.svelte';
	// external libraries
	import { dndzone, TRIGGERS } from 'svelte-dnd-action';
	import { untrack } from 'svelte';
	// assets
	import beaker from '$lib/assets/elements/beaker.png';
	// stores
	import { currentProject } from '$lib/stores/userData';
	// actions
	import { reorderColumnNotes } from '$lib/actions';
	import { createEmptyNote, type Note } from '$lib/types';
	import { notify } from '$lib/stores/notificationStore';

	let showCreateNote = $state(false);

	const flipDurationMs = 200;

	let dragDisabled = $state(false);
	// Tracks which column index a drag originated from
	let dragSourceColIdx = $state<number | null>(null);

	function handleDnd(columnIdx: number, type: 'consider' | 'finalize', e: CustomEvent) {
		if (!$currentProject) return;
		const items = e.detail.items;
		const trigger = e.detail.info?.trigger;

		// DRAG_STARTED fires only on the source zone's consider event
		if (type === 'consider' && trigger === TRIGGERS.DRAG_STARTED) {
			dragSourceColIdx = columnIdx;
		}

		columnItems[columnIdx].notes = items;

		if (type === 'finalize') {
			// Intra-column reorder: drag started AND ended in the same column → clear sort
			// Cross-column move: DROPPED_INTO_ANOTHER fires on source (items removed), keep sort
			if (dragSourceColIdx === columnIdx && trigger === TRIGGERS.DROPPED_INTO_ZONE) {
				activeSortComparators[columnIdx] = null;
				activeSortKeys[columnIdx] = null;
			}
			dragSourceColIdx = null;
			const result = reorderColumnNotes($currentProject.id, columnIdx, items);
			if (result.type === 'error') {
				notify(result);
			}
		}
	}

	let columnItems = $state($currentProject?.columns ?? []);

	let prevProjectId = $state<string | null>(null);

	$effect(() => {
		const project = $currentProject;
		if (!project) return;

		// Full reset when project changes
		if (project.id !== untrack(() => prevProjectId)) {
			prevProjectId = project.id;
			untrack(() => {
				columnItems = project.columns.map((col) => ({ ...col, notes: [...col.notes] }));
				activeSortKeys = project.columns.map(() => null);
				activeSortComparators = project.columns.map(() => null);
				activeFilters = project.columns.map(() => ({}) as Record<string, Set<string>>);
			});
		}
	});

	$effect(() => {
		if (!$currentProject) return;
		const cols = $currentProject.columns;
		const cmps = untrack(() => activeSortComparators);
		cols.forEach((col, idx) => {
			const prev = untrack(() => columnItems[idx]);
			const cmp = cmps[idx];

			const noteIdsChanged =
				col.notes.map((n) => n.id).join() !== prev?.notes.map((n: Note) => n.id).join();
			const nameChanged = prev?.name !== col.name;

			if (!cmp) {
				if (noteIdsChanged || nameChanged) columnItems[idx] = col;
			} else if (noteIdsChanged || nameChanged) {
				columnItems[idx] = { ...col, notes: [...col.notes].sort(cmp) };
			}
		});
	});

	// ── Sort & Filter ──
	// per-column modular filters: record of filterKey -> Set<string>
	let activeFilters: Record<string, Set<string>>[] = $state(
		$currentProject?.columns.map(() => ({}) as Record<string, Set<string>>) ?? []
	);
	let activeSortComparators: (((a: Note, b: Note) => number) | null)[] = $state(
		$currentProject?.columns.map(() => null) ?? []
	);
	let activeSortKeys: (string | null)[] = $state($currentProject?.columns.map(() => null) ?? []);

	function handleColumnSort(columnIdx: number, compareFn: (a: Note, b: Note) => number) {
		if (!$currentProject) return;
		activeSortComparators[columnIdx] = compareFn;
		const sorted = [...columnItems[columnIdx].notes].sort(compareFn);
		columnItems[columnIdx].notes = sorted;
		const result = reorderColumnNotes($currentProject.id, columnIdx, sorted);
		if (result.type === 'error') {
			notify(result);
		}
	}

	function notePassesFilter(columnIdx: number, note: Note): boolean {
		const filters = activeFilters[columnIdx] || {};
		for (const [key, set] of Object.entries(filters)) {
			if (!set || set.size === 0) continue;
			if (key === 'color') {
				if (!set.has(note.color)) return false;
			} else if (key === 'priority') {
				if (!set.has(note.priority || '')) return false;
			} else {
				const keyK = key as keyof Note;
				const val = note[keyK];
				if (val === undefined) continue;
				if (!set.has(String(val))) return false;
			}
		}
		return true;
	}

	function getColumnClass(projectType: string | undefined, specialType: string | undefined) {
		if (projectType === 'default' && specialType === 'inbox') {
			return 'w-6/9';
		} else if (projectType !== 'default') {
			return 'w-full';
		} else {
			return 'w-3/9';
		}
	}
</script>

<NoteMenu
	bind:isOpen={showCreateNote}
	note={createEmptyNote({ color: '#fab005', projectId: $currentProject?.id || '' })}
/>

<div class="flex h-full w-full flex-row overflow-hidden">
	{#each columnItems as column, columnIdx (column.name)}
		{#if column.specialType === 'jar'}
			<div
				class="relative m-2 flex aspect-777/1024 h-auto max-h-[75%] min-h-0 w-auto max-w-[33.333%] min-w-[28%] flex-col justify-end self-end"
			>
				<div
					class="relative flex items-center justify-center border-2 border-dashed border-gray-400 p-16"
					use:dndzone={{
						items: columnItems[columnIdx].notes,
						flipDurationMs,
						dragDisabled
					}}
					onconsider={(e) => handleDnd(columnIdx, 'consider', e)}
					onfinalize={(e) => handleDnd(columnIdx, 'finalize', e)}
				>
					{#each column.notes as note (note.id)}
						<div
							class="pointer-events-none absolute top-0 left-0 size-10 opacity-0"
							data-id={note.id}
						></div>
					{/each}

					<span class="pointer-events-none absolute z-0 object-contain text-gray-400">
						Drop notes here!
					</span>
				</div>

				<div class="relative aspect-777/1024 w-full">
					<button class="size-full">
						<BeakerPhysics items={columnItems[columnIdx].notes} />

						<img src={beaker} alt="" class="pointer-events-none h-full w-full object-contain" />
					</button>
				</div>
			</div>
		{:else}
			<div
				class="relative m-2 flex max-h-full flex-col items-center {getColumnClass(
					$currentProject?.type,
					column.specialType
				)}"
			>
				<span class="mb-2 font-patrick-hand text-7xl font-bold">{column.name}</span>
				<div class="doodle-border w-full flex-1 overflow-y-auto">
					<div class="absolute top-22 right-4 z-10">
						<SortFilter
							notes={columnItems[columnIdx].notes}
							onSort={(cmp) => handleColumnSort(columnIdx, cmp)}
							onFiltersChange={(filters) => {
								activeFilters[columnIdx] = filters;
							}}
							activeSortKey={activeSortKeys[columnIdx]}
							onActiveSortKeyChange={(key) => {
								activeSortKeys[columnIdx] = key;
							}}
						/>
					</div>
					<div
						class="min-h-full w-full p-4"
						use:dndzone={{
							items: columnItems[columnIdx].notes,
							flipDurationMs,
							dragDisabled
						}}
						onconsider={(e) => handleDnd(columnIdx, 'consider', e)}
						onfinalize={(e) => handleDnd(columnIdx, 'finalize', e)}
					>
						{#each columnItems[columnIdx].notes as note (note.id)}
							<div class={notePassesFilter(columnIdx, note) ? 'inline-block' : 'hidden'}>
								<StickyNote {note} bind:dragDisabled />
							</div>
						{/each}
					</div>
					{#if column.specialType === 'inbox'}
						<button
							class="absolute right-0 bottom-0 m-2 size-15 cursor-pointer rounded-full border border-black bg-transparent p-2"
							onclick={() => (showCreateNote = true)}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
								><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
									d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"
								/></svg
							>
						</button>
					{/if}
				</div>
			</div>
		{/if}
	{/each}
</div>
