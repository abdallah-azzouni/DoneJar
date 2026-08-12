<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { notify } from '$lib/stores/notificationStore';
	import { confirmMenu, notificationStore } from '$lib/stores/dialog';
	import { projectInvitesStore } from '$lib/stores/projectInvites.svelte';
	import { sessionStore } from '$lib/stores/currentUser.svelte';
	import { supabase } from '$lib/sb/sb';

	let { unreadCount = $bindable(0) }: { unreadCount?: number } = $props();

	$effect(() => {
		unreadCount = notifications.filter((n) => {
			const eventTime = n.respondedAt || n.createdAt;
			return new Date(eventTime) > new Date(lastCheckedAt);
		}).length;
	});

	let lastCheckedAt = $state<string>(
		typeof window !== 'undefined'
			? localStorage.getItem('last_notification_check') || new Date(0).toISOString()
			: new Date(0).toISOString()
	);
	let dismissedIds = $state<string[]>(
		typeof window !== 'undefined'
			? JSON.parse(localStorage.getItem('dismissed_notification_ids') || '[]')
			: []
	);

	let notifications = $derived(
		projectInvitesStore.allInvites.filter((item) => {
			if (dismissedIds.includes(item.id)) return false;

			const isTarget = item.targetId === sessionStore.current?.user.id;
			const isInviter = item.invitedBy === sessionStore.current?.user.id;

			if (isTarget && item.status === 'pending') return true;
			if (isInviter && (item.status === 'accepted' || item.status === 'rejected')) return true;

			return false;
		})
	);

	function handleOpenChange(open: boolean) {
		if (open) {
			const now = new Date().toISOString();
			lastCheckedAt = now;
			if (typeof window !== 'undefined') {
				localStorage.setItem('last_notification_check', now);
			}
		} else {
			notificationStore.close();
		}
	}

	async function handleRespond(inviteId: string, action: 'accepted' | 'rejected') {
		const confirmed = await confirmMenu({
			title: `${action === 'accepted' ? 'Accept' : 'Reject'} Invitation?`,
			body: `Are you sure you want to ${action} this invitation?`,
			actionLabel: action === 'accepted' ? 'Accept' : 'Reject',
			actionColor: action === 'accepted' ? 'success' : 'danger'
		});
		if (confirmed) {
			const { error } = await supabase
				.from('project_invites')
				.update({ status: action })
				.eq('id', inviteId);

			if (error) {
				notify({
					type: 'error',
					message: `Failed to ${action} invitation: ${error.message}`
				});
			} else {
				notify({
					type: 'success',
					message: `Invitation ${action}.`
				});
			}
		}
	}

	async function handleDismiss(inviteId: string) {
		dismissedIds = [...dismissedIds, inviteId];
		if (typeof window !== 'undefined') {
			localStorage.setItem('dismissed_notification_ids', JSON.stringify(dismissedIds));
		}

		notify({
			type: 'success',
			message: 'Notification dismissed.'
		});
	}
</script>

<Dialog.Root bind:open={notificationStore.isOpen} onOpenChange={handleOpenChange}>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9998 bg-black/40 backdrop-blur-[1px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-9998 flex max-h-2/3 w-[90vw] max-w-140 -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border-2 border-black bg-[#faf8f5] p-4 focus:outline-none"
		>
			<div class="mb-4 text-center">
				<Dialog.Title
					class="font-patrick-hand text-4xl font-black tracking-wide text-black uppercase"
				>
					NOTIFICATIONS
				</Dialog.Title>
			</div>
			<div class="flex-1 space-y-3 overflow-y-auto pr-1">
				{#if notifications.length === 0}
					<div class="py-12 text-center text-xs font-bold text-gray-500 italic">
						No notifications right now!
					</div>
				{:else}
					{#each notifications as item (item.id)}
						{@const eventTime = item.respondedAt || item.createdAt}
						{@const isUnread = new Date(eventTime) > new Date(lastCheckedAt)}
						{@const isInvitee = item.targetId === sessionStore.current?.user.id}

						<div
							class="relative flex flex-col gap-2 rounded-2xl border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all {isUnread
								? 'bg-white'
								: 'bg-gray-100 opacity-80'}"
						>
							<!-- Badge & Header -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									{#if isUnread}
										<span class="h-2.5 w-2.5 rounded-full border border-black bg-amber-400"></span>
									{/if}
									<h4 class="text-sm font-black text-black">
										{#if isInvitee}
											Project Invitation
										{:else}
											Invite Status Updated
										{/if}
									</h4>
								</div>
								<span class="text-xxs font-bold text-gray-500">
									{new Date(eventTime).toLocaleDateString()}
								</span>
							</div>

							<!-- Body Text -->
							<p class="text-xs leading-relaxed font-medium text-gray-700">
								{#if isInvitee}
									<strong class="text-black">{item.inviterEmail}</strong> invited you as an
									<span
										class="text-xxs rounded border border-black bg-amber-100 px-1 py-0.5 font-bold uppercase"
									>
										{item.role}
									</span>
								{:else}
									<strong class="text-black">{item.targetEmail}</strong>
									{item.status === 'accepted' ? 'accepted' : 'rejected'} your invitation.
								{/if}
							</p>

							<!-- Action Buttons -->
							<div class="mt-1 flex items-center justify-end gap-2 pt-1">
								{#if isInvitee && item.status === 'pending'}
									<button
										onclick={async () => await handleRespond(item.id, 'accepted')}
										class="rounded-full border-2 border-black bg-[#60a5fa] px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-none active:bg-blue-400"
									>
										Accept
									</button>
									<button
										onclick={async () => await handleRespond(item.id, 'rejected')}
										class="rounded-full border-2 border-black bg-[#fca5a5] px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-none active:bg-red-300"
									>
										Decline
									</button>
								{:else}
									<button
										onclick={() => handleDismiss(item.id)}
										class="rounded-full border-2 border-black bg-gray-200 px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-none active:bg-gray-300"
									>
										Dismiss
									</button>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="mt-4 flex justify-end border-t-2 border-dashed border-gray-300 pt-4">
				<button
					onclick={() => notificationStore.close()}
					class="rounded-full border-2 border-black bg-white px-6 py-1 text-sm font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 active:translate-x-px active:translate-y-px active:shadow-none"
				>
					Exit
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
