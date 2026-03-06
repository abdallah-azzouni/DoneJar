<script lang="ts">
	import type { Note } from '$lib/types';
	import FunnelSimpleIcon from 'phosphor-svelte/lib/FunnelSimpleIcon';
	import { untrack } from 'svelte';

	interface SortOption {
		key: string;
		label: string;
		compare: (a: Note, b: Note) => number;
	}

	// ═══ Sort options ═══

	const sortOptions: SortOption[] = [
		{ key: 'newest', label: 'Newest first', compare: (a, b) => b.createdAt - a.createdAt },
		{ key: 'oldest', label: 'Oldest first', compare: (a, b) => a.createdAt - b.createdAt },
		{
			key: 'due-date',
			label: 'Due date',
			compare: (a, b) => {
				if (!a.dueDate && !b.dueDate) return 0;
				if (!a.dueDate) return 1;
				if (!b.dueDate) return -1;
				return a.dueDate.timestamp - b.dueDate.timestamp;
			}
		},
		{ key: 'title-az', label: 'Title A → Z', compare: (a, b) => a.title.localeCompare(b.title) },
		{ key: 'title-za', label: 'Title Z → A', compare: (a, b) => b.title.localeCompare(a.title) }
	];

	// ═══ Props ═══

	let {
		notes,
		onSort,
		onFilterChange,
		activeSortKey = $bindable<string | null>(null)
	}: {
		notes: Note[];
		onSort: (compareFn: (a: Note, b: Note) => number) => void;
		onFilterChange: (activeColors: Set<string>) => void;
		activeSortKey?: string | null;
	} = $props();

	// ═══ State ═══

	let isOpen = $state(false);
	let colorFilters = $state(new Set<string>());
	let panelEl: HTMLDivElement | undefined = $state();

	// Unique colors present in this column's notes
	let uniqueColors = $derived([...new Set(notes.map((n) => n.color))]);

	// Whether any sort or filter is active
	let hasActive = $derived(activeSortKey !== null || colorFilters.size > 0);

	$effect(() => {
		const filters = colorFilters;
		untrack(() => onFilterChange(filters));
	});

	// ═══ Handlers ═══

	function applySort(option: SortOption) {
		activeSortKey = option.key;
		onSort(option.compare);
	}

	function toggleColor(color: string) {
		const next = new Set(colorFilters);
		if (next.has(color)) next.delete(color);
		else next.add(color);
		colorFilters = next;
	}

	function clearAll() {
		activeSortKey = null;
		colorFilters = new Set();
	}

	function handleClickOutside(e: MouseEvent) {
		if (panelEl && !panelEl.contains(e.target as Node)) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative" bind:this={panelEl}>
	<button
		class="flex items-center justify-center rounded-full p-1.5
			{hasActive ? 'bg-yellow-200' : 'hover:bg-gray-100'}"
		onclick={(e) => {
			e.stopPropagation();
			isOpen = !isOpen;
		}}
		title="Sort & Filter"
	>
		<FunnelSimpleIcon size={24} weight={hasActive ? 'fill' : 'regular'} />
	</button>

	{#if isOpen}
		<div
			class="doodle-border absolute right-0 z-50 mt-1 w-52 bg-white p-3 font-patrick-hand shadow-lg"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Escape') isOpen = false;
			}}
			role="menu"
			tabindex="-1"
		>
			<!-- ─── Sort ─── -->
			<span class="text-xs font-bold tracking-widest text-gray-400 uppercase">Sort by</span>
			<div class="mt-1 flex flex-col">
				{#each sortOptions as option (option.key)}
					<button
						class="rounded px-2 py-1 text-left text-lg
							{activeSortKey === option.key ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}"
						onclick={() => applySort(option)}
						role="menuitem"
					>
						{option.label}
					</button>
				{/each}
			</div>

			<hr class="my-2 border-gray-300" />

			<!-- ─── Filter by color ─── -->
			<span class="text-xs font-bold tracking-widest text-gray-400 uppercase">Filter by color</span>
			{#if uniqueColors.length > 0}
				<div class="mt-1 flex flex-wrap gap-2">
					{#each uniqueColors as color (color)}
						<button
							class="size-7 rounded-full border-2 transition-transform
								{colorFilters.has(color) ? 'scale-110 border-black' : 'border-gray-300 hover:border-gray-400'}"
							style="background-color: {color}"
							onclick={() => toggleColor(color)}
							title="Toggle {color}"
						></button>
					{/each}
				</div>
			{:else}
				<p class="mt-1 text-sm text-gray-400">No notes yet</p>
			{/if}

			<!-- ─── Clear ─── -->
			{#if hasActive}
				<hr class="my-2 border-gray-300" />
				<button
					class="w-full rounded px-2 py-1 text-center text-base text-red-500 hover:bg-red-50"
					onclick={clearAll}
				>
					Clear all
				</button>
			{/if}
		</div>
	{/if}
</div>
