<script lang="ts">
	import { dataActions } from '$lib/Actions';
	export let projectName: string;
	export let projectColor: string;
	export let projectId: string;
	export let currentProject: string;

	export let textColorFromHex: (hex: string) => string;
</script>

<div
	class="doodle-border flex items-center gap-8 {currentProject === projectId
		? 'is-active'
		: 'is-hidden'}"
>
	<button
		style="background-color: {projectColor}"
		class=" size-14 cursor-pointer rounded-full border border-black"
		onclick={() => dataActions.setActiveProject(projectId)}
	>
		<span class="text-3xl font-bold" style="color: {textColorFromHex(projectColor)};"
			>{projectName[0].toUpperCase()}</span
		>
	</button>
	<button class="{currentProject === projectId ? '' : 'invisible'} "
		><img
			src="src/lib/assets/elements/kebabMenu.svg"
			alt="menu"
			class="pointer-events-none select-none"
		/></button
	>
</div>

<style>
	.is-hidden {
		border-image-source: none !important;
		border-color: transparent !important;
	}

	.is-active {
		background-image: url(src/lib/assets/elements/grayBG.svg);
		background-position: center;
		background-repeat: no-repeat;
		background-size: 150% 150%;
	}
</style>
