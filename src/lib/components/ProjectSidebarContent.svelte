<script lang="ts">
	import { projectStore } from '$lib/stores/projects.svelte';
	import ProjectItem from './ProjectItem.svelte';
	import { openProjectSetting } from '$lib/stores/dialog';
</script>

<div class="flex max-h-full flex-col items-center gap-2 text-sm">
	<div>
		<button
			class="doodle-border bg-[repeating-linear-gradient(45deg,#05df72_0,#05df72_2px,transparent_0,transparent_50%)] bg-size-[10px_10px] bg-fixed"
			onclick={() => openProjectSetting()}
		>
			<span class="font-patrick-hand text-xl font-bold">Create ➕</span>
		</button>
	</div>
	<div class="w-full border-t-2 border-dashed border-gray-500"></div>
	<div class="overflow-y-auto overflow-x-clip">
		{#each projectStore.projects as project (project.id)}
			<ProjectItem {project} />
		{/each}
	</div>
</div>
