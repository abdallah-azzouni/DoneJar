<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { notify } from '$lib/stores/notificationStore';
	import { failure, type ActionResult } from '$lib/types';
	import { projectMembersStore } from '$lib/stores/projectMembers.svelte';
	import {
		projectInvitesStore,
		type ProjectInvite,
		handleRealtimePayload as handleRealtimePayloadInvites
	} from '$lib/stores/projectInvites.svelte';
	import { closeProjectMembers, projectMembersMenuStore, confirmMenu } from '$lib/stores/dialog';
	import { supabase } from '$lib/sb/sb';
	import { sessionStore } from '$lib/stores/currentUser.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
	import { untrack } from 'svelte';
	import { dev } from '$app/environment';
	import { type ProjectMemberDocType } from '$lib/db/schemas';

	let currentUser = $derived(sessionStore.current?.user);

	type Member = {
		userId: string;
		display_name: string;
		email: string;
		role: string;
	};

	type MemberData = { id: string; display_name: string; email: string };

	let project = $derived(projectMembersMenuStore.data);
	let isOpen = $derived(projectMembersMenuStore.isOpen);

	let activeTab = $state<'members' | 'invites'>('members');
	let showHistory = $state(false);

	const projectMembersRoles = $derived(
		projectMembersStore.getMembersForProject(project?.id || '').filter((m) => m.role !== 'deleted')
	);

	let projectMembersData = $state<MemberData[]>([]);

	const memberDataMap = $derived(new Map(projectMembersData.map((data) => [data.id, data])));
	let members = $derived<Member[]>(
		projectMembersRoles.map((member) => {
			const memberData = memberDataMap.get(member.userId);
			return {
				userId: member.userId,
				display_name: memberData?.display_name || 'Unknown',
				email: memberData?.email || 'Unknown',
				role: member.role
			};
		})
	);
	let currentUserRole = $derived(
		projectMembersStore.getMemberRole(project?.id || '', currentUser?.id || '')
	);

	let updatingUserIds = new SvelteSet<string>();
	async function onRoleChanges(
		userId: string,
		newRole: string,
		currentRole?: string
	): Promise<ActionResult> {
		if (!project?.id || !currentRole || newRole === currentRole) {
			return { type: 'info', message: 'Role unchanged' };
		}
		if (updatingUserIds.has(userId)) {
			return { type: 'info', message: 'Role update already in progress' };
		}
		updatingUserIds.add(userId);
		try {
			// We are using supabase directly because changes to project_members are meaningful for the online state only.
			// Also routing through the local repository can be messy or not stable due to RxDB replication nature.
			// We can use local repository for reading because RxDB handle realtime updates.
			const { data, error } = await supabase
				.from('project_members')
				.update({ role: newRole })
				.eq('projectId', project.id)
				.eq('userId', userId);

			if (error) {
				return failure(error.message);
			} else {
				return { type: 'success', message: 'Role updated successfully' };
			}
		} catch (err) {
			return failure(`Failed to update role: ${err}`);
		} finally {
			updatingUserIds.delete(userId);
		}
	}

	async function handleKicking(userId: string, currentRole?: string): Promise<ActionResult> {
		return await onRoleChanges(userId, 'deleted', currentRole);
	}

	// Reset state when the dialog is closed
	$effect(() => {
		if (!isOpen) {
			updatingUserIds.clear();
			cancellingInviteIds.clear();
			projectMembersData = [];
			activeTab = 'members';
			showHistory = false;
			newMemberEmail = '';
			newMemberRole = 'editor';
		}
	});

	$effect(() => {
		if (isOpen && projectMembersRoles.length > 0) {
			untrack(() => fetchMembersData());
		}
	});

	let fetchingMembers = $state(false);
	async function fetchMembersData() {
		if (fetchingMembers) return;

		const userIds = projectMembersRoles
			.map((m: ProjectMemberDocType) => m.userId)
			.filter((id: string) => !memberDataMap.has(id));

		if (userIds.length === 0) return;

		fetchingMembers = true;

		try {
			const { data, error } = await supabase
				.from('profiles_public')
				.select('id, display_name, email')
				.in('id', userIds);

			if (error) {
				notify(failure(error.message));
			} else {
				projectMembersData = [...projectMembersData, ...(data as MemberData[])];
			}
		} catch (err) {
			notify(failure(`Failed to fetch member data: ${err}`));
		} finally {
			fetchingMembers = false;
		}
	}

	let invites = $derived(projectInvitesStore.getProjectInvites(project?.id || ''));
	let pendingInvites = $derived(invites.filter((inv) => inv.status === 'pending'));
	let resolvedInvites = $derived(invites.filter((inv) => inv.status !== 'pending'));

	let cancellingInviteIds = new SvelteSet<string>();
	async function handleCancelInvite(inviteId: string) {
		cancellingInviteIds.add(inviteId);

		const { error } = await supabase
			.from('project_invites')
			.update({ status: 'cancelled' })
			.eq('id', inviteId);

		if (error) {
			notify(failure(error.message));
		} else {
			notify({ type: 'success', message: 'Invite cancelled' });
		}
		cancellingInviteIds.delete(inviteId);
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		return emailRegex.test(email);
	}

	function getInitial(name: string): string {
		return name ? name.charAt(0).toUpperCase() : '?';
	}

	let newMemberEmail = $state('');
	let newMemberRole = $state<'editor' | 'viewer' | 'owner'>('editor');
	let isSubmittingInvite = $state(false);

	async function handleAddMember() {
		if (!newMemberEmail.trim() || !isValidEmail(newMemberEmail.trim())) {
			notify(failure('Please enter a valid email address.'));
			return;
		}
		if (!project?.id || !currentUser?.id) {
			notify(failure('Project or user information is missing.'));
			return;
		}

		isSubmittingInvite = true;

		try {
			const { error } = await supabase.from('project_invites').insert({
				projectId: project.id,
				invitedBy: currentUser.id,
				targetEmail: newMemberEmail.trim().toLowerCase(),
				role: newMemberRole
			});

			if (error) {
				notify(failure(error.message));
			} else {
				notify({ type: 'success', message: 'Invite sent successfully!' });
				newMemberEmail = '';
			}
		} catch (err) {
			notify(failure(`Failed to send invite: ${err}`));
		} finally {
			isSubmittingInvite = false;
		}
	}

	async function handleLeaveProject() {
		if (!project?.id || !currentUser?.id) {
			notify(failure('Project or user information is missing.'));
			return;
		}

		if (
			currentUserRole === 'owner' &&
			!members.some((m) => m.role === 'owner' && m.userId !== currentUser?.id)
		) {
			await confirmMenu({
				title: 'Cannot Leave Project',
				body: 'You are the only owner of this project. Consider assigning another owner or deleting the project if its no longer needed.',
				actionLabel: 'Exit',
				actionColor: 'info'
			});
			return;
		}

		const result = await confirmMenu({
			title: 'Leave Project?',
			body: 'Are you sure you want to leave this project? You will lose access to it. The project and its data will remain available for other members.',
			actionLabel: 'Leave Project',
			actionColor: 'danger'
		});

		if (!result) {
			return;
		}

		try {
			const { error } = await supabase
				.from('project_members')
				.update({ role: 'deleted' })
				.eq('projectId', project.id)
				.eq('userId', currentUser.id);

			if (error) {
				notify(failure(error.message));
			} else {
				notify({ type: 'success', message: 'You have left the project.' });
				closeProjectMembers();
			}
		} catch (err) {
			notify(failure(`Failed to leave project: ${err}`));
		}
	}

	// On-Demand Realtime Channel for active project invites and members

	$effect(() => {
		if (!isOpen || !project?.id) return;

		if (!projectInvitesStore.loadProjectInvitesReady) {
			projectInvitesStore.loadProjectInvites(project.id).then((result) => {
				if (result.type === 'error' || dev) notify(result);
			});
		}
	});

	$effect(() => {
		if (!isOpen || !project?.id || !projectInvitesStore.loadProjectInvitesReady) {
			return;
		}

		const projectId = project.id;

		const channel_invites = supabase
			.channel(`modal-project-invites-${projectId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'project_invites',
					filter: `projectId=eq.${projectId}`
				},
				(payload) =>
					handleRealtimePayloadInvites(payload as RealtimePostgresChangesPayload<ProjectInvite>)
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel_invites);
		};
	});
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(o) => {
		if (!o) closeProjectMembers();
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9998 bg-black/50 backdrop-blur-[1px]" />
		<Dialog.Content
			interactOutsideBehavior="ignore"
			class="fixed top-[10vh] left-1/2 z-9998 mx-auto h-[80vh] w-11/12 max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border-2 border-black bg-[#FDFBF7] p-2 shadow-lg"
		>
			<div class="flex h-full min-h-0 flex-col p-4">
				<!-- Header -->
				<div class="mb-3 shrink-0 text-center">
					<h1
						class="font-patrick-hand text-3xl font-extrabold tracking-wide text-gray-900 uppercase"
					>
						Project Members
					</h1>
					<p class="font-patrick-hand text-xs text-gray-600">Manage team access and invitations</p>
				</div>

				<!-- Navigation -->
				<div class="mb-4 flex shrink-0 items-end justify-between border-b-2 border-black/10 pb-2">
					<!-- Tabs -->
					<div class="flex">
						<button
							type="button"
							onclick={() => (activeTab = 'members')}
							class="border-b-4 px-4 py-1.5 font-patrick-hand text-lg font-bold transition-all {activeTab ===
							'members'
								? 'border-black text-black'
								: 'border-transparent text-gray-400 hover:text-gray-700'}"
						>
							Active Members ({members.length})
						</button>

						<button
							type="button"
							onclick={() => (activeTab = 'invites')}
							class="border-b-4 px-4 py-1.5 font-patrick-hand text-lg font-bold transition-all {activeTab ===
							'invites'
								? 'border-black text-black'
								: 'border-transparent text-gray-400 hover:text-gray-700'}"
						>
							Invites ({pendingInvites.length})
						</button>
					</div>

					<!-- Danger Action -->

					<button
						type="button"
						class="pb-2 text-sm font-bold text-red-600 hover:text-red-700 hover:underline"
						onclick={async () => await handleLeaveProject()}
					>
						Leave Project
					</button>
				</div>

				<!-- Content Area -->
				<div class="flex-1 overflow-y-auto pr-1">
					{#if activeTab === 'members'}
						<!-- MEMBERS TAB -->
						<div class=" space-y-2.5">
							{#each members as member (member.userId)}
								{@const isUpdating = updatingUserIds.has(member.userId)}
								{@const isSelf = member.userId === currentUser?.id}
								{@const isCurrentUserOwner = currentUserRole === 'owner'}
								{@const canManageMember = !isSelf && isCurrentUserOwner}
								{@const isDisabled = isUpdating || !canManageMember}
								{@const memberUserId = member.userId}
								{@const memberDisplayName = member.display_name}
								{@const memberRole = member.role}
								<div
									class="relative flex flex-col items-start justify-between gap-4 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-center"
								>
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<div
											class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-amber-200 font-patrick-hand text-lg font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]"
										>
											{getInitial(memberDisplayName)}
										</div>
										<div class="flex flex-col truncate">
											<span class="truncate font-bold text-gray-900"
												>{memberDisplayName}{memberUserId === currentUser?.id
													? ' (You)'
													: ''}{memberRole === 'owner' ? ' (Owner)' : ''}</span
											>
											<span class="truncate text-xs text-gray-500">{member.email}</span>
										</div>
									</div>

									<div class="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
										<select
											class="rounded-lg border-2 border-black bg-[#FDFBF7] px-3 py-1 font-patrick-hand text-base font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:outline-none disabled:pointer-events-none disabled:appearance-none"
											value={memberRole}
											disabled={isDisabled}
											onchange={async (e) => {
												const selectEl = e.currentTarget;
												const newRole = selectEl.value;

												const targetUserId = memberUserId;
												const currentRole = memberRole;
												const targetName = memberDisplayName;

												selectEl.value = currentRole;
												const result = await confirmMenu({
													title: 'Change Role?',
													body: `Are you sure you want to change "${targetName}"'s role to "${newRole}"?`,
													actionLabel: 'Change Role',
													actionColor: 'primary'
												});
												if (result && isOpen) {
													const res = await onRoleChanges(targetUserId, newRole, currentRole);
													notify(res);
												}
											}}
										>
											<option value="owner">Owner</option>
											<option value="editor">Editor</option>
											<option value="viewer">Viewer</option>
										</select>
										<button
											type="button"
											class="rounded-lg border-2 border-black bg-red-400 px-3 py-1 font-patrick-hand font-bold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-red-500 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
											disabled={isUpdating}
											hidden={!canManageMember}
											onclick={async () => {
												const targetUserId = memberUserId;
												const targetName = memberDisplayName;
												const currentRole = memberRole;

												const result = await confirmMenu({
													title: 'Kick Member?',
													body: `Are you sure you want to kick "${targetName}" from the project? This action cannot be undone.`,
													actionLabel: 'Kick',
													actionColor: 'danger'
												});

												if (result && isOpen) {
													const res = await handleKicking(targetUserId, currentRole);
													notify(res);
												}
											}}
										>
											Kick
										</button>
									</div>
									<!-- Overlay on Update -->
									<div
										class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/50 transition-opacity duration-200 {isUpdating
											? 'opacity-100'
											: 'pointer-events-none opacity-0'}"
									>
										<!-- Accent Badge -->
										<div
											class="flex items-center gap-2.5 rounded-xl border-2 border-black bg-[#00e575] px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
										>
											<!-- Spinner -->
											<div
												class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
											></div>

											<span class="font-patrick-hand text-sm font-bold text-black">Updating...</span
											>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						{@const isInvitesReady = projectInvitesStore.loadProjectInvitesReady}
						{#if isInvitesReady}
							<!-- INVITES TAB -->
							<div class="space-y-4">
								<!-- Send Invite Form -->
								<div
									class="rounded-xl border-2 border-black bg-amber-50 p-3 shadow-[3px_3px_0px_rgba(0,0,0,1)]"
								>
									<span class="mb-2 block font-patrick-hand text-sm font-bold text-gray-800"
										>Send New Invitation</span
									>
									<form
										onsubmit={(e) => {
											e.preventDefault();
											handleAddMember();
										}}
									>
										<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
											<input
												type="email"
												placeholder="Enter user email..."
												disabled={isSubmittingInvite}
												bind:value={newMemberEmail}
												required
												class="flex-1 rounded-lg border-2 border-black bg-white px-3 py-1.5 font-patrick-hand text-base shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:outline-none disabled:opacity-60"
											/>
											<select
												bind:value={newMemberRole}
												disabled={isSubmittingInvite}
												class="rounded-lg border-2 border-black bg-white px-3 py-1.5 font-patrick-hand text-base font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:outline-none disabled:opacity-60"
											>
												<option value="owner">Owner</option>
												<option value="editor">Editor</option>
												<option value="viewer">Viewer</option>
											</select>
											<button
												disabled={isSubmittingInvite}
												class="rounded-lg border-2 border-black bg-green-400 px-4 py-1.5 font-patrick-hand font-bold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-green-500 active:translate-y-0.5 disabled:opacity-50"
											>
												{isSubmittingInvite ? 'Sending...' : 'Send Invite'}
											</button>
										</div>
									</form>
								</div>

								<!-- Pending Invites List -->
								<div>
									<h3 class="mb-2 font-patrick-hand text-base font-bold text-gray-800">
										Pending Invites ({pendingInvites.length})
									</h3>
									{#if pendingInvites.length === 0}
										<p class="font-patrick-hand text-sm text-gray-400 italic">
											No pending invitations.
										</p>
									{:else}
										<div class="space-y-2">
											{#each pendingInvites as invite (invite.id)}
												{@const isCancelling = cancellingInviteIds.has(invite.id)}
												<div
													class="flex flex-col items-start justify-between gap-3 rounded-xl border-2 border-dashed border-black/60 bg-amber-50/50 p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] sm:flex-row sm:items-center"
												>
													<div class="flex min-w-0 flex-1 items-center gap-3">
														<div
															class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black/60 bg-purple-200 text-xs shadow-[1px_1px_0px_rgba(0,0,0,0.5)]"
														>
															✉️
														</div>
														<div class="flex flex-col truncate">
															<span
																class="truncate font-patrick-hand text-base font-bold text-gray-900"
																>{invite.targetEmail}</span
															>
															<span class="text-xs text-gray-500">
																Role: <strong class="capitalize">{invite.role}</strong>
																{#if invite.inviterEmail}
																	• Sent by: <strong>{invite.inviterEmail}</strong>
																{/if}
															</span>
														</div>
													</div>
													<button
														type="button"
														disabled={isCancelling}
														onclick={() => handleCancelInvite(invite.id)}
														class="rounded-lg border-2 border-black bg-gray-200 px-3 py-1 font-patrick-hand font-bold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-red-300 active:translate-y-0.5 disabled:opacity-50"
													>
														{isCancelling ? 'Revoking...' : 'Revoke'}
													</button>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Collapsible Invite History -->
								{#if resolvedInvites.length > 0}
									<div class="border-t border-black/10 pt-3">
										<button
											type="button"
											onclick={() => (showHistory = !showHistory)}
											class="flex items-center gap-1 font-patrick-hand text-sm font-bold text-gray-600 hover:text-black"
										>
											{showHistory ? '▼ Hide' : '▶ Show'} History ({resolvedInvites.length})
										</button>

										{#if showHistory}
											<div class="mt-2 space-y-2">
												{#each resolvedInvites as invite (invite.id)}
													<div
														class="flex items-center justify-between rounded-xl border border-dashed border-black/40 bg-gray-100/50 p-2.5"
													>
														<div class="flex flex-col truncate">
															<span class="truncate text-sm font-bold text-gray-700"
																>{invite.targetEmail}</span
															>
															<span class="text-xs text-gray-500">
																Role: {invite.role}
																{#if invite.inviterEmail}
																	• Sent by: {invite.inviterEmail}{/if}
															</span>
														</div>
														<span
															class="rounded bg-gray-200 px-2 py-0.5 font-patrick-hand text-xs font-bold text-gray-700 uppercase"
														>
															{invite.status}
														</span>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}
							</div>
						{:else}
							<!-- Loading State -->
							<div class="flex h-full items-center justify-center">
								<div
									class="flex items-center gap-2 rounded-xl border-2 border-black bg-[#FDFBF7] px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
								>
									<div
										class="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"
									></div>
									<span class="font-patrick-hand text-sm font-bold text-black"
										>Loading invites...</span
									>
								</div>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Footer -->
				<div
					class="mt-2 flex shrink-0 items-center justify-between border-t-2 border-black/10 pt-3"
				>
					<span class="text-xs text-gray-500">⚠️ Changes save automatically</span>
					<button
						class="rounded-xl border-2 border-black px-5 py-1.5 font-patrick-hand text-base font-bold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0"
						type="button"
						onclick={() => closeProjectMembers()}
					>
						Exit
					</button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
