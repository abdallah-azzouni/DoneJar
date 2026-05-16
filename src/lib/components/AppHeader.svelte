<script lang="ts">
	import menu from '$lib/assets/icons/menu.svg';
	import { textColorFromHex } from '$lib/UiHelper';
	import { currentProject } from '$lib/stores/currentProject';
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
		<button class="size-12 cursor-pointer rounded-full border border-black bg-transparent p-2">
			<img src={menu} alt="menu" class="pointer-events-none size-full select-none" />
		</button>
	</div>
</header>
