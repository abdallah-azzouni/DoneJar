<script lang="ts">
	import type QuillType from 'quill';
	import { onMount } from 'svelte';
	import { notify } from '$lib/stores/notificationStore';

	let editor: HTMLElement;
	let { description = $bindable() }: { description: string | undefined } = $props();

	let toolbarOptions = [
		[{ header: 1 }, { header: 2 }, { align: [] }, 'blockquote', 'code', 'link'],
		['bold', 'italic', 'underline', 'strike'],
		[{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
		['video', 'clean']
	];

	onMount(async () => {
		const { default: Quill } = await import('quill');
		await import('quill/dist/quill.snow.css');
		if (!editor) return;

		var formats = [
			'background',
			'bold',
			'color',
			'font',
			'code',
			'italic',
			'link',
			'size',
			'strike',
			'script',
			'underline',
			'blockquote',
			'header',
			'indent',
			'list',
			'align',
			'direction',
			'code-block',
			'formula',
			'video'
			// 'image' excluded intentionally
		];
		const quill: QuillType = new Quill(editor, {
			modules: {
				toolbar: toolbarOptions
			},
			theme: 'snow',
			placeholder: 'Write something...',
			formats: formats
		});

		// Notify when image insertion is blocked
		const notifyBlocked = () => {
			notify({ type: 'error', message: 'Images not supported' });
		};

		// 1. Detect images via Paste
		quill.root.addEventListener('paste', (e: ClipboardEvent) => {
			const hasImage = Array.from(e.clipboardData?.items || []).some((item) =>
				item.type.includes('image')
			);

			if (hasImage) notifyBlocked();
		});

		// 2. Detect images via Drag & Drop
		quill.root.addEventListener('drop', (e: DragEvent) => {
			const hasImage = Array.from(e.dataTransfer?.files || []).some((file) =>
				file.type.includes('image')
			);

			if (hasImage) notifyBlocked();
		});

		quill.setContents(description ? JSON.parse(description) : { ops: [] });
		description = JSON.stringify(quill.getContents());

		quill.on('text-change', () => {
			description = JSON.stringify(quill.getContents());
		});
	});
</script>

<div class="editor-wrapper doodle-border w-full overflow-hidden">
	<div bind:this={editor}></div>
</div>

<style>
	.editor-wrapper {
		display: flex;
		flex-direction: column;
		max-height: 72%;
		min-height: 0; /* Important for flex child behavior */
	}

	.editor-wrapper :global(.ql-toolbar.ql-snow) {
		border: none;
		border-bottom: 1px solid #ccc;
		flex-shrink: 0; /* Prevents the toolbar from disappearing/squishing */
	}

	.editor-wrapper :global(.ql-container.ql-snow) {
		border: none;
		flex-grow: 1; /* Tells the container to take up all remaining space */
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.editor-wrapper :global(.ql-editor) {
		flex-grow: 1; /* Tells the typing area to fill the container */
		overflow-y: auto;
		font-size: large;
		word-break: break-word;
		padding: 1rem;
	}
</style>
