<script lang="ts">
	import { projectStore } from '$lib/stores/projects.svelte';
	import ProjectItem from './ProjectItem.svelte';
	import { openProjectSetting, confirmMenu } from '$lib/stores/dialog';
	import { subscriptionStore } from '$lib/stores/subscription.svelte';
	import { FREE_MAX_PROJECTS } from '$lib/constants';
</script>

<div class="flex max-h-full flex-col items-center gap-2 text-sm">
	<div>
		<button
			class="doodle-border relative bg-[repeating-linear-gradient(45deg,#05df72_0,#05df72_2px,transparent_0,transparent_50%)] bg-size-[10px_10px] bg-fixed"
			onclick={() => {
				if (!subscriptionStore.isPro && projectStore.projects.length >= FREE_MAX_PROJECTS) {
					confirmMenu({
						title: 'Free Plan Limit Reached',
						body: `You've reached the maximum limit of ${FREE_MAX_PROJECTS} free projects. Pro plans are coming soon!`,
						actionLabel: 'Got it',
						actionColor: 'primary'
					});
				} else {
					openProjectSetting();
				}
			}}
		>
			<!-- Overlay -->
			{#if !subscriptionStore.isPro && projectStore.projects.length >= FREE_MAX_PROJECTS}
				<div
					class="absolute -inset-2 z-10 flex items-center justify-center rounded bg-slate-900/60 backdrop-blur-xs"
				>
					<span class="flex items-center gap-1 font-patrick-hand text-sm font-bold text-[#e6dec9]">
						🔒 Upgrade
					</span>
				</div>
			{/if}
			<span class="font-patrick-hand text-xl font-bold">Create ➕</span>
		</button>
	</div>
	<div class="w-full border-t-2 border-dashed border-gray-500"></div>
	<div class="overflow-x-clip overflow-y-auto">
		{#each projectStore.projects as project (project.id)}
			<ProjectItem {project} />
		{/each}
	</div>
</div>
