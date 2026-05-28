<script lang="ts">
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { sideMenuStore, sideMenuItems } from '$lib/stores/dialog';
	import { isLoggedIn } from '$lib/pb/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { currentUser } from '$lib/stores/currentUser';
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
		{:else if isLoggedIn()}
			<button
				class="doodle-border mb-4 w-full rounded-lg p-2 text-left font-patrick-hand text-xl"
				onclick={() => item.action()}
			>
				<span>{$currentUser?.name}</span>
			</button>
		{:else}
			<button
				class="doodle-border mb-4 w-full rounded-lg p-2 text-left font-patrick-hand text-xl"
				onclick={() => {
					sideMenuStore.close();
					goto(resolve('/auth/login'));
				}}
			>
				<img src={$currentUser?.avatar} alt="avatar" class="mr-2 inline-block h-5 w-5" />
				<span>Login</span>
			</button>
		{/if}
	{/each}
</ThemedDialog>
