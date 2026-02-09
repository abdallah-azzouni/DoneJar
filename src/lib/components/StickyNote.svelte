<script lang="ts">
	import type { Note, Project } from '$lib/stores/userData';
	import { textColorFromHex } from '$lib/UiHelper';
	import NoteMenu from '$lib/popups/NoteMenu.svelte';

	let { note, dragDisabled = $bindable(false) }: { note: Note; dragDisabled: boolean } = $props();
	let showNoteMenu = $state(false);

	$effect(() => {
		dragDisabled = showNoteMenu; // Disable dragging when menu is open
	});

	let size = 'size-40';
</script>

<div data-id={note.id} class="inline-block">
	<NoteMenu bind:isOpen={showNoteMenu} {note} />
	<button onclick={() => (showNoteMenu = true)}>
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
						fill="white"
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
					class="line-clamp-4 text-4xl font-bold"
					style="color: {textColorFromHex(note.color)}; overflow-wrap: break-word;"
					>{note.title}</span
				>
			</foreignObject></svg
		>
	</button>
</div>
