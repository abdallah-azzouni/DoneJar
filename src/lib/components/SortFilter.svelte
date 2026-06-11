<script lang="ts">
	import type { NoteDocType } from '$lib/db/schemas';
	import FunnelSimpleIcon from 'phosphor-svelte/lib/FunnelSimpleIcon';
	import { SvelteSet } from 'svelte/reactivity';
	import { sortOptions } from '$lib/sort';
	import { type SortOption } from '$lib/types';

	// ═══ Props ═══

	let {
		notes,
		onSort,
		onFiltersChange,
		activeSortKey = undefined,
		activeFilters = {},
		onActiveSortKeyChange
	}: {
		notes: NoteDocType[];
		onSort: (compareFn: (a: NoteDocType, b: NoteDocType) => number) => void;
		onFiltersChange?: (filters: Record<string, string[]>) => void;
		activeSortKey?: string | undefined;
		activeFilters?: Record<string, string[]>;
		onActiveSortKeyChange?: (key: string | undefined) => void;
	} = $props();

	// ═══ State ═══

	let isOpen = $state(false);
	let panelEl: HTMLDivElement | undefined = $state();

	// Filters collection (modular). Each filter exposes a getOptions(), set, and toggle handler.
	const filters = [
		{
			key: 'color',
			label: 'Filter by color',
			type: 'swatch',
			getOptions: () => [...new Set(notes.map((n) => n.color))].filter(Boolean)
		},
		{
			key: 'priority',
			label: 'Filter by priority',
			type: 'list',
			getOptions: () => ['low', 'medium', 'high']
		}
	];

	// Whether any sort or filter is active
	let hasActive = $derived(
		activeSortKey !== undefined || filters.some((f) => (activeFilters[f.key] ?? []).length > 0)
	);

	// ═══ Handlers ═══

	function applySort(option: SortOption) {
		onActiveSortKeyChange?.(option.key);
		onSort(option.compare);
	}

	function toggleFilter(key: string, value: string) {
		const current = new SvelteSet(activeFilters[key] ?? []);
		if (current.has(value)) current.delete(value);
		else current.add(value);
		onFiltersChange?.({ ...activeFilters, [key]: [...current] });
	}

	function clearAll() {
		onActiveSortKeyChange?.(undefined);
		onFiltersChange?.({});
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
			class="doodle-border absolute right-0 z-50 mt-1 max-h-80 w-52 overflow-y-auto bg-white p-3 font-patrick-hand shadow-lg"
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

			<!-- ─── Modular Filters ─── -->
			{#each filters as filter (filter.key)}
				<span class="text-xs font-bold tracking-widest text-gray-400 uppercase">{filter.label}</span
				>
				{#if filter.getOptions().length > 0}
					<div class="mt-1 {filter.type === 'swatch' ? 'flex flex-wrap gap-2' : 'flex flex-col'}">
						{#if filter.type === 'swatch'}
							{#each filter.getOptions() as opt (opt)}
								<button
									class="size-7 rounded-full border-2 transition-transform
										{(activeFilters[filter.key] ?? []).includes(opt)
										? 'scale-110 border-black'
										: 'border-gray-300 hover:border-gray-400'}"
									style="background-color: {opt}"
									onclick={() => toggleFilter(filter.key, opt)}
									title="Toggle {opt}"
								></button>
							{/each}
						{:else}
							{#each filter.getOptions() as opt (opt)}
								<button
									class="rounded px-2 py-1 text-left text-lg
										{(activeFilters[filter.key] ?? []).includes(opt) ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}"
									onclick={() => toggleFilter(filter.key, opt)}
									role="menuitem"
								>
									{opt}
								</button>
							{/each}
						{/if}
					</div>
				{:else}
					<p class="mt-1 text-sm text-gray-400">No {filter.label.toLowerCase()} yet</p>
				{/if}
				<hr class="my-2 border-gray-300" />
			{/each}
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
