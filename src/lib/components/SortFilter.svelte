<script lang="ts">
	import type { Note } from '$lib/types';
	import FunnelSimpleIcon from 'phosphor-svelte/lib/FunnelSimpleIcon';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { sortOptions } from '$lib/sort';
	import { type SortOption } from '$lib/types';

	// ═══ Props ═══

	let {
		notes,
		onSort,
		onFiltersChange,
		activeSortKey = null,
		onActiveSortKeyChange
	}: {
		notes: Note[];
		onSort: (compareFn: (a: Note, b: Note) => number) => void;
		onFiltersChange?: (filters: Record<string, string[]>) => void;
		activeSortKey?: string | null;
		onActiveSortKeyChange?: (key: string | null) => void;
	} = $props();

	// ═══ State ═══

	let isOpen = $state(false);
	let colorFilters = new SvelteSet<string>();
	let priorityFilters = new SvelteSet<string>();
	let tagFilters = new SvelteSet<string>();
	let panelEl: HTMLDivElement | undefined = $state();

	// Filters collection (modular). Each filter exposes a getOptions(), set, and toggle handler.
	const filters = [
		{
			key: 'color',
			label: 'Filter by color',
			type: 'swatch',
			getOptions: () => [...new Set(notes.map((n) => n.color))].filter(Boolean),
			set: colorFilters,
			toggle: (c: string) => toggleColor(c)
		},
		{
			key: 'priority',
			label: 'Filter by priority',
			type: 'list',
			getOptions: () => ['low', 'medium', 'high'],
			set: priorityFilters,
			toggle: (p: string) => togglePriority(p)
		},
		{
			key: 'tag',
			label: 'Filter by tag',
			type: 'list',
			getOptions: () => {
				const tags = new SvelteSet<string>();
				notes.forEach((n) => n.tags?.forEach((t) => tags.add(t)));
				return [...tags];
			},
			set: tagFilters,
			toggle: (t: string) => toggleTag(t)
		}
	];

	// Whether any sort or filter is active
	let hasActive = $derived(activeSortKey !== null || filters.some((f) => f.set.size > 0));

	// Callbacks: call the modular `onFiltersChange` with the record of active filter sets.
	$effect(() => {
		const activeRecord: Record<string, string[]> = {};
		for (const f of filters) activeRecord[f.key] = [...f.set];
		untrack(() => {
			if (typeof onFiltersChange === 'function') onFiltersChange(activeRecord);
		});
	});

	// ═══ Handlers ═══

	function applySort(option: SortOption) {
		onActiveSortKeyChange?.(option.key);
		onSort(option.compare);
	}

	function toggleColor(color: string) {
		if (colorFilters.has(color)) colorFilters.delete(color);
		else colorFilters.add(color);
	}

	function togglePriority(priority: string) {
		if (priorityFilters.has(priority)) priorityFilters.delete(priority);
		else priorityFilters.add(priority);
	}

	function toggleTag(tag: string) {
		if (tagFilters.has(tag)) tagFilters.delete(tag);
		else tagFilters.add(tag);
	}

	function clearAll() {
		onActiveSortKeyChange?.(null);
		for (const f of filters) f.set.clear();
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
										{filter.set.has(opt) ? 'scale-110 border-black' : 'border-gray-300 hover:border-gray-400'}"
									style="background-color: {opt}"
									onclick={() => filter.toggle(opt)}
									title="Toggle {opt}"
								></button>
							{/each}
						{:else}
							{#each filter.getOptions() as opt (opt)}
								<button
									class="rounded px-2 py-1 text-left text-lg
										{filter.set.has(opt) ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100'}"
									onclick={() => filter.toggle(opt)}
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
