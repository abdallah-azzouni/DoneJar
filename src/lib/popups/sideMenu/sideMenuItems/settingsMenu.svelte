<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { settingsStore } from '$lib/stores/dialog';
	import { theme, type Theme } from '$lib/stores/settings';

	const themeOptions: { value: Theme; label: string; icon: string }[] = [
		{ value: 'system', label: 'System', icon: '💻' },
		{ value: 'light', label: 'Light', icon: '☀️' },
		{ value: 'dark', label: 'Dark', icon: '🌙' }
	];

	function handleClose() {
		settingsStore.close();
	}
</script>

<Dialog.Root
	open={settingsStore.isOpen}
	onOpenChange={(o) => {
		if (!o) handleClose();
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9997 bg-black/50 backdrop-blur-[1px]" />

		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-9998 max-h-[90vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2
                   overflow-y-auto rounded-2xl border-2 border-text-main p-6 text-text-main"
		>
			<Dialog.Title class="mb-1 font-patrick-hand text-3xl font-bold">Settings ⚙️</Dialog.Title>
			<Dialog.Description class="mb-6 text-sm opacity-70">
				All settings are saved automatically and are not synced across devices.
			</Dialog.Description>

			<section class="flex flex-col gap-2">
				<span class="font-patrick-hand text-lg">Theme</span>

				<div class="grid grid-cols-3 gap-2" role="group" aria-label="Theme">
					{#each themeOptions as opt (opt.value)}
						{@const active = $theme === opt.value}
						<button
							type="button"
							aria-pressed={active}
							onclick={() => theme.set(opt.value)}
							class="flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2 font-patrick-hand text-lg
                                   transition focus-visible:outline-2 focus-visible:outline-offset-2
                                   {active
								? 'border-text-main bg-text-main text-panel'
								: 'border-text-main/30 hover:border-text-main hover:bg-text-main/10'}"
						>
							<span class="text-2xl" aria-hidden="true">{opt.icon}</span>
							{opt.label}
						</button>
					{/each}
				</div>
			</section>

			<div class="mt-8 flex justify-end">
				<button
					type="button"
					class="doodle-border rounded-lg bg-panel px-2 py-0.5 font-patrick-hand text-lg text-text-main
                           transition hover:bg-gray-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2"
					onclick={handleClose}
				>
					Done
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
