<script lang="ts">
	import kebabMenu from '$lib/assets/elements/kebabMenu.svg';
	import grayBG from '$lib/assets/elements/grayBG.svg';
	import { openProjectMenu, projectMenuStore } from '$lib/stores/dialog';
	import { textColorFromHex } from '$lib/UiHelper';
	import type { ProjectDocType } from '$lib/db/schemas';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';

	let { project }: { project: ProjectDocType } = $props();

	let isMenuOpen = $derived(
		projectMenuStore.data?.project?.id === project.id && projectMenuStore.isOpen
	);
</script>

<div
	class="doodle-border {projectStore.current?.id === project.id
		? 'bg-white'
		: 'is-hidden'} {isMenuOpen ? 'is-menu-open' : ''} *:z-10"
>
	<a
		class="relative flex cursor-pointer items-center gap-8"
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
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					openProjectMenu({
						project: project,
						position: { x: e.clientX, y: e.clientY }
					});
				}}
				aria-label={`Project Menu ${project.name}`}
			>
				<img src={kebabMenu} alt="Menu" class="pointer-events-none select-none" />
			</button>
		</div>
	</a>
</div>

<style>
	/* Doodle Border */
	.is-hidden:not(:hover):not(.is-menu-open) {
		border-image-source: none !important;
		border-color: transparent !important;
	}

	/* 3 Dot button */
	.is-hidden:not(:hover):not(.is-menu-open) .is-pa-hidden {
		visibility: hidden;
	}

	/* Background Image */
	.is-hidden img.bg {
		display: none;
	}
</style>
