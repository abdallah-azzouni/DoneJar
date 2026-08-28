<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { type ColumnWithNotes } from '$lib/types';
	import archive from './Archive.svelte';

	let { isOpen = $bindable(), column }: { isOpen: boolean; column: ColumnWithNotes } = $props();

	const tabs = [
		{ label: 'Archive', slug: 'archive', component: archive },
		{ label: 'Stats (Soon)', slug: 'stats' }
	];

	const disabledTabs = ['stats'];
	let activeTab = $state(tabs[0]);
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9998 bg-black/50 backdrop-blur-[1px]" />
		<Dialog.Content
			interactOutsideBehavior="ignore"
			class="fixed top-1/2 left-1/2 z-9998 aspect-[1.26] h-[90vh] max-w-[95vw] -translate-1/2 rounded-2xl p-4 shadow-lg sm:p-6"
		>
			<div class="flex h-full w-full flex-row gap-4">
				<!-- Side bar -->
				<div
					class="doodle-border hidden h-full w-1/3 flex-col gap-4 bg-[#e6dec9] p-3 font-patrick-hand text-xl sm:flex"
				>
					{#each tabs as tab (tab.slug)}
						<button
							class="w-full rounded-xl border-3 border-black p-3 disabled:pointer-events-none {activeTab.slug ===
							tab.slug
								? 'bg-white'
								: 'bg-gray-200'}"
							disabled={disabledTabs.includes(tab.slug)}
							onclick={() => {
								activeTab = tab;
							}}
						>
							{tab.label}
						</button>
					{/each}
				</div>

				<!-- Content -->
				<div class="flex h-full w-full flex-col gap-4">
					<div class="flex flex-row items-center">
						<div class="flex-1"></div>
						<!-- Title -->
						<div class="flex-1 text-center">
							<h2 class="hidden font-patrick-hand text-3xl font-bold sm:inline">
								{activeTab.label}
							</h2>
							<select
								bind:value={activeTab.slug}
								class="inline-block self-center font-patrick-hand text-3xl font-bold sm:hidden"
							>
								{#each tabs as tab (tab.slug)}
									<option
										value={tab.slug}
										class="text-sm disabled:pointer-events-none"
										disabled={disabledTabs.includes(tab.slug)}>{tab.label}</option
									>
								{/each}
							</select>
						</div>
						<div class="flex-1 text-right">
							<button
								class="rounded-2xl border-2 border-black bg-white px-6 py-2 font-bold transition-transform active:translate-y-1"
								type="button"
								onclick={() => {
									isOpen = false;
								}}
							>
								Exit
							</button>
						</div>
					</div>

					{#if activeTab.component}
						<activeTab.component {column} />
					{/if}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
