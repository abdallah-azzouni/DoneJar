<script lang="ts">
	import createButton from '$lib/assets/elements/create-button.svg';
	import menu from '$lib/assets/icons/menu.svg';
	import { textColorFromHex } from '$lib/UiHelper';

	export let onCreateProject: () => void;

	export let currentProjectName: string;
	export let currentProjectColor: string;
</script>

<header class="doodle-border m-2 px-4">
	<div class="flex h-16 items-center justify-between gap-8">
		<div class="flex items-center gap-4">
			<div
				style="background-color: {currentProjectColor}"
				class=" flex size-14 items-center justify-center rounded-full border border-black"
			>
				<span class="text-3xl font-bold" style="color: {textColorFromHex(currentProjectColor)};"
					>{currentProjectName[0].toUpperCase()}</span
				>
			</div>
			<h1 class="line-clamp-1 w-[100vh] text-3xl font-bold" style="overflow-wrap: break-word;">
				{currentProjectName}
			</h1>
		</div>

		<div class="flex items-center">
			<div class="flex items-center gap-4">
				<button
					class="cursor-pointer border-none bg-transparent p-0"
					aria-label="Create new project"
					onclick={onCreateProject}
				>
					<img src={createButton} alt="create" class="pointer-events-none select-none" />
				</button>

				<button class="size-12 cursor-pointer rounded-full border border-black bg-transparent p-2">
					<img src={menu} alt="menu" class="pointer-events-none size-full select-none" />
				</button>
			</div>
		</div>
	</div>
</header>
