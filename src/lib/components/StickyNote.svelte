<script lang="ts">
	import { textColorFromHex, formatDueDate, isDueDatePast } from '$lib/UiHelper';
	import { now } from '$lib/stores/timer';
	import NoteMenu from '$lib/popups/noteMenu/NoteMenu.svelte';
	import type { NoteDocType } from '$lib/db/schemas';
	import { togglePinNote } from '$lib/actions';
	import { notify } from '$lib/stores/notificationStore';
	import {
		draggable,
		dropTargetForElements
	} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
	import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

	// Track the bindable hover property
	let {
		note,
		hoveredNoteId = $bindable(null)
	}: { note: NoteDocType; hoveredNoteId: string | null } = $props();
	let showNoteMenu = $state(false);

	let infoColor = $derived(
		note.priority === 'high'
			? '#dc2626'
			: note.priority === 'medium'
				? '#eab308'
				: note.priority === 'low'
					? '#3b82f6'
					: '#ffffff'
	);

	let isPast = $derived(
		note.dueDateTimestamp ? isDueDatePast(note.dueDateTimestamp, note.dueDateHasTime, $now) : false
	);

	async function handlePinNote() {
		const result = await togglePinNote(note.id);
		if (result.type === 'error') {
			notify(result);
		}
	}

	let size = 'w-full';
	let isDragging = $state(false);

	// Derived state: Is this exact card the one being hovered over during a drag?
	let isTargeted = $derived(hoveredNoteId === note.id);

	function dndCardGridAction(node: HTMLElement) {
		const cleanup = combine(
			draggable({
				element: node,
				getInitialData: () => ({ noteId: note.id, columnId: note.columnId }),
				onDragStart: () => (isDragging = true),
				onDrop: () => (isDragging = false)
			}),
			dropTargetForElements({
				element: node,
				getIsSticky: () => true,
				canDrop: ({ source }) => !!source.data.noteId && source.data.noteId !== note.id,
				getData: () => ({ noteId: note.id, columnId: note.columnId }),
				onDragEnter: () => (hoveredNoteId = note.id),
				onDragLeave: () => {
					if (hoveredNoteId === note.id) hoveredNoteId = null;
				},
				onDrop: () => {
					if (hoveredNoteId === note.id) hoveredNoteId = null;
				}
			})
		);
		return {
			destroy: cleanup
		};
	}
</script>

<div class="inline-flex items-center">
	<div
		use:dndCardGridAction
		class=" group relative cursor-grab transition-all duration-200 ease-out select-none
               {isDragging ? ' pointer-events-none scale-95 opacity-30 grayscale' : ''}"
	>
		<button
			class="absolute top-3 right-3 z-50 hidden size-7 rounded-full border border-black group-hover:block {note.pinned
				? 'block! bg-gray-300'
				: 'bg-white'} hover:bg-amber-200"
			onclick={(e) => {
				e.stopPropagation();
				handlePinNote();
			}}>📌</button
		>
		<button
			onclick={(e) => {
				e.stopPropagation();
				showNoteMenu = true;
			}}
			onmousedown={(e) => e.stopPropagation()}
			onpointerdown={(e) => e.stopPropagation()}
			aria-label="Open {note.title} menu"
		>
			<svg
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 232.3369863033555 229.1499924333649"
				class={`${size}`}
				style="color: {note.color};"
				><g stroke-linecap="round"
					><g
						transform="translate(10.940321639857189 10.130474605378026) rotate(0 105.22817151182062 104.44452161130431)"
						fill-rule="evenodd"
						><path
							d="M-1.4 -1.99 L209.61 1.52 L210.43 175.47 L174.86 208.69 L1.22 209.41 L-1.32 0.19"
							stroke="none"
							stroke-width="0"
							fill="currentColor"
							fill-rule="evenodd"
						></path><path
							d="M0 0 C76.62 0.25, 158.01 -0.82, 207.62 0.73 M0 0 C42.31 1.3, 86.63 1.32, 207.62 0.73 M207.62 0.73 C207.27 53.03, 210.2 104.7, 211.39 174.34 M207.62 0.73 C209.46 68.81, 211.51 136.44, 211.39 174.34 M211.39 174.34 C197.81 183.75, 187.37 196.49, 176.66 207.17 M211.39 174.34 C200.09 184.95, 188.5 196.04, 176.66 207.17 M176.66 207.17 C106.96 208.66, 39.53 209.59, 2.26 208.63 M176.66 207.17 C130.51 206.9, 83.82 208.05, 2.26 208.63 M2.26 208.63 C-0.69 160.96, -1.96 109.34, 0 0 M2.26 208.63 C1.41 154.69, 1.95 102.93, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0"
							stroke="#000000"
							stroke-width="1"
							fill="none"
						></path></g
					></g
				><g stroke-linecap="round"
					><g
						transform="translate(222.0018002271903 185.19153759500898) rotate(0 -18.055555555555657 14.166666666666288)"
						fill-rule="evenodd"
						><path
							d="M0.39 -0.49 L-32.96 -5.9 L-36.48 32.88 L-0.06 0.65"
							stroke="none"
							stroke-width="0"
							fill={infoColor}
							fill-rule="evenodd"
						></path><path
							d="M0 0 C-8.74 -2.43, -19.81 -3.57, -33.89 -5 M0 0 C-9.28 -0.86, -19.12 -3.03, -33.89 -5 M-33.89 -5 C-33.6 3.3, -33.96 11.62, -36.11 33.33 M-33.89 -5 C-33.87 2.87, -34.56 10.52, -36.11 33.33 M-36.11 33.33 C-26.78 24.92, -17.35 17.11, 0 0 M-36.11 33.33 C-23.97 22.06, -10.59 10.2, 0 0 M0 0 C0 0, 0 0, 0 0 M0 0 C0 0, 0 0, 0 0"
							stroke="#343a40"
							stroke-width="1"
							fill="none"
						></path></g
					></g
				>
				<foreignObject x="20" y="20" width="200" height="160">
					<span
						xmlns="http://www.w3.org/1999/xhtml"
						class="line-clamp-4 text-4xl font-bold"
						style="color: {textColorFromHex(note.color)}; overflow-wrap: break-word;"
						>{note.title}</span
					>
				</foreignObject>
				{#if note.dueDateTimestamp}
					<foreignObject x="20" y="20" width="170" height="190">
						<div class="flex h-full items-end justify-start" xmlns="http://www.w3.org/1999/xhtml">
							<span
								class="line-clamp-1 font-patrick-hand text-2xl decoration-2"
								style="color: {textColorFromHex(
									note.color
								)}; line-height:1; text-decoration-line: {isPast
									? 'line-through'
									: 'none'}; text-decoration-color: {textColorFromHex(note.color)};"
							>
								{formatDueDate(note.dueDateTimestamp, note.dueDateHasTime)}
							</span>
						</div>
					</foreignObject>
				{/if}</svg
			>
		</button>
	</div>
	{#key showNoteMenu}
		<NoteMenu bind:isOpen={showNoteMenu} {note} />
	{/key}

	{#if isTargeted}
		<div
			class="mx-3 animate-pulse rounded-xl border-4 border-dashed border-sky-400 bg-sky-400/10 transition-all duration-150 {size}"
		></div>
	{/if}
</div>
