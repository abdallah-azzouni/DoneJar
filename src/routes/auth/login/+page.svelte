<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { signIn, signUp, sendPasswordResetEmail } from '$lib/sb/auth';
	import { clearDatabase } from '$lib/db/dal';
	import { goLocalMode, getIsGuestLocal } from '$lib/stores/appState.svelte';
	import { notify } from '$lib/stores/notificationStore';
	import { failure } from '$lib/types';
	import { fade, fly } from 'svelte/transition';
	import { Dialog } from 'bits-ui';

	let isLogin = $state(true);
	let email = $state('');
	let password = $state('');
	let name = $state('');

	let hasExistingProjects = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (isLogin) {
			hasExistingProjects = getIsGuestLocal();

			if (!hasExistingProjects) {
				await continueOnline();
			}
		} else {
			const result = await signUp(email, name, password);
			if (result.error) {
				notify(failure(result.error.message));
				return;
			} else {
				if (!result.data?.user?.identities?.length) {
					notify({ type: 'error', message: 'Email already exists. Please sign in.' });
					return;
				}
				notify({ type: 'success', message: 'Account created! Please sign in.' });
			}
			password = '';
			name = '';
			isLogin = true;
		}
	}

	async function handleForgotPassword() {
		if (!email) {
			notify(failure('Enter your email address first.'));
			return;
		}
		try {
			const result = await sendPasswordResetEmail(email);
			if (result.error) {
				notify(failure(result.error?.message ?? 'Failed to send reset email.'));
				return;
			}
			notify({ type: 'success', message: 'Password reset email sent.' });
		} catch {
			notify(failure('Something went wrong. Please try again.'));
		}
	}

	function toggleMode() {
		isLogin = !isLogin;
		password = '';
	}

	function continueLocal() {
		goLocalMode();
		goto(resolve('/app'));
	}

	async function continueOnline() {
		try {
			const result = await signIn(email, password);
			if (result?.error) {
				notify(failure(result.error.message));
				return;
			}

			goto(resolve('/app'));
		} catch {
			notify(failure('Something went wrong. Please try again.'));
		}
	}

	async function deleteAndContinue() {
		try {
			await clearDatabase();
			await continueOnline();
		} catch {
			notify(failure('Something went wrong. Please try again.'));
		}
	}
</script>

<Dialog.Root open={hasExistingProjects}>
	<Dialog.Overlay class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
	<Dialog.Content class="justify-self-center dark:bg-zinc-900">
		<p class="text-sm text-zinc-600 dark:text-zinc-400">
			You have existing projects. Do you want to import them to your new account or delete them and
			start fresh?
		</p>
		<div class="mt-4 flex justify-end gap-2">
			<button
				onclick={async () => {
					await deleteAndContinue();
				}}
				class="rounded-lg border border-black/10 px-3 py-1 text-sm text-zinc-500 transition hover:bg-stone-50 dark:border-white/8 dark:text-zinc-400 dark:hover:bg-zinc-800"
			>
				Start fresh
			</button>
			<button
				onclick={async () => {
					await continueOnline();
				}}
				class="rounded-lg bg-zinc-900 px-3 py-1 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
			>
				Import projects
			</button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<div class="flex min-h-svh items-center justify-center bg-stone-100 px-4 py-12 dark:bg-zinc-950">
	<div
		class="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 dark:border-white/8 dark:bg-zinc-900"
	>
		<!-- Wordmark -->
		<div class="mb-8 flex items-center gap-2.5">
			<svg
				class="size-8 shrink-0 text-zinc-900 dark:text-zinc-100"
				viewBox="0 0 36 36"
				fill="none"
				aria-hidden="true"
			>
				<rect x="9" y="13" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.5" />
				<path
					d="M13 13V10C13 9.45 13.45 9 14 9H22C22.55 9 23 9.45 23 10V13"
					stroke="currentColor"
					stroke-width="1.5"
				/>
				<path d="M13 9H23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				<circle cx="18" cy="21" r="4" fill="#E9A83A" opacity="0.9" />
				<path
					d="M16 21L17.5 22.5L20.5 19.5"
					stroke="white"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
				>DoneJar</span
			>
		</div>

		<!-- Heading -->
		<h1 class="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
			{isLogin ? 'Sign in' : 'Create account'}
		</h1>
		<p class="mt-1 mb-7 text-sm text-zinc-500 dark:text-zinc-400">
			{isLogin
				? 'Welcome back! Please enter your details to continue.'
				: 'Get started with DoneJar today.'}
		</p>

		<!-- Form -->
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			{#if !isLogin}
				<div
					in:fly={{ y: -8, duration: 180 }}
					out:fade={{ duration: 100 }}
					class="flex flex-col gap-1.5"
				>
					<label
						for="name"
						class="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">Name</label
					>
					<input
						id="name"
						type="text"
						required
						bind:value={name}
						placeholder="Your name"
						autocomplete="name"
						class="h-11 w-full rounded-lg border border-black/12 bg-stone-50 px-3 text-sm text-zinc-900 placeholder-zinc-300 transition outline-none focus:border-black/30 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-white/25 dark:focus:bg-zinc-800"
					/>
				</div>
			{/if}

			<div class="flex flex-col gap-1.5">
				<label for="email" class="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase"
					>Email</label
				>
				<input
					id="email"
					type="email"
					required
					bind:value={email}
					placeholder="you@example.com"
					autocomplete="email"
					class="h-11 w-full rounded-lg border border-black/12 bg-stone-50 px-3 text-sm text-zinc-900 placeholder-zinc-300 transition outline-none focus:border-black/30 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-white/25 dark:focus:bg-zinc-800"
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between">
					<label
						for="password"
						class="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase"
						>Password</label
					>
					{#if isLogin}
						<button
							type="button"
							onclick={handleForgotPassword}
							class="text-xs text-zinc-400 underline decoration-zinc-200 underline-offset-2 transition hover:text-zinc-700 dark:decoration-zinc-700 dark:hover:text-zinc-200"
						>
							Forgot password?
						</button>
					{/if}
				</div>
				<input
					id="password"
					type="password"
					required
					minlength="8"
					bind:value={password}
					placeholder="••••••••"
					autocomplete={isLogin ? 'current-password' : 'new-password'}
					class="h-11 w-full rounded-lg border border-black/12 bg-stone-50 px-3 text-sm text-zinc-900 placeholder-zinc-300 transition outline-none focus:border-black/30 focus:bg-white focus:ring-2 focus:ring-amber-400/20 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-600 dark:focus:border-white/25 dark:focus:bg-zinc-800"
				/>
			</div>

			<button
				type="submit"
				class="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
			>
				<span>{isLogin ? 'Continue' : 'Create account'}</span>
				<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
					<path
						d="M2 7.5h11M9 3.5l4 4-4 4"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</form>

		<!-- Divider -->
		<div class="my-5 flex items-center gap-3">
			<div class="h-px flex-1 bg-black/8 dark:bg-white/8"></div>
			<span class="text-xs text-zinc-400">or</span>
			<div class="h-px flex-1 bg-black/8 dark:bg-white/8"></div>
		</div>

		<!-- Continue local -->
		<button
			type="button"
			onclick={continueLocal}
			class="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/10 text-sm text-zinc-500 transition hover:bg-stone-50 hover:text-zinc-800 dark:border-white/8 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
		>
			<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
				<rect
					x="1"
					y="2"
					width="13"
					height="9"
					rx="1.5"
					stroke="currentColor"
					stroke-width="1.25"
				/>
				<path
					d="M4.5 13h6M7.5 11v2"
					stroke="currentColor"
					stroke-width="1.25"
					stroke-linecap="round"
				/>
			</svg>
			<span>Continue without account</span>
		</button>

		<!-- Toggle -->
		<p class="mt-6 text-center text-[13px] text-zinc-400">
			{isLogin ? 'No account?' : 'Already have one?'}
			<button
				type="button"
				onclick={toggleMode}
				class="ml-1 font-semibold text-zinc-900 underline decoration-amber-400 decoration-2 underline-offset-4 transition hover:text-amber-600 dark:text-zinc-100 dark:hover:text-amber-400"
			>
				{isLogin ? 'Create one free' : 'Sign in'}
			</button>
		</p>
	</div>
</div>
