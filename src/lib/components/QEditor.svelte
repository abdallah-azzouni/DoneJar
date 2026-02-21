<script lang="ts">
	import { type Delta } from 'quill';
	import { onMount } from 'svelte';

	let editor: HTMLElement;

	let { description = $bindable() }: { description: Delta | string } = $props();

	// add align text and video options to the toolbar
	let toolbarOptions = [
		[{ header: 1 }, { header: 2 }, { align: [] }, 'blockquote', 'code', 'link', 'video'],
		['bold', 'italic', 'underline', 'strike'],
		[{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
		['clean']
	];

	onMount(async () => {
		const { default: Quill } = await import('quill');
		await import('quill/dist/quill.snow.css');

		if (!editor) return; // Prevent invalid container

		let quill = new Quill(editor, {
			modules: { toolbar: toolbarOptions },
			theme: 'snow',
			placeholder: 'Write something...'
		});

		// Support legacy plain text descriptions by converting string to Delta
		if (typeof description === 'string' && description.length > 0) {
			quill.setText(description);
			description = quill.getContents();
		} else if (description && typeof description === 'object') {
			quill.setContents(description);
		}

		quill.on('text-change', () => {
			description = quill.getContents();
		});
	});
</script>

<div class="editor-wrapper doodle-border w-full overflow-hidden">
	<div bind:this={editor}></div>
</div>

<style>
	/* Remove Quill's default borders so only doodle-border shows */
	.editor-wrapper :global(.ql-toolbar.ql-snow) {
		border: none;
		border-bottom: 1px solid #ccc;
	}

	.editor-wrapper :global(.ql-container.ql-snow) {
		border: none;
		height: auto;
	}

	.editor-wrapper :global(.ql-editor) {
		height: 40vh;
		width: 70vh;
		overflow-y: auto;
		font-size: large;
	}
</style>
