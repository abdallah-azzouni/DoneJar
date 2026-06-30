<script lang="ts">
	import menu from '$lib/assets/icons/menu.svg';
	import { textColorFromHex } from '$lib/UiHelper';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { sideMenuStore } from '$lib/stores/dialog';
	import { projectSideBarStore } from '$lib/stores/dialog';
	import SideMenu from '$lib/popups/sideMenu/sideMenu.svelte';
	import ImportMenu from '$lib/popups/sideMenu/sideMenuItems/importMenu.svelte';
	import ExportMenu from '$lib/popups/sideMenu/sideMenuItems/exportMenu.svelte';
	import ProfileMenu from '$lib/popups/sideMenu/sideMenuItems/profileMenu.svelte';

	import { searchQuery } from '$lib/stores/search';

	let searchOpen = $state(false);
	function toggleSearch() {
		searchOpen = !searchOpen;
		if (!searchOpen) {
			searchQuery.set('');
		}
	}

	function focus(node: HTMLElement) {
		node.focus();
	}
</script>

<SideMenu />
<!-- Side menu Items -->
<ImportMenu />
<ExportMenu />
<ProfileMenu />
<header class="doodle-border m-2 px-4">
	<div class="flex h-16 items-center justify-between">
		<div class="flex items-center gap-4">
			{#if projectStore.current}
				<button
					style="background-color: {projectStore.current.color};"
					class="flex size-14 items-center justify-center rounded-full border border-black"
					onclick={() => {
						projectSideBarStore.open();
					}}
				>
					<span
						class="text-3xl font-bold"
						style="color: {textColorFromHex(projectStore.current.color)};"
					>
						{projectStore.current.name[0].toUpperCase()}
					</span>
				</button>
				<h1 class="line-clamp-1 w-[25vw] text-3xl font-bold" style="overflow-wrap: break-word;">
					{projectStore.current.name}
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
						onkeydown={(e) => {
							if (e.key === 'Escape') {
								toggleSearch();
							}
						}}
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
				onclick={() => sideMenuStore.open()}
			>
				<img src={menu} alt="menu" class="pointer-events-none size-full select-none" />
			</button>
		</div>
	</div>
</header>
