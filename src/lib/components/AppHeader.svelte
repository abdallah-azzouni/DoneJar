<script lang="ts">
	import menu from '$lib/assets/icons/menu.svg';
	import { textColorFromHex } from '$lib/UiHelper';
	import { currentProject } from '$lib/stores/currentProject';
	import { searchQuery } from '$lib/stores/search';

	let searchOpen = $state(false);
	function toggleSearch() {
		searchOpen = !searchOpen;
	}

	function focus(node: HTMLElement) {
		node.focus();
	}
</script>

<header class="doodle-border m-2 px-4">
	<div class="flex h-16 items-center justify-between">
		<div class="flex items-center gap-4">
			{#if $currentProject}
				<div
					style="background-color: {$currentProject.color};"
					class="flex size-14 items-center justify-center rounded-full border border-black"
				>
					<span
						class="text-3xl font-bold"
						style="color: {textColorFromHex($currentProject.color)};"
					>
						{$currentProject.name[0].toUpperCase()}
					</span>
				</div>
				<h1 class="line-clamp-1 w-[25vw] text-3xl font-bold" style="overflow-wrap: break-word;">
					{$currentProject.name}
				</h1>
			{:else}
				<div
					class="flex size-14 items-center justify-center rounded-full border border-dashed border-gray-300"
				></div>
				<h1 class="font-patrick-hand text-3xl font-bold text-gray-400">No project selected</h1>
			{/if}
		</div>
		<div class="flex">
			<button
				class="rounded-xl border border-black {searchOpen
					? 'bg-gray-200'
					: 'bg-white'} p-3 backdrop-blur-md"
				onclick={() => {
					toggleSearch();
				}}
			>
				<span>🔍</span>
			</button>
			{#if searchOpen}
				<div class="ml-1">
					<input
						use:focus
						type="text"
						class="w-80 rounded-xl border border-black bg-white/20 p-3 backdrop-blur-md focus:ring-0 focus:outline-none md:w-105"
						placeholder="Search or filter: color:red, priority:high, tag:someTag"
						bind:value={$searchQuery}
					/>
				</div>
			{/if}

			<button
				class="ml-3 size-12 rounded-full border border-black bg-transparent p-2 hover:bg-gray-100"
			>
				<img src={menu} alt="menu" class="pointer-events-none size-full select-none" />
			</button>
		</div>
	</div>
</header>
