<script lang="ts">
	import { feedbackStore } from '$lib/stores/dialog';
	import { sessionStore } from '$lib/stores/currentUser.svelte';
	import { supabase } from '$lib/sb/sb';
	import { notify } from '$lib/stores/notificationStore';
	import { success, failure } from '$lib/types';
	import { Dialog } from 'bits-ui';

	type FeedbackType = 'bug' | 'suggestion' | 'other';

	let type: FeedbackType = 'bug';
	let message = '';
	let submitting = false;

	const placeholders: Record<FeedbackType, string> = {
		bug: 'What happened? What did you expect instead?',
		suggestion: "What's the idea? What problem would it solve?",
		other: "What's on your mind?"
	};

	// Full class strings must stay literal so Tailwind can detect them
	const typeBtnBase =
		'flex-1 [font-family:inherit] text-[18px] font-bold border-2 border-[#1a1a1a] rounded-[14px] px-1.5 py-2 cursor-pointer transition-[background-color,transform] duration-[120ms] ease-[ease] active:scale-[0.97]';
	const typeBtnIdle = 'bg-(--color-panel) dark:hover:text-neutral-900 hover:bg-[#f0ead6]';
	const typeBtnSelected = 'bg-[#ffd166] dark:text-neutral-900 shadow-[2px_2px_0_rgba(0,0,0,0.2)]';

	function typeBtnClass(t: FeedbackType) {
		return `${typeBtnBase} ${type === t ? typeBtnSelected : typeBtnIdle}`;
	}

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
			<Dialog.Content
				class="rounded-card-lg fixed top-1/2 left-1/2 z-9998 w-[min(90vw,460px)] -translate-x-1/2 -translate-y-1/2 border-[2.5px] border-[#1a1a1a] px-6 pt-6 pb-5 font-['Patrick_Hand'] text-text-main shadow-[6px_6px_0_rgba(0,0,0,0.15)]"
			>
				<Dialog.Title class="m-0 mb-4 text-[26px] font-bold">Feedback</Dialog.Title>

				<div class="mb-5 flex gap-2" role="radiogroup" aria-label="Feedback type">
					<button
						type="button"
						class={typeBtnClass('bug')}
						aria-pressed={type === 'bug'}
						onclick={() => (type = 'bug')}
					>
						🐛 Bug
					</button>
					<button
						type="button"
						class={typeBtnClass('suggestion')}
						aria-pressed={type === 'suggestion'}
						onclick={() => (type = 'suggestion')}
					>
						💡 Suggestion
					</button>
					<button
						type="button"
						class={typeBtnClass('other')}
						aria-pressed={type === 'other'}
						onclick={() => (type = 'other')}
					>
						💬 Other
					</button>
				</div>

				<textarea
					class="mb-5 box-border min-h-27.5 w-full resize-y rounded-[14px] border-2 border-border-main bg-panel px-3.5 py-3 font-[inherit] text-[18px] focus:shadow-[2px_2px_0_rgba(0,0,0,0.2)] focus:outline-none"
					bind:value={message}
					placeholder={placeholders[type]}
					maxlength="5000"
					rows="5"
				></textarea>

				<div class="flex justify-end gap-3">
					<button
						type="button"
						class="cursor-pointer rounded-full border-[2.5px] border-border-main bg-panel px-6 py-2.5 font-[inherit] text-[18px] font-bold transition-transform duration-50 ease-[ease] hover:bg-[#f0ead6] active:scale-[0.97] dark:hover:text-neutral-900"
						onclick={() => feedbackStore.close()}
					>
						Cancel
					</button>
					<button
						type="button"
						class="cursor-pointer rounded-full border-[2.5px] border-border-main bg-[#4ade80] px-6 py-2.5 font-[inherit] text-[18px] font-bold text-[#0d3b1e] transition-transform duration-50 ease-[ease] active:scale-[0.97] enabled:hover:bg-[#3fd374] disabled:cursor-not-allowed disabled:opacity-50"
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
