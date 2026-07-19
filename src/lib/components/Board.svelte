<script lang="ts">
	// components
	import StickyNote from '$lib/components/StickyNote.svelte';
	import BeakerPhysics from './BeakerPhysics.svelte';
	import SortFilter from '$lib/components/SortFilter.svelte';
	// popups
	import NoteMenu from '$lib/popups/noteMenu/NoteMenu.svelte';
	// assets
	import frontJar from '$lib/assets/elements/front-jar.png';
	import backJar from '$lib/assets/elements/back-jar.png';
	// stores
	import { projectStore } from '$lib/stores/projects.svelte';
	import { columnRepository } from '$lib/db/dal';
	import { searchQuery } from '$lib/stores/search';

	// actions
	import { reorderNotes, moveNote } from '$lib/actions';
	import { type NoteDocType } from '$lib/db/schemas/index';
	import type { ColumnWithNotes } from '$lib/types';
	import { notify } from '$lib/stores/notificationStore';
	import { columnService } from '$lib/db/dal';

	import {
		dropTargetForElements,
		monitorForElements
	} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

	import { getSortComparator } from '$lib/sort';

	let showCreateNote = $state(false);

	let columns = $state<ColumnWithNotes[]>([]);

	let hoveredColumnId = $state<string | null>(null);
	let activeHoveredNoteId = $state<string | null>(null);
	let maxCapacity = $derived(projectStore.current?.maxCapacity ?? 100);

	// Load columns whenever current project changes.
	$effect(() => {
		const project = projectStore.current; // capture dependency synchronously
		void projectStore.projects; // capture projects store to update board.

		if (!project) {
			columns = [];
			return;
		}

		const sub = columnService.observeColumnsByProjectIdWithNotes(project.id).subscribe({
			next: (data) => (columns = data),
			error: (err) => notify({ type: 'error', message: String(err) })
		});

		const dndMonitorCleanup = monitorForElements({
			async onDrop({ source, location }) {
				const destination = location.current.dropTargets[0];
				if (!destination) return;

				const noteId = source.data.noteId as string;
				const sourceColumnId = source.data.columnId as string;

				// Pick up the target attributes now that the card exposes them!
				const targetNoteId = destination.data.noteId as string | undefined;
				const targetColumnId = destination.data.columnId as string;

				if (!noteId || !targetColumnId) return;

				// Case A: Dropped into a column empty space wrapper
				if (!targetNoteId) {
					if (sourceColumnId !== targetColumnId) {
						const result = await moveNote(noteId, targetColumnId);
						if (result && result.type === 'error') notify(result);
					}
					return;
				} else {
					// Case B: Dropped directly onto another card in the grid
					const targetColumn = columnItems.find((c) => c.id === targetColumnId);
					if (!targetColumn) return;

					const targetNotes = targetColumn.notes;
					const targetIdx = targetNotes.findIndex((n) => n.id === targetNoteId);
					if (targetIdx === -1) return;

					// In grid layouts, we default to dropping right AFTER the targeted note
					const prevNote = targetNotes[targetIdx];
					const nextNote = targetNotes[targetIdx + 1];

					const prevPos = prevNote ? (prevNote.position ?? 0) : 0;
					// Generate a default high index if placing at the absolute end of the grid list
					const nextPos = nextNote ? (nextNote.position ?? prevPos + 2000) : prevPos + 2000;

					const newPosition = (prevPos + nextPos) / 2;

					const result = await moveNote(noteId, targetColumnId, newPosition);
					if (result && result.type === 'error') notify(result);
				}
			}
		});

		return () => {
			sub.unsubscribe();
			dndMonitorCleanup();
		};
	});

	function buildColumnItems(cols: ColumnWithNotes[]) {
		return cols.map((col) => {
			const parsedFilters = JSON.parse(col.filters || '{}');

			// get custom sort key.
			const cmp = col.sortKey ? getSortComparator(col.sortKey) : null;

			// sort notes by custom comparator or position.
			let notes = [...col.notes];
			if (cmp) {
				notes.sort(cmp);
			} else {
				notes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
			}

			// show pinned notes first.
			notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
			return { ...col, filters: parsedFilters, notes };
		});
	}

	const columnItems = $derived(buildColumnItems(columns));

	// Dynamic Svelte action mapping column registration to its inline ID context
	function dndColumn(node: HTMLElement, columnId: string) {
		const cleanup = dropTargetForElements({
			element: node,
			getData: () => ({ columnId }),
			onDragEnter: () => (hoveredColumnId = columnId),
			onDragLeave: () => {
				if (hoveredColumnId === columnId) hoveredColumnId = null;
			},
			onDrop: () => (hoveredColumnId = null)
		});

		return {
			destroy: cleanup
		};
	}

	// ── Sort & Filter ──
	// per-column modular filters: record of filterKey -> Set<string>
	let activeFilters: Record<string, string[]>[] = $state([]);

	let activeSortComparators: (((a: NoteDocType, b: NoteDocType) => number) | null)[] = $state([]);
	let activeSortKeys: (string | undefined)[] = $state([]);

	async function handleColumnSort(
		columnIdx: number,
		compareFn: (a: NoteDocType, b: NoteDocType) => number
	) {
		if (!projectStore.current) return;
		activeSortComparators[columnIdx] = compareFn;
		const sorted = [...columnItems[columnIdx].notes].sort(compareFn);
		const result = await reorderNotes(sorted.map((n: NoteDocType) => n.id));
		if (result.type === 'error') notify(result);
	}

	function notePassesFilter(columnIdx: number, note: NoteDocType): boolean {
		const filters = activeFilters[columnIdx] || {};
		// 1. Check Color and Priority filters
		for (const [key, arr] of Object.entries(filters)) {
			if (!arr || arr.length === 0) continue;
			if (key === 'color') {
				if (!arr.includes(note.color)) return false;
			} else if (key === 'priority') {
				if (!arr.includes(note.priority || '')) return false;
			}
		}
		// 2. Extract plain text from description

		let plainText = note.description ?? '';

		const search = $searchQuery.trim().toLowerCase();
		if (!search) return true;

		// 3. Parse tokens and extract prefixes
		const tokens = search.split(' ').filter(Boolean);
		const textTokens: string[] = [];
		let colorFilter: string | null = null;
		let priorityFilter: string | null = null;

		for (const token of tokens) {
			if (token.startsWith('color:')) colorFilter = token.slice(6);
			else if (token.startsWith('priority:')) priorityFilter = token.slice(9);
			else textTokens.push(token);
		}

		if (colorFilter && note.color?.toLowerCase() !== colorFilter) return false;
		if (priorityFilter && (note.priority ?? '').toLowerCase() !== priorityFilter) return false;

		if (textTokens.length > 0) {
			const matchesSearch = textTokens.every(
				(token) =>
					note.title.toLowerCase().includes(token) || plainText.toLowerCase().includes(token)
			);
			if (!matchesSearch) return false;
		}

		return true;
	}
	// Utility to determine column width classes based on project and column types
	function getColumnClass(
		projectType: string | undefined,
		specialType: 'jar' | 'inbox' | null | undefined
	): string {
		if (projectType === 'default' && specialType === 'inbox') {
			return 'w-2/3';
		} else if (projectType !== 'default') {
			return 'w-full';
		} else {
			return 'w-1/3';
		}
	}

	function getJarStatus(count: number) {
		const MAX_CAPACITY = maxCapacity;
		const t = Math.min(count / MAX_CAPACITY, 1);

		const nearFullThreshold = Math.floor(MAX_CAPACITY * 0.96);

		const stops = [
			{ at: 0.0, h: 200, s: 20, l: 96 }, // 0% — pale slate blue
			{ at: Math.min(5 / MAX_CAPACITY, 1), h: 260, s: 35, l: 90 }, // ~5 notes — soft lavender
			{ at: Math.min(15 / MAX_CAPACITY, 1), h: 150, s: 40, l: 85 }, // ~15 notes — sage green
			{ at: Math.min(30 / MAX_CAPACITY, 1), h: 90, s: 45, l: 80 }, // ~30 notes — olive/yellow-green
			{ at: Math.min(50 / MAX_CAPACITY, 1), h: 40, s: 55, l: 75 }, // ~50 notes — warm amber
			{ at: Math.min(100 / MAX_CAPACITY, 1), h: 20, s: 60, l: 65 }, // ~100 notes — burnt orange
			{ at: Math.min(250 / MAX_CAPACITY, 1), h: 350, s: 55, l: 55 }, // ~250 notes — deep rose
			{ at: 1.0, h: 0, s: 65, l: 45 } // 100% — full red
		];

		stops.sort((a, b) => a.at - b.at);

		let lower = stops[0];
		let upper = stops[stops.length - 1];
		for (let i = 0; i < stops.length - 1; i++) {
			if (t >= stops[i].at && t <= stops[i + 1].at) {
				lower = stops[i];
				upper = stops[i + 1];
				break;
			}
		}
		const span = upper.at - lower.at || 1;
		const localT = (t - lower.at) / span;

		const lerp = (a: number, b: number) => a + (b - a) * localT;
		const hue = lerp(lower.h, upper.h);
		const saturation = Math.min(lerp(lower.s, upper.s), 100);
		const lightness = Math.max(0, Math.min(lerp(lower.l, upper.l), 100));

		const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
		const borderColor = `hsl(${hue}, ${Math.min(saturation + 10, 100)}%, ${Math.max(lightness - 15, 0)}%)`;
		const textColor =
			lightness < 60 ? `hsl(${hue}, ${saturation}%, 20%)` : `hsl(${hue}, ${saturation}%, 35%)`;

		let message = 'Drop notes here';
		if (count >= MAX_CAPACITY) message = 'Jar is full, start a new one?';
		else if (count >= nearFullThreshold) message = `${count}/${MAX_CAPACITY}, nearly full`;

		return {
			style: `background-color: ${bgColor}; border-color: ${borderColor}; color: ${textColor};`,
			pulse: count >= nearFullThreshold,
			message
		};
	}
</script>

{#key showCreateNote}
	<NoteMenu bind:isOpen={showCreateNote} note={null} />
{/key}

<div class="flex h-full w-full flex-row overflow-hidden">
	{#each columnItems as column, columnIdx (column.id)}
		{#if column.specialType === 'jar'}
			{@const status = getJarStatus(column.notes.length)}
			<div
				use:dndColumn={column.id}
				class="relative m-2 flex max-h-full flex-col items-center {getColumnClass(
					projectStore.current?.type,
					column.specialType
				)}"
			>
				<!-- Jar Column Layout Wrapper -->
				<div class="flex h-full w-full flex-col justify-between">
					<!-- Jar drop area -->

					<div
						class="{status.pulse
							? 'animate-pulse'
							: ''} relative mt-20 flex w-full flex-1 items-center justify-center rounded-xl border-2 p-4 transition-all duration-300"
						style={status.style}
					>
						{#each column.notes as note (note.id)}
							<div class="pointer-events-none absolute top-0 left-0 size-10 opacity-0"></div>
						{/each}
						<div class="flex items-center gap-2">
							<span class="font-patrick-hand text-xl font-bold tracking-wide transition-all">
								{status.message}
							</span>
						</div>
					</div>

					<!-- Jar Interactive Container Box -->
					<div class="relative mt-4 flex min-h-0 w-full flex-initial items-center justify-center">
						<button
							type="button"
							class="group relative max-h-11/12 overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						>
							<img
								src={backJar}
								alt=""
								class="pointer-events-none block w-full object-contain opacity-0"
							/>

							<img
								src={backJar}
								alt="Jar container graphic background"
								class="pointer-events-none absolute inset-0 z-0 h-full w-full object-contain"
							/>
							<div class="absolute top-[18%] right-[5%] bottom-[5%] left-[5%] z-5">
								<BeakerPhysics items={column.notes} {maxCapacity} />
							</div>

							<img
								src={frontJar}
								alt="Jar container graphic foreground"
								class="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
							/>
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div
				use:dndColumn={column.id}
				class="relative m-2 flex max-h-full flex-col items-center {getColumnClass(
					projectStore.current?.type,
					column.specialType
				)}"
			>
				<span class="mb-2 font-patrick-hand text-7xl font-bold">{column.name}</span>
				<div class="doodle-border w-full flex-1 overflow-y-auto bg-white">
					<div class="absolute top-22 right-4 z-10">
						<SortFilter
							notes={columnItems[columnIdx].notes}
							onSort={(cmp) => handleColumnSort(columnIdx, cmp)}
							onFiltersChange={async (filters) => {
								activeFilters[columnIdx] = filters;
								const plain = $state.snapshot(filters);
								await columnRepository.update({
									id: columnItems[columnIdx].id,
									filters: JSON.stringify(plain)
								});
							}}
							activeSortKey={activeSortKeys[columnIdx]}
							activeFilters={activeFilters[columnIdx]}
							onActiveSortKeyChange={async (key) => {
								activeSortKeys[columnIdx] = key;
								await columnRepository.update({ id: columnItems[columnIdx].id, sortKey: key });
							}}
						/>
					</div>
					<div
						class="grid min-h-full w-full grid-cols-1 p-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
					>
						{#each columnItems[columnIdx].notes as note (note.id)}
							<div class="{notePassesFilter(columnIdx, note) ? 'block' : 'hidden'} p-2">
								<StickyNote {note} bind:hoveredNoteId={activeHoveredNoteId} />
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
