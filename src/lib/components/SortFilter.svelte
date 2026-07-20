<script lang="ts">
	import FunnelSimpleIcon from 'phosphor-svelte/lib/FunnelSimpleIcon';
	import { SvelteSet } from 'svelte/reactivity';
	import { sortOptions } from '$lib/sort';

	// ═══ Props ═══

	let {
		activeSortKey = $bindable(undefined),
		activeFilters = $bindable({}),
		onSettingsChanged
	}: {
		activeSortKey?: string | undefined;
		activeFilters?: Record<string, string[]>;
		onSettingsChanged?: () => void;
	} = $props();

	// ═══ State ═══
	let isOpen = $state(false);
	let panelEl: HTMLDivElement | undefined = $state();

	// Filters collection (modular). Each filter exposes a getOptions(), set, and toggle handler.
	const filters = [
		{ key: 'color', label: 'Filter by color', type: 'swatch' },
		{ key: 'priority', label: 'Filter by priority', type: 'list' }
	];
	const filterOptions: Record<string, string[]> = {
		color: ['#fffa8b', '#ffc0ad', '#a2e8dd', '#b0c4de', '#e6c5ff'], // Or derive from current theme
		priority: ['low', 'medium', 'high']
	};

	// Whether any sort or filter is active
	let hasActive = $derived(
		!!activeSortKey || filters.some((f) => (activeFilters[f.key] ?? []).length > 0)
	);

	// ═══ Handlers ═══

	function toggleFilter(key: string, value: string) {
		const current = new SvelteSet(activeFilters[key] ?? []);
		if (current.has(value)) current.delete(value);
		else current.add(value);
		activeFilters = {
			...activeFilters,
			[key]: [...current]
		};
		onSettingsChanged?.();
	}
	function toggleSort(key: string) {
		activeSortKey = activeSortKey === key ? undefined : key;
		onSettingsChanged?.();
	}

	function clearAll() {
		activeSortKey = undefined;
		activeFilters = {};
		onSettingsChanged?.();
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
		class="flex items-center justify-center rounded-full p-1.5 {hasActive
			? 'bg-yellow-200'
			: 'hover:bg-gray-100'}"
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
			onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
			role="menu"
			tabindex="-1"
		>
			<!-- Sort Section -->
			<span class="text-xs font-bold tracking-widest text-gray-400 uppercase">Sort by</span>
			<div class="mt-1 flex flex-col">
				{#each sortOptions as option (option.key)}
					<button
						class="rounded px-2 py-1 text-left text-lg {activeSortKey === option.key
							? 'bg-gray-200 font-bold'
							: 'hover:bg-gray-100'}"
						onclick={() => toggleSort(option.key)}
						role="menuitem"
					>
						{option.label}
					</button>
				{/each}
			</div>

			<hr class="my-2 border-gray-300" />

			<!-- Filters Section -->
			{#each filters as filter (filter.key)}
				<span class="text-xs font-bold tracking-widest text-gray-400 uppercase">{filter.label}</span
				>
				<div class="mt-1 {filter.type === 'swatch' ? 'flex flex-wrap gap-2' : 'flex flex-col'}">
					{#each filterOptions[filter.key] ?? [] as opt (opt)}
						<button
							class={filter.type === 'swatch'
								? 'size-7 rounded-full border-2 transition-transform ' +
									((activeFilters[filter.key] ?? []).includes(opt)
										? 'scale-110 border-black'
										: 'border-gray-300 hover:border-gray-400')
								: 'rounded px-2 py-1 text-left text-lg ' +
									((activeFilters[filter.key] ?? []).includes(opt)
										? 'bg-gray-200 font-bold'
										: 'hover:bg-gray-100')}
							style={filter.type === 'swatch' ? `background-color: ${opt}` : undefined}
							onclick={() => toggleFilter(filter.key, opt)}
							role="menuitem"
						>
							{#if filter.type !== 'swatch'}{opt}{/if}
						</button>
					{/each}
				</div>
				<hr class="my-2 border-gray-300" />
			{/each}

			<!-- Clear Action -->
			{#if hasActive}
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
