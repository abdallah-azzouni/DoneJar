<script lang="ts">
	import kebabMenu from '$lib/assets/elements/kebabMenu.svg';
	import grayBG from '$lib/assets/elements/grayBG.svg';

	import ProjectMenu from '$lib/popups/ProjectMenu.svelte';
	import { dataActions } from '$lib/Actions';
	import { textColorFromHex } from '$lib/UiHelper';
	import { currentProject, type ProjectInterface } from '$lib/stores/userData';
	let { project }: { project: ProjectInterface } = $props();

	let showProjectMenu = $state(false);

	function handleActive(e: MouseEvent) {
		// Don't activate if clicking on the delete button
		if (!(e.target as HTMLElement).closest('.project-actions')) {
			dataActions.setActiveProject(project.id);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			dataActions.setActiveProject(project.id);
		}
	}
</script>

<ProjectMenu bind:isOpen={showProjectMenu} projectInfo={project} />
<div
	class="doodle-border relative flex items-center gap-8 {$currentProject.id === project.id
		? ''
		: 'is-hidden'} cursor-pointer"
	role="button"
	tabindex="0"
	onclick={handleActive}
	onkeydown={handleKeydown}
	aria-label="Select project {project.name}"
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
			background-color: {project.color};
			color: {textColorFromHex(project.color)};
		"
	>
		{project.name[0].toUpperCase()}
	</span>

	<!-- Project Menu -->
	<div class="is-pa-hidden">
		<button
			class="project-actions"
			onclick={() => {
				showProjectMenu = true;
			}}
			aria-label="Project Menu {project.name}"
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

	.is-hidden:not(:hover) .is-pa-hidden {
		visibility: hidden;
	}

	.is-hidden img.bg {
		display: none;
	}
</style>
