<script lang="ts">
	import { columnRepository } from '$lib/db/dal';
	import { openNoteMenu } from '$lib/stores/dialog';
	import Ticket from '$lib/components/Ticket.svelte';
	import SortFilter from '$lib/components/SortFilter.svelte';
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

	let { columnItem }: { columnItem: ColumnWithNotes } = $props();
</script>

<div
	class="doodle-border relative flex h-full w-full flex-col gap-5 overflow-y-auto bg-white p-5 sm:p-10"
>
	<div class="absolute top-17 right-5 z-10 sm:top-21 sm:right-9">
		<!-- Filters already prased from board -->
		<SortFilter
			activeSortKey={columnItem.sortKey}
			activeFilters={columnItem.filters as unknown as Record<string, string[]>}
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
