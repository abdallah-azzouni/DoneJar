<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { notify } from '$lib/stores/notificationStore';
	import { confirmPasswordReset } from '$lib/sb/auth';

	type State = 'idle' | 'loading' | 'success' | 'error';

	let status: State = $state<State>('idle');
	let errorMessage: string = $state('');
	let password: string = $state('');
	let confirm: string = $state('');
	let showPassword: boolean = $state(false);
	let showConfirm: boolean = $state(false);

	// Validation
	const minLength = 8;
	let passwordStrength = $derived.by(() => {
		if (!password) return 0;
		let score = 0;
		if (password.length >= minLength) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[0-9]/.test(password)) score++;
		if (/[^A-Za-z0-9]/.test(password)) score++;
		return score;
	});

	let strengthLabel = $derived(['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]);
	let strengthColor = $derived(['', '#e05252', '#e09a3a', '#6ab04c', '#2ed573'][passwordStrength]);

	let mismatch = $derived(confirm.length > 0 && password !== confirm);
	let canSubmit = $derived(
		password.length >= minLength && password === confirm && status !== 'loading'
	);

	async function handleSubmit() {
		if (!canSubmit) return;
		status = 'loading';
		errorMessage = '';
		try {
			const result = await confirmPasswordReset(password);
			if (result.error) {
				errorMessage = result.error?.message ?? 'Failed to reset password.';
				status = 'error';
				return;
			}
			status = 'success';
			notify({ type: 'success', message: 'Password reset successful. You can now log in.' });
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
			status = 'error';
		}
	}

	function gotoLogin() {
		goto(resolve('/auth/login'));
	}
</script>

<div class="page">
	<div class="card" class:success={status === 'success'}>
		<!-- Lock icon — unlocks on success -->
		<div class="icon-wrap" aria-hidden="true">
			<svg class="lock-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
				{#if status === 'success'}
					<!-- Unlocked shackle -->
					<path
						class="shackle unlocked"
						d="M14 20 L14 14 Q14 6 24 6 Q34 6 34 14"
						stroke="currentColor"
						stroke-width="3.5"
						stroke-linecap="round"
						fill="none"
					/>
				{:else}
					<!-- Locked shackle -->
					<path
						class="shackle"
						d="M14 20 L14 14 Q14 6 24 6 Q34 6 34 14 L34 20"
						stroke="currentColor"
						stroke-width="3.5"
						stroke-linecap="round"
						fill="none"
					/>
				{/if}
				<!-- Body -->
				<rect
					x="9"
					y="20"
					width="30"
					height="22"
					rx="4"
					fill="currentColor"
					opacity="0.15"
					stroke="currentColor"
					stroke-width="3"
				/>
				<!-- Keyhole -->
				<circle cx="24" cy="31" r="3" fill="currentColor" />
				<rect x="22.5" y="31" width="3" height="5" rx="1.5" fill="currentColor" />
			</svg>
			<div class="glow" class:glow-success={status === 'success'}></div>
		</div>

		{#if status === 'success'}
			<!-- ── Success state ─────────────────────────── -->
			<h1 class="heading">You're back in</h1>
			<p class="subtext">Your password has been updated. Head back and log in.</p>
			<button onclick={gotoLogin} class="btn btn-primary">Go to login</button>
		{:else}
			<!-- ── Form state ─────────────────────────────── -->
			<h1 class="heading">New password</h1>
			<p class="subtext">Choose something strong. You won't need to remember it here.</p>

			<div class="fields">
				<!-- Password -->
				<div class="field">
					<label for="password" class="label">Password</label>
					<div class="input-wrap">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							class="input"
							placeholder="Min. 8 characters"
							autocomplete="new-password"
							bind:value={password}
							disabled={status === 'loading'}
						/>
						<button
							type="button"
							class="eye-btn"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<!-- Eye-off -->
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								>
									<path
										d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
									/>
									<path
										d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
									/>
									<line x1="1" y1="1" x2="23" y2="23" />
								</svg>
							{:else}
								<!-- Eye -->
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</div>

					<!-- Strength bar -->
					{#if password.length > 0}
						<div class="strength-wrap">
							<div class="strength-bar">
								{#each { length: 4 } as _, i (i)}
									<div
										class="strength-seg"
										style:background={i + 1 <= passwordStrength
											? strengthColor
											: 'var(--c-divider)'}
									></div>
								{/each}
							</div>
							<span class="strength-label" style:color={strengthColor}>{strengthLabel}</span>
						</div>
					{/if}
				</div>

				<!-- Confirm -->
				<div class="field">
					<label for="confirm" class="label">Confirm password</label>
					<div class="input-wrap">
						<input
							id="confirm"
							type={showConfirm ? 'text' : 'password'}
							class="input"
							class:input-error={mismatch}
							placeholder="Repeat password"
							autocomplete="new-password"
							bind:value={confirm}
							disabled={status === 'loading'}
						/>
						<button
							type="button"
							class="eye-btn"
							onclick={() => (showConfirm = !showConfirm)}
							aria-label={showConfirm ? 'Hide password' : 'Show password'}
						>
							{#if showConfirm}
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								>
									<path
										d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
									/>
									<path
										d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
									/>
									<line x1="1" y1="1" x2="23" y2="23" />
								</svg>
							{:else}
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								>
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</div>
					{#if mismatch}
						<p class="field-error">Passwords don't match</p>
					{/if}
				</div>
			</div>

			<!-- API error -->
			{#if status === 'error'}
				<div class="alert-error" role="alert">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
							x1="12"
							y1="16"
							x2="12.01"
							y2="16"
						/>
					</svg>
					{errorMessage}
				</div>
			{/if}

			<button
				class="btn btn-primary"
				onclick={handleSubmit}
				disabled={!canSubmit}
				aria-busy={status === 'loading'}
			>
				{#if status === 'loading'}
					<span class="spinner" aria-hidden="true"></span>
					Saving…
				{:else}
					Set password
				{/if}
			</button>
		{/if}
	</div>

	<p class="footer-link">
		Remembered it? <button onclick={gotoLogin}>Log in</button>
	</p>
</div>

<style>
	/* ── Tokens ─────────────────────────────────────────── */
	:global(body) {
		margin: 0;
		background: #0f1117;
		font-family: 'Inter', system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	.page {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		background: #0f1117;
		--c-bg-card: #15181f;
		--c-border: rgba(255, 255, 255, 0.07);
		--c-divider: rgba(255, 255, 255, 0.1);
		--c-text: #e8e6e1;
		--c-muted: #7a7f8e;
		--c-input-bg: #1e2130;
		--c-accent: #f5a623;
		--c-accent-hover: #f9bc57;
		--c-error: #e05252;
		--c-success: #2ed573;
	}

	/* ── Card ───────────────────────────────────────────── */
	.card {
		width: 100%;
		max-width: 400px;
		background: var(--c-bg-card);
		border: 1px solid var(--c-border);
		border-radius: 16px;
		padding: 2.5rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		transition: border-color 0.4s ease;
	}

	.card.success {
		border-color: rgba(46, 213, 115, 0.25);
	}

	/* ── Lock icon ──────────────────────────────────────── */
	.icon-wrap {
		position: relative;
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lock-icon {
		width: 44px;
		height: 44px;
		color: var(--c-accent);
		position: relative;
		z-index: 1;
		transition: color 0.5s ease;
	}

	.card.success .lock-icon {
		color: var(--c-success);
	}

	.shackle {
		transition: d 0.4s ease;
	}

	.shackle.unlocked {
		transform-origin: 14px 20px;
	}

	.glow {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(245, 166, 35, 0.18) 0%, transparent 70%);
		transition: background 0.5s ease;
	}

	.glow-success {
		background: radial-gradient(circle, rgba(46, 213, 115, 0.18) 0%, transparent 70%);
	}

	/* ── Typography ─────────────────────────────────────── */
	.heading {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--c-text);
		text-align: center;
	}

	.subtext {
		margin: 0;
		font-size: 0.875rem;
		color: var(--c-muted);
		text-align: center;
		line-height: 1.6;
	}

	/* ── Fields ─────────────────────────────────────────── */
	.fields {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--c-muted);
		letter-spacing: 0.02em;
	}

	.input-wrap {
		position: relative;
	}

	.input {
		width: 100%;
		box-sizing: border-box;
		background: var(--c-input-bg);
		border: 1px solid var(--c-divider);
		border-radius: 8px;
		padding: 0.7rem 2.6rem 0.7rem 0.875rem;
		color: var(--c-text);
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		transition:
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.input:focus {
		border-color: rgba(245, 166, 35, 0.5);
		box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.08);
	}

	.input.input-error {
		border-color: rgba(224, 82, 82, 0.6);
	}

	.input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.input::placeholder {
		color: rgba(122, 127, 142, 0.6);
	}

	.eye-btn {
		position: absolute;
		right: 0.6rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		padding: 0.2rem;
		cursor: pointer;
		color: var(--c-muted);
		display: flex;
		align-items: center;
		transition: color 0.15s ease;
	}

	.eye-btn:hover {
		color: var(--c-text);
	}

	.eye-btn svg {
		width: 18px;
		height: 18px;
	}

	/* ── Strength bar ───────────────────────────────────── */
	.strength-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.strength-bar {
		flex: 1;
		display: flex;
		gap: 3px;
	}

	.strength-seg {
		flex: 1;
		height: 3px;
		border-radius: 2px;
		transition: background 0.3s ease;
	}

	.strength-label {
		font-size: 0.75rem;
		font-weight: 500;
		transition: color 0.3s ease;
		min-width: 36px;
		text-align: right;
	}

	/* ── Field error ────────────────────────────────────── */
	.field-error {
		margin: 0;
		font-size: 0.75rem;
		color: var(--c-error);
	}

	/* ── Alert ──────────────────────────────────────────── */
	.alert-error {
		width: 100%;
		box-sizing: border-box;
		background: rgba(224, 82, 82, 0.08);
		border: 1px solid rgba(224, 82, 82, 0.25);
		border-radius: 8px;
		padding: 0.75rem 1rem;
		color: #e88080;
		font-size: 0.875rem;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		line-height: 1.5;
	}

	.alert-error svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		margin-top: 1px;
	}

	/* ── Button ─────────────────────────────────────────── */
	.btn {
		width: 100%;
		padding: 0.8125rem 1.25rem;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 600;
		font-family: inherit;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition:
			background 0.2s ease,
			opacity 0.2s ease,
			transform 0.1s ease;
		text-decoration: none;
	}

	.btn-primary {
		background: var(--c-accent);
		color: #0f1117;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--c-accent-hover);
		transform: translateY(-1px);
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-primary:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	/* ── Spinner ────────────────────────────────────────── */
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(15, 17, 23, 0.3);
		border-top-color: #0f1117;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── Footer link ────────────────────────────────────── */
	.footer-link {
		margin-top: 1.25rem;
		font-size: 0.875rem;
		color: var(--c-muted);
		text-align: center;
	}

	.footer-link button {
		color: var(--c-accent);
		text-decoration: none;
		font-weight: 500;
	}

	.footer-link button:hover {
		text-decoration: underline;
	}

	/* ── Reduced motion ─────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
			opacity: 0.6;
		}
		.btn,
		.input,
		.lock-icon,
		.glow,
		.strength-seg {
			transition: none;
		}
	}

	/* ── Mobile ─────────────────────────────────────────── */
	@media (max-width: 480px) {
		.card {
			padding: 2rem 1.25rem;
			border-radius: 12px;
		}
	}
</style>
