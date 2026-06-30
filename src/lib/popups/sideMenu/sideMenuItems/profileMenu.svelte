<script lang="ts">
	import { profileMenuStore } from '$lib/stores/dialog';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import { sessionStore } from '$lib/stores/currentUser.svelte';
	import { exportStore } from '$lib/stores/dialog';
	import { signOut, sendPasswordResetEmail } from '$lib/sb/auth';
	import { notify } from '$lib/stores/notificationStore';
	import { failure } from '$lib/types';

	// --- Types ---
	type Tab = 'profile' | 'account' | 'danger';

	// --- State ---
	let activeTab = $state<Tab>('profile');
	let editingName = $state(false);
	let nameValue = $state('');
	let savingName = $state(false);
	let nameError = $state('');

	let sendingVerification = $state(false);
	let verificationSent = $state(false);

	let sendingReset = $state(false);
	let resetSent = $state(false);

	let avatarUploading = $state(false);
	let avatarFileInput: HTMLInputElement;

	let currentUser = sessionStore.current?.user;

	// Sync nameValue when currentUser changes
	$effect(() => {
		if (currentUser?.user_metadata?.display_name)
			nameValue = currentUser.user_metadata.display_name;
	});

	// --- Helpers ---
	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function formatDate(dateStr: string | undefined): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function close() {
		profileMenuStore.close();
		activeTab = 'profile';
		editingName = false;
		nameError = '';
	}

	// --- Actions ---
	async function saveName() {
		if (!nameValue.trim()) {
			nameError = 'Name cannot be empty.';
			return;
		}
		savingName = true;
		nameError = '';
		try {
			// await updateUserInfo({ name: nameValue.trim() });
			editingName = false;
		} catch (e) {
			nameError = e instanceof Error ? e?.message : 'Failed to save name.';
		} finally {
			savingName = false;
		}
	}

	async function sendVerificationEmail() {
		if (!currentUser?.email) return;
		sendingVerification = true;
		try {
			// await pb.collection('users').requestVerification(currentUser.email);
			verificationSent = true;
		} catch {
			// silently fail — user sees nothing changed
		} finally {
			sendingVerification = false;
		}
	}

	async function sendPasswordReset() {
		if (!currentUser?.email) return;
		sendingReset = true;
		try {
			const result = await sendPasswordResetEmail(currentUser.email);
			notify(failure(result?.error?.message ?? 'Failed to send reset email.'));
			if (!result?.error) {
				resetSent = true;
			}
		} catch {
			// silently fail
		} finally {
			sendingReset = false;
		}
	}

	async function handleAvatarChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		avatarUploading = true;
		try {
			const form = new FormData();
			form.append('avatar', file);
			// await updateUserInfo(form);
		} catch {
			// silently fail
		} finally {
			avatarUploading = false;
		}
	}

	function exportRedirect() {
		close();
		exportStore.open();
	}

	async function HandleLogout() {
		await signOut();
		close();
	}

	// --- Tab config ---
	const tabs: { id: Tab; label: string; icon: string }[] = [
		{ id: 'profile', label: 'Profile', icon: '👤' },
		{ id: 'account', label: 'Account', icon: '⚙️' },
		{ id: 'danger', label: 'Danger', icon: '⚠️' }
	];
</script>

<ThemedDialog
	mt="mt-10"
	w="w-[480px]"
	h="h-auto"
	cls="mx-auto max-h-[85vh] overflow-hidden"
	isOpen={profileMenuStore.isOpen}
	onClose={close}
	closeOnBackdrop={true}
>
	<!-- ── Header ── -->
	<div class="flex shrink-0 items-center gap-4 border-b-2 border-black bg-[#f5a623] px-6 pt-5 pb-4">
		<!-- Avatar -->
		<div class="relative shrink-0">
			<button
				class="justify-content-center flex h-16 w-16 items-center overflow-hidden rounded-full border-2 border-black bg-white transition-opacity hover:opacity-90 focus:outline-none"
				onclick={() => avatarFileInput.click()}
				title="Change avatar"
				disabled={avatarUploading}
			>
				<!--  currentUser?.avatar && getURLfromObject(currentUser, currentUser.avatar)} -->
				{#if false}
					<img
						//src={getURLfromObject(currentUser, currentUser.avatar)}
						alt="Avatar"
						class="h-full w-full object-cover"
					/>
				{:else}
					<span
						class="w-full text-center font-patrick-hand text-2xl leading-none font-bold text-black"
					>
						{getInitials(currentUser?.user_metadata?.display_name ?? '?')}
					</span>
				{/if}
				{#if avatarUploading}
					<div class="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
						<span class="text-xs font-bold">...</span>
					</div>
				{/if}
			</button>
			<div
				class="pointer-events-none absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-white text-[11px]"
			>
				📷
			</div>
			<input
				bind:this={avatarFileInput}
				type="file"
				accept="image/*"
				class="hidden"
				onchange={handleAvatarChange}
			/>
		</div>

		<!-- Name + email + badge -->
		<div class="min-w-0 flex-1">
			{#if editingName}
				<div class="mb-1 flex items-center gap-2">
					<input
						type="text"
						bind:value={nameValue}
						class="w-full rounded-md border-2 border-black bg-white/80 px-2 py-0.5 font-patrick-hand text-xl font-bold focus:outline-none"
						onkeydown={(e) => {
							if (e.key === 'Enter') saveName();
							if (e.key === 'Escape') {
								editingName = false;
								nameValue = currentUser?.user_metadata?.display_name ?? '';
							}
						}}
					/>
					<button
						class="shrink-0 rounded-md border-2 border-black bg-white px-2 py-1 text-xs font-bold hover:bg-gray-100"
						onclick={saveName}
						disabled={savingName}
					>
						{savingName ? '...' : '✓'}
					</button>
					<button
						class="shrink-0 rounded-md border-2 border-black bg-white px-2 py-1 text-xs font-bold hover:bg-gray-100"
						onclick={() => {
							editingName = false;
							nameValue = currentUser?.user_metadata?.display_name ?? '';
							nameError = '';
						}}>✕</button
					>
				</div>
			{:else}
				<button
					class="mb-1 flex items-center gap-1 font-patrick-hand text-xl font-bold text-black decoration-dashed underline-offset-2 hover:underline"
					onclick={() => {
						editingName = true;
					}}
					title="Edit name"
				>
					{currentUser?.user_metadata?.display_name ?? 'User'}
					<span class="text-sm opacity-60">✏️</span>
				</button>
			{/if}
			{#if nameError}
				<p class="mb-1 text-xs font-bold text-red-700">{nameError}</p>
			{/if}
			<p class="mb-1.5 truncate text-sm text-[#4a2e00]">{currentUser?.email ?? ''}</p>
			{#if currentUser?.user_metadata?.email_verified}
				<span
					class="inline-flex items-center gap-1 rounded-full border border-green-800 bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800"
				>
					✓ Verified
				</span>
			{:else}
				<span
					class="inline-flex items-center gap-1 rounded-full border border-yellow-700 bg-yellow-100 px-2 py-0.5 text-[11px] font-bold text-yellow-800"
				>
					⚠ Not verified
				</span>
			{/if}
		</div>
	</div>

	<!-- ── Tabs ── -->
	<div class="flex shrink-0 border-b-2 border-black bg-white">
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
	<div class="flex-1 overflow-y-auto bg-white px-6 py-5">
		<!-- PROFILE TAB -->
		{#if activeTab === 'profile'}
			<div class="space-y-3">
				<p class="text-xxs font-bold tracking-widest text-gray-400 uppercase">Identity</p>

				<div
					class="doodle-border flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
				>
					<span class="w-28 shrink-0 text-xs font-bold text-gray-500">Display name</span>
					<span class="text-right text-sm font-bold text-black"
						>{currentUser?.user_metadata?.display_name ?? '—'}</span
					>
				</div>

				<div
					class="doodle-border flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
				>
					<span class="w-28 shrink-0 text-xs font-bold text-gray-500">Email</span>
					<span class="max-w-50 truncate text-right text-sm font-bold text-black"
						>{currentUser?.email ?? '—'}</span
					>
				</div>

				<div
					class="doodle-border flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
				>
					<span class="w-28 shrink-0 text-xs font-bold text-gray-500">Verification</span>
					{#if currentUser?.user_metadata?.email_verified}
						<span class="text-sm font-bold text-green-700">Verified ✓</span>
					{:else}
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold text-yellow-700">Not verified</span>
							{#if verificationSent}
								<span class="text-xs font-bold text-green-700">Email sent!</span>
							{:else}
								<button
									class="rounded-md border-2 border-black bg-white px-2 py-0.5 text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
									onclick={sendVerificationEmail}
									disabled={sendingVerification}
								>
									{sendingVerification ? 'Sending...' : 'Send link'}
								</button>
							{/if}
						</div>
					{/if}
				</div>

				<p class="text-xxs pt-2 font-bold tracking-widest text-gray-400 uppercase">Timestamps</p>

				<div
					class="doodle-border flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
				>
					<span class="w-28 shrink-0 text-xs font-bold text-gray-500">Member since</span>
					<span class="text-sm font-bold text-black">{formatDate(currentUser?.created_at)}</span>
				</div>

				<div
					class="doodle-border flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
				>
					<span class="w-28 shrink-0 text-xs font-bold text-gray-500">Last updated</span>
					<span class="text-sm font-bold text-black">{formatDate(currentUser?.updated_at)}</span>
				</div>
			</div>

			<!-- ACCOUNT TAB -->
		{:else if activeTab === 'account'}
			<div class="space-y-3">
				<p class="text-xxs font-bold tracking-widest text-gray-400 uppercase">Security</p>

				<div class="doodle-border rounded-lg bg-gray-50 px-4 py-4">
					<p class="mb-1 text-sm font-bold text-black">Change password</p>
					<p class="mb-3 text-xs text-gray-500">
						We'll send a reset link to <span class="font-bold text-black">{currentUser?.email}</span
						>.
					</p>
					{#if resetSent}
						<p class="text-sm font-bold text-green-700">✓ Reset email sent! Check your inbox.</p>
					{:else}
						<button
							class="rounded-lg border-2 border-black bg-white px-4 py-2 font-patrick-hand text-sm font-bold transition-colors hover:bg-gray-100 disabled:opacity-50"
							onclick={sendPasswordReset}
							disabled={sendingReset}
						>
							{sendingReset ? 'Sending...' : '🔑 Send reset link'}
						</button>
					{/if}
				</div>

				<!-- <p class="text-xxs pt-2 font-bold tracking-widest text-gray-400 uppercase">Sync</p> -->

				<p class="text-xxs pt-2 font-bold tracking-widest text-gray-400 uppercase">
					Storage <span class="font-normal tracking-normal text-gray-300 normal-case"
						>(coming soon)</span
					>
				</p>

				<div class="doodle-border pointer-events-none rounded-lg bg-gray-50 px-4 py-3 opacity-50">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-bold text-gray-500">Used storage</span>
						<span class="text-sm font-bold text-black">— / 500 MB</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full border border-gray-400 bg-gray-200">
						<div class="h-full rounded-full bg-[#f5a623]" style="width: 0%"></div>
					</div>
					<p class="mt-1 text-[11px] text-gray-400">Free tier · Upgrade for 5 GB Pro</p>
				</div>

				<p class="text-xxs pt-2 font-bold tracking-widest text-gray-400 uppercase">Session</p>

				<button
					class="w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-left font-patrick-hand text-sm font-bold text-red-600 transition-colors hover:border-red-500 hover:bg-red-50"
					onclick={HandleLogout}
				>
					🚪 Log out of DoneJar
				</button>
			</div>

			<!-- DANGER TAB -->
		{:else if activeTab === 'danger'}
			<div class="space-y-3">
				<div class="doodle-border rounded-lg border-red-400 bg-red-50 px-4 py-4">
					<p class="mb-1 text-sm font-bold text-red-800">⚠️ Danger zone</p>
					<p class="text-xs text-red-600">These actions are permanent and cannot be undone.</p>
				</div>

				<div class="doodle-border rounded-lg bg-gray-50 px-4 py-4">
					<p class="mb-1 text-sm font-bold text-black">Export all data</p>
					<p class="mb-3 text-xs text-gray-500">
						Download a full backup of all your notes, projects, and attachments.
					</p>
					<button
						class="rounded-lg border-2 border-black bg-white px-4 py-2 font-patrick-hand text-sm font-bold transition-colors hover:bg-gray-100"
						onclick={exportRedirect}
					>
						🍰 Go to Export
					</button>
				</div>

				<div class="doodle-border pointer-events-none rounded-lg bg-gray-50 px-4 py-4 opacity-50">
					<p class="mb-1 text-sm font-bold text-black">
						Delete account <span class="text-xs font-normal text-gray-400">(coming soon)</span>
					</p>
					<p class="mb-3 text-xs text-gray-500">
						Permanently delete your account and all associated data from our servers.
					</p>
					<button
						class="rounded-lg border-2 border-red-400 bg-white px-4 py-2 font-patrick-hand text-sm font-bold text-red-500 transition-colors"
						disabled
					>
						🗑 Delete my account
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- ── Footer ── -->
	<div
		class="flex shrink-0 items-center justify-between border-t-2 border-dashed border-gray-300 bg-white px-6 py-3"
	>
		<span class="font-mono text-[11px] text-gray-300 select-all" title="Your user ID"
			>{currentUser?.id ?? ''}</span
		>
		<button
			class="text-xs font-bold text-gray-400 transition-colors hover:text-black"
			onclick={close}
		>
			Close ✕
		</button>
	</div>
</ThemedDialog>
