<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { sideMenuStore, sideMenuItems } from '$lib/stores/dialog';
</script>

<ThemedDialog
	mt="mt-10"
	w="w-1/3"
	h="h-3/4"
	cls="ml-auto mr-12 "
	isOpen={$sideMenuStore.isOpen}
	closeOnBackdrop={true}
>
	{#each sideMenuItems as item (item.index)}
		<button
			class="doodle-border mb-4 w-full rounded-lg p-2 text-left font-patrick-hand text-xl"
			onclick={() => item.action()}
		>
			<span>{item.label}</span>
		</button>
	{/each}
</ThemedDialog>
