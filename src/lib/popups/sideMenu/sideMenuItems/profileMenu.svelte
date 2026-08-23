<script lang="ts">
	import { profileMenuStore } from '$lib/stores/dialog';
	import { Dialog } from 'bits-ui';
	import { currentSessionId } from '$lib/stores/currentUser.svelte';
	import { exportStore } from '$lib/stores/dialog';
	import { signOut } from '$lib/sb/auth';
	import { type Profile } from '$lib/types';
	import { supabase } from '$lib/sb/sb';
	import { userSessionsStore } from '$lib/stores/userSessionsStore.svelte';
	import Bowser from 'bowser';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ROUTES } from '$lib/constants';
	import { notify } from '$lib/stores/notificationStore';
	import { confirmMenu } from '$lib/stores/dialog';

	let { profile, onProfileUpdated }: { profile: Profile; onProfileUpdated: () => Promise<void> } =
		$props();

	type Tab = 'account' | 'danger';
	let activeTab = $state<Tab>('account');

	let editingName = $state(false);
	let nameValue = $state('');
	let savingName = $state(false);
	let nameError = $state('');

	const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

	function formatDate(dateStr: string | undefined): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function startEditing() {
		nameValue = profile.display_name ?? '';
		editingName = true;
	}

	function close() {
		profileMenuStore.close();
		activeTab = 'account';
		editingName = false;
		nameError = '';
	}

	function parseUserAgent(uaFromSupabase: string | undefined): string {
		if (!uaFromSupabase) return '❓ Unknown Device';
		const parser = Bowser.getParser(uaFromSupabase);
		const platform = parser.getPlatformType() || 'desktop';
		let emoji = platform === 'mobile' ? '📱' : platform === 'tablet' ? '📟' : '💻';
		return `${emoji} ${parser.getOSName() || 'OS'} • ${parser.getBrowserName() || 'Browser'}`;
	}

	async function saveName() {
		if (!nameValue.trim()) {
			nameError = 'Name cannot be empty.';
			return;
		}
		savingName = true;
		nameError = '';
		try {
			const { error } = await supabase
				.from('profiles')
				.update({ display_name: nameValue.trim() })
				.eq('id', profile.id);
			if (error) throw new Error(error.message);
			editingName = false;
			await onProfileUpdated();
		} catch (e) {
			nameError = e instanceof Error ? e.message : 'Failed to save name.';
		} finally {
			savingName = false;
		}
	}

	function closeConfirm() {
		confirmDelete = false;
		otpCode = '';
		textConfirm = '';
	}

	let confirmDelete = $state(false);
	let otpCode = $state('');
	let textConfirm = $state('');
	async function handleDeleteAccount() {
		try {
			const confirm = await confirmMenu({
				title: 'Verify Account Ownership',
				body: 'To begin account deletion, we need to send a one-time passcode (OTP) to your email address to confirm it’s really you.',
				actionLabel: 'Send Verification Code',
				actionColor: 'danger',
				cancelLabel: 'Cancel'
			});

			if (!confirm) {
				closeConfirm();
				return;
			}
			const { error } = await supabase.auth.signInWithOtp({
				email: profile.email!,
				options: { shouldCreateUser: false }
			});

			if (error) {
				console.error(error);
				notify({ message: 'Failed to send verification code. Please try again.', type: 'error' });
				return;
			}
			confirmDelete = true;
			notify({ message: 'Verification code sent! Check your inbox.', type: 'success' });
		} catch (e) {
			console.error(e instanceof Error ? e.message : 'Failed to delete account.');
		}
	}
	let deletingAccount = $state(false);
	async function deleteAccount() {
		if (textConfirm !== 'DELETE' || !otpCode.trim()) {
			return;
		}
		try {
			deletingAccount = true;
			const { data, error } = await supabase.functions.invoke('delete-account', {
				body: { otp: otpCode.trim() }
			});
			if (error) {
				let message = error.message;

				try {
					const body = await error.context.json();
					message = body.error ?? message;
				} catch {
					notify({ message: 'Failed to delete account. Please try again.', type: 'error' });
					return;
				}
				notify({
					message,
					type: 'error'
				});
				return;
			}

			if (data?.success) {
				notify({ message: 'Account deleted successfully.', type: 'success' });
				await signOut('global');
			}
		} catch (e) {
			console.error(e instanceof Error ? e.message : 'Failed to delete account.');
		} finally {
			deletingAccount = false;
			closeConfirm();
		}
	}

	function exportRedirect() {
		close();
		exportStore.open();
	}

	async function HandleLogout() {
		close();
		await signOut();
	}

	const tabs: { id: Tab; label: string; icon: string }[] = [
		{ id: 'account', label: 'Account & Security', icon: '⚙️' },
		{ id: 'danger', label: 'Danger Zone', icon: '⚠️' }
	];
</script>

<Dialog.Root
	open={confirmDelete}
	onOpenChange={(o) => {
		if (!o) closeConfirm();
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9999 bg-black/40 backdrop-blur-xs" />
		<Dialog.Content
			interactOutsideBehavior="ignore"
			class="fixed top-[5%] left-1/2 z-9999 w-full max-w-lg -translate-x-1/2 rounded-2xl border-3 border-black bg-[#fbf9f1] p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
		>
			<!-- Header with sketchy accent -->
			<div class="flex items-center justify-between border-b-2 border-black/80 pb-3">
				<Dialog.Title class="font-patrick-hand text-2xl font-bold tracking-wide text-red-600">
					⚠️ Delete Account?
				</Dialog.Title>
			</div>

			<Dialog.Description class="mt-4 font-patrick-hand text-lg leading-relaxed text-gray-800">
				Are you sure you want to delete your account? This action is <strong
					class="underline decoration-red-500 decoration-2">irreversible</strong
				> and all your jar data, notes, and boards will be wiped out forever.
			</Dialog.Description>

			<div class="mt-5 flex flex-col gap-3 font-patrick-hand text-base font-bold text-gray-800">
				<!-- OTP Input Row -->
				<div
					class="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-gray-400 bg-[#f4efe0] p-3"
				>
					<label for="otp-input" class="text-lg">OTP code from email:</label>
					<input
						id="otp-input"
						type="text"
						bind:value={otpCode}
						inputmode="numeric"
						placeholder="123456"
						class="w-32 rounded-lg border-2 border-black bg-white px-3 py-1 text-center font-patrick-hand text-xl font-bold tracking-widest text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-black focus:outline-none"
					/>
				</div>

				<!-- Confirmation String Row -->
				<div
					class="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-gray-400 bg-[#f4efe0] p-3"
				>
					<label for="text-confirm" class="text-lg">
						Type <span
							class="rounded border border-red-300 bg-red-100 px-1 py-0.5 font-mono text-red-600"
							>DELETE</span
						> to confirm:
					</label>
					<input
						id="text-confirm"
						type="text"
						bind:value={textConfirm}
						placeholder="DELETE"
						class="w-36 rounded-lg border-2 border-black bg-white px-3 py-1 text-center font-patrick-hand text-xl font-bold tracking-wider text-red-600 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-red-500 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="mt-6 flex justify-end gap-3 font-patrick-hand text-lg">
				<button
					type="button"
					class="rounded-xl border-2 border-black bg-gray-200 px-5 py-1.5 font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:bg-gray-300 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
					onclick={() => closeConfirm()}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-xl border-2 border-black bg-red-500 px-6 py-1.5 font-bold text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:pointer-events-none disabled:border-gray-400 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
					onclick={() => deleteAccount()}
					disabled={textConfirm !== 'DELETE' || !otpCode.trim() || deletingAccount}
				>
					{deletingAccount ? 'Deleting...' : 'Delete Account'}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<Dialog.Root
	open={profileMenuStore.isOpen}
	onOpenChange={(o) => {
		if (!o) close();
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9998 bg-black/40 backdrop-blur-[2px]" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-9998 flex h-[85vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl shadow-2xl sm:w-[80vw] md:w-[60vw] lg:w-[40vw]"
		>
			<!-- ── Doodle-Themed Header ── -->
			<div
				class="flex shrink-0 items-center gap-4 border-b-2 border-black bg-[#e6dec9] px-6 pt-5 pb-4"
			>
				<!-- Avatar -->
				<div
					class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-patrick-hand text-2xl font-bold text-black"
				>
					{(profile.display_name?.match(/\b\w/g)?.join('').slice(0, 2) || '').toUpperCase() ?? '?'}
				</div>

				<!-- Name + email + member date -->
				<div class="min-w-0 flex-1">
					{#if editingName}
						<div class="mb-1 flex items-center gap-1.5">
							<input
								type="text"
								bind:value={nameValue}
								class="w-full rounded-md border-2 border-black bg-white px-2 py-0.5 font-patrick-hand text-lg font-bold focus:outline-none"
								onkeydown={(e) => {
									if (e.key === 'Enter') saveName();
									if (e.key === 'Escape') {
										editingName = false;
										nameValue = profile.display_name ?? '';
									}
								}}
							/>
							<button
								class="rounded-md border-2 border-black bg-white px-2 py-0.5 font-patrick-hand text-xs font-bold hover:bg-gray-100"
								onclick={saveName}
								disabled={savingName}
							>
								{savingName ? '...' : '✓'}
							</button>
							<button
								class="rounded-md border-2 border-black bg-white px-2 py-0.5 font-patrick-hand text-xs font-bold hover:bg-gray-100"
								onclick={() => {
									editingName = false;
									nameValue = profile.display_name ?? '';
									nameError = '';
								}}>✕</button
							>
						</div>
					{:else}
						<button
							class="flex items-center gap-1.5 font-patrick-hand text-xl font-bold text-black hover:opacity-80"
							onclick={startEditing}
							title="Edit display name"
						>
							<span class="truncate">{profile.display_name ?? 'User'}</span>
							<span class="text-xs text-gray-600">✏️</span>
						</button>
					{/if}

					{#if nameError}
						<p class="text-xs font-bold text-red-600">{nameError}</p>
					{/if}

					<p class="truncate text-xs font-medium text-gray-700">{profile.email ?? ''}</p>
					<p class="mt-0.5 text-[11px] font-bold text-gray-500">
						Member since {formatDate(profile.created_at)}
					</p>
				</div>
			</div>

			<!-- ── Tabs ── -->
			<div class="flex shrink-0 border-b-2 border-black">
				{#each tabs as tab (tab.id)}
					<button
						class="flex-1 border-r-2 border-black py-2.5 font-patrick-hand text-sm font-bold transition-colors last:border-r-0
                    {activeTab === tab.id
							? 'bg-[#f5a623] text-black'
							: 'bg-white text-gray-500 hover:bg-orange-50'}"
						onclick={() => (activeTab = tab.id)}
					>
						{tab.icon}
						{tab.label}
					</button>
				{/each}
			</div>

			<!-- ── Tab Content ── -->
			<div class="flex-1 overflow-y-auto bg-[#f4efe6] px-6 py-4">
				{#if activeTab === 'account'}
					<div class="space-y-4">
						<!-- Password -->
						<div class="doodle-border rounded-xl bg-gray-50 p-3.5">
							<p class="font-patrick-hand text-sm font-bold text-black">Password & Auth</p>
							<p class="mb-2 text-xs text-gray-600">
								Update your password anytime. You'll need to enter your current password to save
								changes.
							</p>

							<button
								class="rounded-lg border-2 border-black bg-white px-3 py-1.5 font-patrick-hand text-xs font-bold hover:bg-gray-100"
								onclick={() => {
									close();
									goto(resolve(ROUTES.PASSWORD_RESET));
								}}
							>
								Change Password
							</button>
						</div>

						<!-- Active Devices (Compact) -->
						<div class="doodle-border rounded-xl bg-gray-50 p-3.5">
							<p class="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
								Active Devices
							</p>
							{#if !userSessionsStore.isReady}
								<p class="py-1 text-xs text-gray-400">Loading devices...</p>
							{:else if userSessionsStore.error}
								<p class="text-xs text-red-600">Error: {userSessionsStore.error}</p>
							{:else if userSessionsStore.allSessions.length === 0}
								<p class="text-xs text-gray-500">No active sessions found.</p>
							{:else}
								<ul class="max-h-36 space-y-2 overflow-y-auto pr-1">
									{#each userSessionsStore.allSessions as session (session.session_id)}
										<li
											class="flex items-center justify-between border-b border-dashed border-gray-300 pb-2 last:border-0 last:pb-0"
										>
											<div class="min-w-0 pr-2">
												<p class="truncate text-xs font-bold text-black">
													{parseUserAgent(session.user_agent)}
												</p>
												<p class="text-xxs text-gray-500">
													{regionNames.of(session.country_code || 'ZZ') || 'Unknown'} • {formatDate(
														session.created_at
													)}
												</p>
											</div>
											{#if session.session_id !== currentSessionId()}
												<button
													class="shrink-0 rounded-md border border-red-500 bg-white px-2 py-0.5 font-patrick-hand text-xs font-bold text-red-600 hover:bg-red-50"
													onclick={() => userSessionsStore.kickDevice(session.session_id)}
													disabled={session.isKicking}
												>
													{session.isKicking ? '...' : 'Sign Out'}
												</button>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</div>

						<!-- Logout -->
						<button
							class="w-full rounded-xl border-2 border-black bg-white py-2.5 font-patrick-hand text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
							onclick={HandleLogout}
						>
							🚪 Log Out
						</button>
					</div>
				{:else if activeTab === 'danger'}
					<div class="space-y-3">
						<div class="doodle-border rounded-xl bg-gray-50 p-3.5">
							<p class="font-patrick-hand text-sm font-bold text-black">Export Data</p>
							<p class="mb-2 text-xs text-gray-600">
								Download a full backup of all your notes and jars.
							</p>
							<button
								class="rounded-lg border-2 border-black bg-white px-3 py-1.5 font-patrick-hand text-xs font-bold hover:bg-gray-100"
								onclick={exportRedirect}
							>
								🍰 Go to Export
							</button>
						</div>

						<div class="doodle-border rounded-xl bg-[#fef9f9] p-3.5">
							<p class="font-patrick-hand text-sm font-bold text-red-800">Delete Account</p>
							<p class="mb-2 text-xs text-red-600">Permanently delete your account and all data.</p>
							<button
								type="button"
								class="rounded-lg border border-red-400 bg-white px-3 py-1.5 font-patrick-hand text-xs font-bold text-red-500"
								onclick={() => handleDeleteAccount()}
							>
								🗑 Delete Account
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- ── Footer ── -->
			<div
				class="flex shrink-0 items-center justify-between border-t-2 border-dashed border-gray-300 px-2 py-2"
			>
				<span class="text-xxs font-mono text-gray-400 select-all" title="User ID"
					>{profile.id ?? ''}</span
				>
				<button
					class="font-patrick-hand text-xs font-bold text-gray-500 hover:text-black"
					onclick={close}
				>
					Close ✕
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
