<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { sideMenuStore, sideMenuItems } from '$lib/stores/dialog';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
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
		{#if item.label !== 'profile'}
			<button
				class="doodle-border mb-4 w-full rounded-lg p-2 text-left font-patrick-hand text-xl"
				onclick={() => item.action()}
			>
				<span>{item.label}</span>
			</button>
		{:else if true}
			<hr class="my-4 mt-auto border-2 border-dashed border-gray-300" />
			<button
				class="doodle-border mb-4 w-full rounded-lg p-2 text-left font-patrick-hand text-xl"
				onclick={() => item.action()}
			>
				<img
					//src={getURLfromObject($currentUser, $currentUser?.avatar)}
					alt="Avatar"
					class=" mr-2 inline-block size-9 rounded-full border-2 border-black p-1"
				/>
				<!-- <span>{$currentUser?.name}</span> -->
				<span>Lorem ipsum</span>
			</button>
		{:else}
			<hr class="my-4 mt-auto border-2 border-dashed border-gray-300" />

			<button
				class="doodle-border mb-4 w-full rounded-lg p-2 text-left font-patrick-hand text-xl"
				onclick={() => {
					sideMenuStore.close();
					goto(resolve('/auth/login'));
				}}
			>
				<span>Login</span>
			</button>
		{/if}
	{/each}
</ThemedDialog>
