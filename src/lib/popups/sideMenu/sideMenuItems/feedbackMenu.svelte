<script lang="ts">
	import { feedbackStore } from '$lib/stores/dialog';
	import { sessionStore } from '$lib/stores/currentUser.svelte';
	import { supabase } from '$lib/sb/sb';
	import { notify } from '$lib/stores/notificationStore';
	import { success, failure } from '$lib/types';
	import { Dialog } from 'bits-ui';

	let type: 'bug' | 'suggestion' | 'other' = 'bug';
	let message = '';
	let submitting = false;

	const placeholders: Record<'bug' | 'suggestion' | 'other', string> = {
		bug: 'What happened? What did you expect instead?',
		suggestion: "What's the idea? What problem would it solve?",
		other: "What's on your mind?"
	};

	async function submitFeedback() {
		if (!message.trim() || submitting) return;
		submitting = true;

		const { error } = await supabase.from('feedback').insert({
			user_id: sessionStore?.current?.user.id ?? null,
			type,
			message: message.trim(),
			user_agent: navigator.userAgent
		});

		submitting = false;

		if (error) {
			notify(failure(error.message || 'Failed to submit feedback'));
			return;
		}

		notify(success('Thanks! We got it.'));
		message = '';
		type = 'bug';
		feedbackStore.close();
	}
</script>

<Dialog.Root
	open={feedbackStore.isOpen}
	onOpenChange={(o) => {
		if (!o) feedbackStore.close();
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9998 bg-black/50 backdrop-blur-[1px]">
			<Dialog.Content class="feedback-content">
				<Dialog.Title class="feedback-title">Feedback</Dialog.Title>

				<div class="type-select" role="radiogroup" aria-label="Feedback type">
					<button
						type="button"
						class="type-btn"
						class:selected={type === 'bug'}
						aria-pressed={type === 'bug'}
						onclick={() => (type = 'bug')}
					>
						🐛 Bug
					</button>
					<button
						type="button"
						class="type-btn"
						class:selected={type === 'suggestion'}
						aria-pressed={type === 'suggestion'}
						onclick={() => (type = 'suggestion')}
					>
						💡 Suggestion
					</button>
					<button
						type="button"
						class="type-btn"
						class:selected={type === 'other'}
						aria-pressed={type === 'other'}
						onclick={() => (type = 'other')}
					>
						💬 Other
					</button>
				</div>

				<textarea
					class="feedback-textarea"
					bind:value={message}
					placeholder={placeholders[type]}
					maxlength="5000"
					rows="5"
				></textarea>

				<div class="feedback-actions">
					<button type="button" class="btn btn-cancel" onclick={() => feedbackStore.close()}>
						Cancel
					</button>
					<button
						type="button"
						class="btn btn-submit"
						onclick={submitFeedback}
						disabled={!message.trim() || submitting}
					>
						{submitting ? 'Sending…' : 'Send Feedback'}
					</button>
				</div>
			</Dialog.Content>
		</Dialog.Overlay>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.feedback-content) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 9998;
		width: min(90vw, 460px);
		background: #f4efe6;
		border: 2.5px solid #1a1a1a;
		border-radius: 20px;
		padding: 24px 24px 20px;
		box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.15);
		font-family: 'Patrick Hand';
	}

	:global(.feedback-title) {
		font-size: 26px;
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 16px;
	}

	.type-select {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
	}

	.type-btn {
		flex: 1;
		font-family: inherit;
		font-size: 18px;
		font-weight: 700;
		color: #1a1a1a;
		background: #fff;
		border: 2px solid #1a1a1a;
		border-radius: 14px;
		padding: 8px 6px;
		cursor: pointer;
		transition:
			background 0.12s ease,
			transform 0.05s ease;
	}

	.type-btn:hover {
		background: #f0ead6;
	}

	.type-btn:active {
		transform: scale(0.97);
	}

	.type-btn.selected {
		background: #ffd166;
		box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
	}

	.feedback-textarea {
		width: 100%;
		box-sizing: border-box;
		font-family: inherit;
		font-size: 18px;
		color: #1a1a1a;
		background: #fff;
		border: 2px solid #1a1a1a;
		border-radius: 14px;
		padding: 12px 14px;
		resize: vertical;
		min-height: 110px;
		margin-bottom: 20px;
	}

	.feedback-textarea::placeholder {
		color: #8a8577;
	}

	.feedback-textarea:focus {
		outline: none;
		box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.2);
	}

	.feedback-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.btn {
		font-family: inherit;
		font-size: 18px;
		font-weight: 700;
		border: 2.5px solid #1a1a1a;
		border-radius: 999px;
		padding: 10px 24px;
		cursor: pointer;
		transition: transform 0.05s ease;
	}

	.btn:active {
		transform: scale(0.97);
	}

	.btn-cancel {
		background: #fff;
		color: #1a1a1a;
	}

	.btn-cancel:hover {
		background: #f0ead6;
	}

	.btn-submit {
		background: #4ade80;
		color: #0d3b1e;
	}

	.btn-submit:hover:not(:disabled) {
		background: #3fd374;
	}

	.btn-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
