<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { sideMenuStore, sideMenuItems } from '$lib/stores/dialog';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getAppState } from '$lib/stores/appState.svelte';
	import { sessionStore } from '$lib/stores/currentUser.svelte';
</script>

<ThemedDialog
	mt="mt-10"
	w="w-1/3"
	h="h-3/4"
	cls="ml-auto mr-12 "
	isOpen={sideMenuStore.isOpen}
	onClose={() => sideMenuStore.close()}
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
		{:else if getAppState() == 'LOGGED_IN'}
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
				<span>{sessionStore.current?.user?.user_metadata?.display_name}</span>
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
