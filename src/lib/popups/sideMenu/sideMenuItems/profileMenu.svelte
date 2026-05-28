<script lang="ts">
	import { profileMenuStore } from '$lib/stores/dialog';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
</script>

<ThemedDialog
	mt="mt-10"
	w="w-1/4"
	h="h-1/4"
	cls="ml-auto mr-12 "
	isOpen={$profileMenuStore.isOpen}
	closeOnBackdrop={true}
>
	Test</ThemedDialog
>
