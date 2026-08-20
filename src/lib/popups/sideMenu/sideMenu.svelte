<script lang="ts">
	import { sideMenuStore, sideMenuRows } from '$lib/stores/dialog';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getAppState } from '$lib/stores/appState.svelte';
	import { sessionStore } from '$lib/stores/currentUser.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { Drawer } from 'vaul-svelte';
	import { Dialog } from 'bits-ui';

	const isWide = new MediaQuery('(min-width: 640px)');

	const profileId = 4;

	const disabledIds = $derived(getAppState() !== 'LOGGED_IN' ? [2, 3] : [2]);
	$effect(() => {
		sideMenuRows.map((row) => {
			row.items.map((item) => {
				if (item.id === 3) {
					item.label =
						getAppState() !== 'LOGGED_IN' ? 'Feedback 💬 (Login Required)' : 'Feedback 💬';
				}
			});
		});
	});
</script>

{#snippet content()}
	{#each sideMenuRows as row, i (i)}
		<div
			class="mb-4 grid gap-3 [*&>button]:bg-white"
			style="grid-template-columns: repeat({row.items.length}, minmax(0, 1fr));"
		>
			{#each row.items.filter((item) => item.id !== profileId) as item (item.id)}
				<button
					class="doodle-border w-full rounded-lg p-2 text-left font-patrick-hand text-xl disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
					disabled={disabledIds.includes(item.id)}
					onclick={() => {
						sideMenuStore.close();
						item.action();
					}}
				>
					<span>{item.label}</span>
				</button>
			{/each}
		</div>
	{/each}
	<hr class="my-4 mt-auto border-2 border-dashed border-gray-300" />

	{#if getAppState() === 'LOGGED_IN'}
		<button
			class="doodle-border mb-4 w-full rounded-lg bg-white p-2 text-left font-patrick-hand text-xl"
			onclick={() => {
				sideMenuStore.close();
				sideMenuRows[3].items[0].action();
			}}
		>
			<img
				//src={getURLfromObject($currentUser, $currentUser?.avatar)}
				alt="Avatar"
				class="mr-2 inline-block size-9 rounded-full border-2 border-black p-1"
			/>
			<span>{sessionStore.current?.user?.user_metadata?.display_name}</span>
		</button>
	{:else}
		<button
			class="doodle-border mb-4 w-full rounded-lg bg-white p-2 text-left font-patrick-hand text-xl"
			onclick={() => {
				sideMenuStore.close();
				goto(resolve('/auth/login'));
			}}
		>
			<span>Login</span>
		</button>
	{/if}{/snippet}

{#if !isWide.current}
	<Drawer.Root
		open={sideMenuStore.isOpen}
		onOpenChange={(open) => {
			if (!open) sideMenuStore.close();
		}}
	>
		<Drawer.Portal>
			<Drawer.Overlay class="fixed inset-0 z-9997 bg-black/50 backdrop-blur-[1px]" />
			<Drawer.Content
				class="fixed bottom-0 z-9997 max-h-2/3 w-full max-w-none rounded-t-2xl bg-white p-6 shadow-lg"
			>
				<div class="flex h-full flex-col">
					<hr class="mx-auto mb-6 w-1/3 rounded-3xl border-2 border-gray-500 bg-gray-500" />
					{@render content()}
				</div>
			</Drawer.Content>
			<Drawer.Overlay />
		</Drawer.Portal>
	</Drawer.Root>
{:else}
	<Dialog.Root
		open={sideMenuStore.isOpen}
		onOpenChange={(open) => {
			if (!open) sideMenuStore.close();
		}}
	>
		<Dialog.Portal to="body">
			<Dialog.Overlay class="fixed inset-0 z-9997 bg-black/50 backdrop-blur-[1px]" />
			<Dialog.Content
				class="fixed top-[-5%] right-[-4%] z-9997 mt-10 mr-12 ml-auto h-3/4 w-1/3 rounded-2xl p-6 shadow-lg"
			>
				<div class="flex h-full flex-col">
					{@render content()}
				</div>
			</Dialog.Content>
			<Dialog.Overlay />
		</Dialog.Portal>
	</Dialog.Root>
{/if}
