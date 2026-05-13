<script lang="ts">
	// components
	import StickyNote from '$lib/components/StickyNote.svelte';
	import BeakerPhysics from './BeakerPhysics.svelte';
	import SortFilter from '$lib/components/SortFilter.svelte';
	// popups
	import NoteMenu from '$lib/popups/noteMenu/NoteMenu.svelte';
	// external libraries
	import { dndzone, TRIGGERS } from 'svelte-dnd-action';
	// assets
	import beaker from '$lib/assets/elements/beaker.png';
	// stores
	import { currentProject } from '$lib/stores/currentProject';
	import { columnRepository } from '$lib/db/dal';
	import { projects } from '$lib/stores/projects';

	// actions
	import { reorderNotes, moveNote } from '$lib/actions';
	import { type Note, type ColumnWithNotes } from '$lib/types';
	import { notify } from '$lib/stores/notificationStore';
	import { createColumnNotesStore } from '$lib/stores/columnNotesStore';

	import { getSortComparator } from '$lib/sort';

	let showCreateNote = $state(false);

	const flipDurationMs = 200;

	let dragDisabled = $state(false);
	// Tracks which column index a drag originated from
	let dragSourceColIdx = $state<number | null>(null);

	async function handleDnd(columnIdx: number, type: 'consider' | 'finalize', e: CustomEvent) {
		if (!$currentProject) return;
		const { items, info } = e.detail;

		if (type === 'consider') {
			if (info?.trigger === TRIGGERS.DRAG_STARTED) dragSourceColIdx = columnIdx;
			columnItems[columnIdx].notes = items;
			return;
		}

		// finalize
		columnItems[columnIdx].notes = items;
		// If the drag started in this column and ended in the same column, clear any active sorts since the order has been manually changed.
		if (dragSourceColIdx === columnIdx && info?.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
			activeSortComparators[columnIdx] = null;
			activeSortKeys[columnIdx] = null;
		}
		if (dragSourceColIdx !== null && dragSourceColIdx !== columnIdx) {
			const result = await moveNote(info.id, columnItems[columnIdx].id);
			if (result.type === 'error') {
				notify(result);
				return;
			}
		}

		dragSourceColIdx = null;
		const result = await reorderNotes(items.map((n: Note) => n.id));
		if (result.type === 'error') notify(result);
	}

	let columnItems = $state<ColumnWithNotes[]>([]);

	// Load columns whenever current project changes.
	$effect(() => {
		const project = $currentProject; // capture dependency synchronously
		void $projects; // capture projects store to update board.

		if (!project) return;

		const store = createColumnNotesStore(project.id); // trigger effect when notes change.
		const unsub = store.subscribe((cols) => {
			columnItems = cols;
			activeFilters = cols.map((col) => col.filters);
			activeSortComparators = cols.map((col) =>
				col.sortKey ? getSortComparator(col.sortKey) : null
			);
		});
		return () => unsub();
	});

	// ── Sort & Filter ──
	// per-column modular filters: record of filterKey -> Set<string>
	let activeFilters: Record<string, string[]>[] = $state([]);

	let activeSortComparators: (((a: Note, b: Note) => number) | null)[] = $state([]);
	let activeSortKeys: (string | null)[] = $state([]);

	async function handleColumnSort(columnIdx: number, compareFn: (a: Note, b: Note) => number) {
		if (!$currentProject) return;
		activeSortComparators[columnIdx] = compareFn;
		const sorted = [...columnItems[columnIdx].notes].sort(compareFn);
		columnItems[columnIdx].notes = sorted;
		const result = await reorderNotes(sorted.map((n: Note) => n.id));
		if (result.type === 'error') notify(result);
	}

	function notePassesFilter(columnIdx: number, note: Note): boolean {
		const filters = activeFilters[columnIdx] || {};
		for (const [key, arr] of Object.entries(filters)) {
			if (!arr || arr.length === 0) continue;
			if (key === 'color') {
				if (!arr.includes(note.color)) return false;
			} else if (key === 'priority') {
				if (!arr.includes(note.priority || '')) return false;
			} else if (key === 'tag') {
				const noteTags = note.tags || [];
				if (!arr.some((t) => noteTags.includes(t))) return false;
			}
		}
		return true;
	}

	// Utility to determine column width classes based on project and column types
	function getColumnClass(
		projectType: string | undefined,
		specialType: 'jar' | 'inbox' | null | undefined
	): string {
		if (projectType === 'default' && specialType === 'inbox') {
			return 'w-6/9';
		} else if (projectType !== 'default') {
			return 'w-full';
		} else {
			return 'w-3/9';
		}
	}
</script>

{#key showCreateNote}
	<NoteMenu bind:isOpen={showCreateNote} note={null} />
{/key}

<div class="flex h-full w-full flex-row overflow-hidden">
	{#each columnItems as column, columnIdx (column.id)}
		{#if column.specialType === 'jar'}
			<div
				class="relative m-2 flex aspect-777/1024 h-auto max-h-[75%] min-h-0 w-auto max-w-[33.333%] min-w-[28%] flex-col justify-end self-end"
			>
				<div
					class="relative flex items-center justify-center border-2 border-dashed border-gray-400 p-16"
					use:dndzone={{
						items: columnItems[columnIdx]?.notes ?? [],
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
						<BeakerPhysics items={columnItems[columnIdx]?.notes ?? []} />

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
							onFiltersChange={async (filters) => {
								activeFilters[columnIdx] = filters;
								const plain = $state.snapshot(columnItems[columnIdx]);
								await columnRepository.update({ ...plain, filters });
							}}
							activeSortKey={activeSortKeys[columnIdx]}
							onActiveSortKeyChange={async (key) => {
								activeSortKeys[columnIdx] = key;
								await columnRepository.update({ ...columnItems[columnIdx], sortKey: key });
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
