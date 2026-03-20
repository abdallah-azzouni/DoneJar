<script lang="ts">
	import { openProjectMenu } from '$lib/stores/projectMenuStore';
</script>

<div class="flex h-full w-full flex-1 flex-col items-center justify-center">
	<div class="doodle-border max-w-md bg-white p-10 text-center shadow-xl">
		<h1 class="mb-4 font-patrick-hand text-5xl font-bold text-gray-900">Nothing selected 👈</h1>
		<p class="mb-6 text-lg text-gray-600">
			Pick a project from the sidebar or create a new one to get started.
		</p>
		<button
			class="doodle-border bg-yellow-400 px-6 py-3 font-patrick-hand text-2xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
			onclick={() => openProjectMenu()}
		>
			Create a Project
		</button>
	</div>
</div>
