<script lang="ts">
	import kebabMenu from '$lib/assets/elements/kebabMenu.svg';
	import { dataActions } from '$lib/Actions';
	export let projectName: string;
	export let projectColor: string;
	export let projectId: string;
	export let currentProject: string;

	export let textColorFromHex: (hex: string) => string;
	import grayBG from '$lib/assets/elements/grayBG.svg';

	function handleActive(e: MouseEvent) {
		// Don't activate if clicking on the delete button
		if (!(e.target as HTMLElement).closest('.project-actions')) {
			dataActions.setActiveProject(projectId);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			dataActions.setActiveProject(projectId);
		}
	}
</script>

<div
	class="doodle-border relative flex items-center gap-8 {currentProject === projectId
		? ''
		: 'is-hidden'}"
	role="button"
	tabindex="0"
	onclick={handleActive}
	onkeydown={handleKeydown}
	aria-label="Select project {projectName}"
>
	<img
		src={grayBG}
		alt=""
		aria-hidden="true"
		class="bg pointer-events-none absolute inset-0 -z-10 h-full w-full scale-[1.2] object-cover object-center"
	/>

	<!-- Project Avatar -->
	<span
		class="flex size-14 items-center justify-center rounded-full border border-black text-3xl font-bold"
		style="
			background-color: {projectColor};
			color: {textColorFromHex(projectColor)};
		"
	>
		{projectName[0].toUpperCase()}
	</span>

	<!-- Project Menu -->
	<div class="project-actions {currentProject === projectId ? '' : 'invisible'}">
		<button
			onclick={(e) => {
				e.stopPropagation();
				dataActions.deleteProject(projectId);
			}}
			aria-label="Project Menu {projectName}"
		>
			<img src={kebabMenu} alt="Menu" class="pointer-events-none select-none" />
		</button>
	</div>
</div>

<style>
	.is-hidden:not(:hover) {
		border-image-source: none !important;
		border-color: transparent !important;
	}

	.is-hidden img.bg {
		display: none;
	}
</style>
