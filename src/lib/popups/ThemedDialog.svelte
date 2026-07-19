<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		w = 'w-2/3',
		h = 'max-h-3/4',
		mt = 'mt-[5%]',
		cls = 'justify-self-center',
		style = '',
		blur = true,
		pad = 'p-6',
		isOpen = $bindable(false),
		closeOnBackdrop = false,
		cancelable = true,
		dragToClose = false,
		anim = 'none',
		label = 'Dialog',
		onClose,
		children
	}: {
		w?: string;
		h?: string;
		mt?: string;
		cls?: string;
		style?: string;
		blur?: boolean;
		pad?: string;
		isOpen?: boolean;
		closeOnBackdrop?: boolean;
		cancelable?: boolean;
		dragToClose?: boolean;
		anim?: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up';
		label?: string;
		onClose?: () => void;
		children?: Snippet;
	} = $props();

	let dialog: HTMLDialogElement;

	// Drag state
	let dragging = $state(false);
	let dragY = $state(0);
	let isAnimatingClose = $state(false);

	let startY = 0;
	let startX = 0;
	let pointerId: number | null = null;
	let dragStarted = false;

	const DEADZONE = 10; // px of movement before we commit to a drag (vs a tap)
	const CLOSE_FRACTION = 0.3; // fraction of sheet height needed to trigger close

	let backdropOpacity = $derived.by(() => {
		if (!dragging || !dragY) return 1;
		const limit = dialog?.offsetHeight || 400;
		return Math.max(0, 1 - dragY / limit);
	});

	function resetDrag() {
		dragging = false;
		dragStarted = false;
		dragY = 0;
		pointerId = null;
	}

	$effect(() => {
		if (isOpen) {
			isAnimatingClose = false;
			dialog.showModal();
		} else if (dialog.open) {
			dialog.close();
		}
	});

	function closeDialog() {
		isOpen = false;
		onClose?.();
		resetDrag();
	}

	function animateSheetClose() {
		isAnimatingClose = true;
		dragging = false; // stop tracking drag, let CSS take over the slide-out
		setTimeout(() => {
			closeDialog();
			isAnimatingClose = false;
		}, 250);
	}

	function onSheetPointerDown(e: PointerEvent) {
		if (!dragToClose) return;
		const target = e.target as HTMLElement;
		if (target.closest('button, a, input, select, textarea')) return;

		pointerId = e.pointerId;
		startY = e.clientY;
		startX = e.clientX;
		dragStarted = false;
	}

	function onSheetPointerMove(e: PointerEvent) {
		if (!dragToClose || pointerId !== e.pointerId) return;

		const dy = e.clientY - startY;
		const dx = e.clientX - startX;

		if (!dragStarted) {
			// Require clear, deliberate downward movement before committing
			if (dy < DEADZONE || Math.abs(dx) > dy) return;
			dragStarted = true;
			dragging = true;
			dialog.setPointerCapture(e.pointerId);
		}

		dragY = Math.max(0, dy);
		e.preventDefault();
	}

	function onSheetPointerUp(e: PointerEvent) {
		if (!dragToClose || pointerId === null) return;

		if (dragStarted) {
			const sheetHeight = dialog.offsetHeight || 400;
			const closeThreshold = sheetHeight * CLOSE_FRACTION;

			if (dragY > closeThreshold) {
				animateSheetClose();
			} else {
				resetDrag();
			}
		} else {
			resetDrag();
		}

		try {
			dialog.releasePointerCapture(e.pointerId);
		} catch {
			/* pointer capture already released */
		}
	}
</script>

<dialog
	aria-label={label}
	bind:this={dialog}
	data-blur={blur}
	onclose={() => {
		if (!isAnimatingClose) {
			isOpen = false;
			onClose?.();
		}
	}}
	oncancel={(e) => {
		if (!cancelable) e.preventDefault();
	}}
	onclick={(e) => {
		if (closeOnBackdrop && e.target === dialog) {
			if (dragToClose) {
				animateSheetClose();
			} else {
				closeDialog();
			}
		}
	}}
	onpointerdown={onSheetPointerDown}
	onpointermove={onSheetPointerMove}
	onpointerup={onSheetPointerUp}
	onpointercancel={onSheetPointerUp}
	{style}
	class="{mt} {h} {w} {cls} rounded-2xl bg-white {pad} shadow-lg {anim !== 'none'
		? `anim-${anim}`
		: ''} {dragToClose ? 'will-change-transform' : ''}"
	style:transform={dragToClose
		? isAnimatingClose
			? 'translateY(100%)'
			: dragging
				? `translateY(${dragY}px)`
				: undefined
		: undefined}
	style:transition={dragToClose
		? dragging
			? 'none'
			: 'transform 250ms cubic-bezier(0.32, 0.94, 0.6, 1)'
		: undefined}
	style:touch-action={dragToClose ? 'none' : undefined}
	style:--backdrop-opacity={dragToClose ? backdropOpacity : undefined}
>
	<div class="flex h-full flex-col select-none">
		{@render children?.()}
	</div>
</dialog>

<style>
	dialog[class*='anim-'] {
		opacity: 0;
		transition:
			transform 0.25s cubic-bezier(0.32, 0.94, 0.6, 1),
			opacity 0.2s ease-out,
			display 0.25s allow-discrete,
			overlay 0.25s allow-discrete;
	}

	dialog.anim-fade {
		transform: scale(0.95);
	}
	dialog.anim-slide-left {
		transform: translateX(-100px);
	}
	dialog.anim-slide-right {
		transform: translateX(100px);
	}
	dialog.anim-slide-up {
		transform: translateY(50px);
	}

	dialog[open][class*='anim-'] {
		opacity: 1;
		transform: translate(0, 0) scale(1);
	}

	@starting-style {
		dialog[open].anim-fade {
			opacity: 0;
			transform: scale(0.95);
		}
		dialog[open].anim-slide-left {
			opacity: 0;
			transform: translateX(-100px);
		}
		dialog[open].anim-slide-right {
			opacity: 0;
			transform: translateX(100px);
		}
		dialog[open].anim-slide-up {
			opacity: 0;
			transform: translateY(50px);
		}
	}

	dialog::backdrop {
		background-color: rgba(0, 0, 0, 0);
		transition:
			background-color 0.25s ease-out,
			backdrop-filter 0.25s ease-out,
			display 0.25s allow-discrete,
			overlay 0.25s allow-discrete;
	}

	dialog[open]:not([data-blur='false'])::backdrop {
		background-color: rgba(0, 0, 0, calc(0.5 * var(--backdrop-opacity, 1)));
		backdrop-filter: blur(1px);
	}

	@starting-style {
		dialog[open]:not([data-blur='false'])::backdrop {
			background-color: rgba(0, 0, 0, 0);
			backdrop-filter: blur(0px);
		}
	}
</style>
