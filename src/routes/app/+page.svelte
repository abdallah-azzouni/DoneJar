<script lang="ts">
	import { openProjectSetting } from '$lib/stores/dialog';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { subscriptionStore } from '$lib/stores/subscription.svelte';
	import { confirmMenu } from '$lib/stores/dialog';
	import { FREE_MAX_PROJECTS } from '$lib/constants';
</script>

<div class="flex h-full w-full flex-1 flex-col items-center justify-center">
	{#if projectStore.projects.length === 0}
		<div class="doodle-border max-w-2xl bg-white p-12 text-center shadow-xl">
			<h1 class="mb-4 font-patrick-hand text-6xl font-bold text-gray-900">Let's Get Started! 🎉</h1>
			<p class="mb-8 text-xl text-gray-600">
				Create your first project to start tracking tasks. Projects help you organize work, personal
				life, or anything else separately.
			</p>
			<button
				class="doodle-border bg-yellow-400 px-8 py-4 font-patrick-hand text-3xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
				onclick={() => openProjectSetting()}
			>
				Create Your First Project
			</button>
			<p class="mt-6 text-sm text-gray-500">
				Tip: Try naming it something like "Work" or "Personal"
			</p>
		</div>{:else}
		<div class="doodle-border max-w-md bg-white p-10 text-center shadow-xl">
			<h1 class="mb-4 font-patrick-hand text-5xl font-bold text-gray-900">Nothing selected 👈</h1>
			<p class="mb-6 text-lg text-gray-600">
				Pick a project from the sidebar or create a new one to get started.
			</p>
			<button
				class="doodle-border relative bg-yellow-400 px-6 py-3 font-patrick-hand text-2xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
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
						<span
							class="flex items-center gap-1 font-patrick-hand text-sm font-bold text-[#e6dec9]"
						>
							🔒 Upgrade
						</span>
					</div>
				{/if}
				Create a Project
			</button>
		</div>
	{/if}
</div>
