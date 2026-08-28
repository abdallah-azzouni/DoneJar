<script lang="ts">
	import { columnRepository } from '$lib/db/dal';
	import { openNoteMenu } from '$lib/stores/dialog';
	import Ticket from '$lib/components/Ticket.svelte';
	import SortFilter from '$lib/components/SortFilter.svelte';
	import { getSortComparator } from '$lib/sort';
	import { type ColumnWithNotes } from '$lib/types';
	import { SvelteSet } from 'svelte/reactivity';

	function updateColumnSettings(
		columnId: string,
		sortKey: string | null,
		filters: Record<string, string[]>
	) {
		columnRepository.update({
			id: columnId,
			sortKey: sortKey,
			filters: JSON.stringify(filters)
		});
	}
	let availableColors = $derived.by(() => {
		const colors = new SvelteSet<string>();
		for (const note of columnItem.notes) {
			if (note.color) colors.add(note.color);
		}

		return Array.from(colors);
	});

	let { column }: { column: ColumnWithNotes } = $props();

	const columnItem = $derived.by(() => {
		const parsedFilters = JSON.parse(column.filters || '{}');

		const cmp = column.sortKey
			? getSortComparator(column.sortKey)
			: getSortComparator('newest_updated');

		let filteredNotes = column.notes.filter((note) => {
			// A. Check Column Specific Filters
			if (parsedFilters.color?.length && !parsedFilters.color.includes(note.color)) return false;
			if (parsedFilters.priority?.length && !parsedFilters.priority.includes(note.priority || '')) {
				return false;
			}

			return true;
		});
		filteredNotes.sort(cmp);

		return { ...column, filters: parsedFilters, notes: filteredNotes };
	});
</script>

<div class="doodle-border flex h-full w-full flex-col gap-5 overflow-y-auto bg-white p-5 sm:p-10">
	<div class="absolute top-20 right-5 z-10 sm:top-22 sm:right-9">
		<!-- Filters already prased from board -->
		<SortFilter
			activeSortKey={columnItem.sortKey}
			activeFilters={columnItem.filters}
			colorOptions={availableColors}
			onSettingsChanged={(newFilters, newSortKey) =>
				updateColumnSettings(columnItem.id, newSortKey, newFilters)}
		/>
	</div>
	{#each columnItem.notes as note (note.id)}
		<button
			class="w-full"
			style="transform: rotate({(Math.random() * 4 - 2).toFixed(2)}deg);"
			onclick={() => openNoteMenu(note, true)}
		>
			<Ticket
				data={{
					color: note.color,
					title: note.title,
					priority: note.priority,
					updatedAt: note.updatedAt
				}}
			/>
		</button>
	{/each}
</div>
