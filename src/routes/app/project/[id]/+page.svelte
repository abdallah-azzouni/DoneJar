<script lang="ts">
	import Board from '$lib/components/Board.svelte';
	import { currentProject } from '$lib/stores/currentProject';
	import { goto } from '$app/navigation';
	import { ROUTES } from '$lib/constants';
	import { resolve } from '$app/paths';
</script>

{#if $currentProject}
	<Board />
{:else}
	<div class="flex h-full w-full flex-1 flex-col items-center justify-center gap-6">
		<div class="doodle-border max-w-md bg-white p-10 text-center shadow-xl">
			<h1 class="mb-4 font-patrick-hand text-5xl font-bold text-gray-900">Oops! 🔍</h1>
			<p class="mb-6 text-lg text-gray-600">
				We couldn't find that project. It may have been deleted, the link may be invalid, or you may
				not have permission to access it.
			</p>
			<button
				class="doodle-border bg-yellow-400 px-6 py-3 font-patrick-hand text-2xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
				onclick={() => goto(resolve(ROUTES.APP))}
			>
				Go Home
			</button>
		</div>
	</div>
{/if}
