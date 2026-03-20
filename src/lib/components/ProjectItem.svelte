<script lang="ts">
	import kebabMenu from '$lib/assets/elements/kebabMenu.svg';
	import grayBG from '$lib/assets/elements/grayBG.svg';

	import { openProjectMenu } from '$lib/stores/projectMenuStore';
	import { textColorFromHex } from '$lib/UiHelper';
	import type { Project } from '$lib/types';
	import { currentProject } from '$lib/stores/currentProject';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';

	let { project }: { project: Project } = $props();
</script>

<a
	class="doodle-border relative flex items-center gap-8 {$currentProject?.id === project.id
		? ''
		: 'is-hidden'} cursor-pointer"
	href={resolve(ROUTES.PROJECT(project.id))}
	tabindex="0"
	aria-label={`Select project ${project.name}`}
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
		{(project.name?.[0] ?? '?').toUpperCase()}
	</span>

	<!-- Project Menu -->
	<div class="is-pa-hidden">
		<button
			class="project-actions"
			onclick={() => {
				openProjectMenu(project);
			}}
			aria-label={`Project Menu ${project.name}`}
		>
			<img src={kebabMenu} alt="Menu" class="pointer-events-none select-none" />
		</button>
	</div>
</a>

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
