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
	import { moveNote } from '$lib/actions';
	import type { ColumnWithNotes } from '$lib/types';
	import { notify } from '$lib/stores/notificationStore';
	import { columnService } from '$lib/db/dal';

	import {
		dropTargetForElements,
		monitorForElements
	} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

	import { getSortComparator } from '$lib/sort';
	import { SvelteSet } from 'svelte/reactivity';

	let showCreateNote = $state(false);

	let columns = $state<ColumnWithNotes[]>([]);

	let hoveredColumnId = $state<string | null>(null);
	let maxCapacity = $derived(projectStore.current?.maxCapacity ?? 100);

	// Parse search query.
	let parsedSearch = $derived.by(() => {
		const search = $searchQuery.trim().toLowerCase();
		if (!search) return { tokens: [], color: null, priority: null };

		const tokens = search.split(' ').filter(Boolean);
		const textTokens: string[] = [];
		let color: string | null = null;
		let priority: string | null = null;

		for (const token of tokens) {
			if (token.startsWith('color:')) color = token.slice(6);
			else if (token.startsWith('priority:')) priority = token.slice(9);
			else textTokens.push(token);
		}

		return { textTokens, color, priority };
	});

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
				const targetColumnId = destination.data.columnId as string;

				if (!noteId || !targetColumnId || sourceColumnId === targetColumnId) return;

				const result = await moveNote(noteId, targetColumnId);
				if (result && result.type === 'error') notify(result);
			}
		});

		return () => {
			sub.unsubscribe();
			dndMonitorCleanup();
		};
	});

	// Sort & Filter
	let availableColors = $derived.by(() => {
		const colors = new SvelteSet<string>();
		for (const col of columns) {
			for (const note of col.notes) {
				if (note.color) colors.add(note.color);
			}
		}
		return Array.from(colors);
	});
	const columnItems = $derived.by(() => {
		return columns.map((col) => {
			const parsedFilters = JSON.parse(col.filters || '{}');

			const cmp = col.sortKey ? getSortComparator(col.sortKey) : getSortComparator('newest');

			let filteredNotes = col.notes.filter((note) => {
				// A. Check Column Specific Filters
				if (parsedFilters.color?.length && !parsedFilters.color.includes(note.color)) return false;
				if (parsedFilters.priority?.length && !parsedFilters.priority.includes(note.priority || ''))
					return false;

				// B. Check Global Search Query
				if (parsedSearch.color && note.color?.toLowerCase() !== parsedSearch.color) return false;
				if (parsedSearch.priority && (note.priority ?? '').toLowerCase() !== parsedSearch.priority)
					return false;

				if (parsedSearch.textTokens && parsedSearch.textTokens.length > 0) {
					const plainText = note.description ?? '';
					const matchesSearch = parsedSearch.textTokens.every(
						(token) =>
							note.title.toLowerCase().includes(token) || plainText.toLowerCase().includes(token)
					);
					if (!matchesSearch) return false;
				}
				return true;
			});
			filteredNotes.sort(cmp);
			filteredNotes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

			return { ...col, filters: parsedFilters, notes: filteredNotes };
		});
	});

	function updateColumnSettings(
		columnId: string,
		sortKey: string | undefined,
		filters: Record<string, string[]>
	) {
		columnRepository.update({
			id: columnId,
			sortKey: sortKey === undefined ? '' : sortKey,
			filters: JSON.stringify(filters)
		});
	}

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
	{#each columnItems as column (column.id)}
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
							activeSortKey={column.sortKey}
							activeFilters={column.filters}
							colorOptions={availableColors}
							onSettingsChanged={(newFilters, newSortKey) =>
								updateColumnSettings(column.id, newSortKey, newFilters)}
						/>
					</div>
					<div class="relative flex h-full w-full flex-col items-center justify-start">
						{#if column.id === hoveredColumnId}
							<div
								class="pointer-events-none absolute inset-0 z-40 m-1.5 rounded-xl border-2 border-dashed border-black/20 bg-[#f1ebd9]/50 backdrop-blur-[1px] transition-all duration-150"
							>
								<span
									class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-patrick-hand text-lg font-bold tracking-wide text-black/40"
								>
									Drop notes here
								</span>
							</div>
						{/if}
						<div
							class="grid w-full grid-cols-[repeat(auto-fill,minmax(120px,1fr))] content-start items-start gap-4 p-4"
						>
							{#each column.notes as note (note.id)}
								<div class="p-2">
									<StickyNote {note} />
								</div>
							{/each}
						</div>
					</div>
				</div>
				{#if column.specialType === 'inbox'}
					<button
						class="absolute right-0 bottom-0 m-2 size-15 cursor-pointer rounded-full border border-black bg-white p-2"
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
		{/if}
	{/each}
</div>
