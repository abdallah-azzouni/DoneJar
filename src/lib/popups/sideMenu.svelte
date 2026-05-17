<script lang="ts">
	import ThemedDialog from './ThemedDialog.svelte';
	import { sideMenuStore } from '$lib/stores/dialog/sideMenuStore';
</script>

<ThemedDialog mt="mt-10" w="w-1/3" h="h-3/4" cls="ml-auto mr-12 " isOpen={$sideMenuStore.isOpen}>
	<button
		class="doodle-border mb-4 w-full rounded-lg p-2 text-left font-patrick-hand text-xl"
		on:click={() => sideMenuStore.openImportExport()}
	>
		<span>Import/Export</span>
	</button>
</ThemedDialog>
