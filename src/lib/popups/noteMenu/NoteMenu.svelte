<script lang="ts">
	import { createNote, editNote, saveNoteAttachments } from '$lib/actions';
	import { attachmentRepository, columnRepository } from '$lib/db/dal';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import DatePicker from './DatePicker.svelte';
	import QEditor from '$lib/components/QEditor.svelte';
	import { formatDueDate, isDueDatePast } from '$lib/UiHelper';
	import { notify } from '$lib/stores/notificationStore';
	import { emptyNote, failure } from '$lib/types';
	import type { NoteDocType, AttachmentDocType } from '$lib/db/schemas/index';
	import { MAX_NOTE_TITLE_LENGTH, DEFAULT_NOTE_COLOR, DEFAULT_MENU_COLORS } from '$lib/constants';
	import { confirmDelete } from '$lib/stores/dialog';
	import { projectStore } from '$lib/stores/projects.svelte';
	import { untrack } from 'svelte';
	import { nanoid } from 'nanoid';
	import { onMount, onDestroy } from 'svelte';
	import { textColorFromHex } from '$lib/UiHelper';
	import { SvelteMap } from 'svelte/reactivity';
	import { MAX_NOTE_ATTACHMENTS_SIZE } from '$lib/constants';

	// ─── Props ───────────────────────────────────────
	let { isOpen = $bindable(false), note }: { isOpen: boolean; note: NoteDocType | null } = $props();

	// ─── Working Note State ───────────────────────────
	let workingNote = $state(
		untrack(() => {
			if (note) return { ...note };
			let newNote: NoteDocType = emptyNote;
			newNote.color = DEFAULT_NOTE_COLOR;

			return newNote;
		})
	);

	// noteId is stable per dialog open because parent uses {#key} to remount this component
	const noteId = workingNote.id || nanoid();

	let showDatePicker = $state(false);

	// ─── Handlers ────────────────────────────────────
	async function handleSubmit() {
		const action = workingNote.id === '' ? createNote : editNote;
		workingNote.id = noteId;

		let col = workingNote.columnId ? await columnRepository.get(workingNote.columnId) : undefined;
		if (workingNote.columnId === '' || col?.projectId !== noteProjectId) {
			col = await columnRepository.findInboxColumn(noteProjectId);
			workingNote.columnId = col?.id || '';
		}

		if (Array.isArray(workingNote.tags)) {
			workingNote.tags = workingNote.tags.length > 0 ? JSON.stringify(workingNote.tags) : '';
		}
		const plain = $state.snapshot(workingNote) as unknown as NoteDocType; // snapshot to unwarp any proxies made by $state
		const result = await action(plain);

		if (result.type === 'error') {
			notify(result);
			return;
		}

		const plainAttachments = $state.snapshot(attachments) as unknown as AttachmentDocType[]; // snapshot to unwarp any proxies made by $state
		const newAttachments = plainAttachments.filter((a) => !a.createdAt); // only save new attachments.
		const attachmentResults = await saveNoteAttachments(
			noteId,
			newAttachments,
			deletedAttachmentIds,
			blobs
		); // create after note has been created.

		if (attachmentResults.type === 'error') {
			notify(attachmentResults);
			return;
		}

		isOpen = false;
	}

	function handleCancel() {
		isOpen = false;
	}

	// ─── Tags ────────────────────────────────────────
	let showTags = $state(false);
	let tagInputText = $state(''); // Track the input value

	function addTag() {
		const val = tagInputText.trim().toLowerCase();
		if (val && !workingNote.tags?.includes(val)) {
			workingNote.tags = JSON.stringify([...JSON.parse(workingNote.tags || '[]'), val]);
			tagInputText = ''; // Clear input
			showTags = true; // Ensure menu is open to show the new tag
		}
	}

	let attachments = $state([] as AttachmentDocType[]);
	let blobs = $state(new Map<string, Blob>());
	const deletedAttachmentIds = [] as string[];

	let noteProjectId: string = $state('');
	onMount(async () => {
		const items = await attachmentRepository.getManyByNoteId(workingNote.id);

		// load attachments in cache
		for (const item of items) {
			if (!item.doc) continue; // skip if doc is missing for some reason
			attachments.push(item.doc);

			if (item.blob) {
				blobs.set(item.doc.id, item.blob);
				blobUrlCache.set(item.doc.id, URL.createObjectURL(item.blob));
			} // if no local blob, getPreviewUrl will fallback to the server URL.
		}

		noteProjectId = projectStore.current?.id || '';
	});

	let fileInput: HTMLInputElement;

	// ─── Attachments ─────────────────────────────────
	function handleAddAttachment() {
		fileInput.click();
	}

	function handlePinAttachment(attachmentId: string) {
		const target = attachments.find((a) => a.id === attachmentId);
		if (!target) return;

		const toggled = { ...target, pinned: !target.pinned };
		const rest = attachments.filter((a) => a.id !== attachmentId);

		if (toggled.pinned) {
			attachments = [toggled, ...rest];
		} else {
			attachments = [...rest, toggled];
		}
	}

	function getTotalAttachmentsSize() {
		return attachments.reduce((sum, a) => sum + a.size, 0);
	}

	function handleFileSelected(event: Event) {
		const files = (event.target as HTMLInputElement).files;
		if (!files) return;

		for (const file of files) {
			if (getTotalAttachmentsSize() + file.size > MAX_NOTE_ATTACHMENTS_SIZE) {
				notify(
					failure(
						`Adding ${file.name} would exceed the ${MAX_NOTE_ATTACHMENTS_SIZE / (1024 * 1024)}MB total limit`
					)
				);
				break;
			}

			const id = nanoid();
			const newAttachment: AttachmentDocType = {
				id: id,
				noteId,
				filename: file.name,
				mimeType: file.type,
				size: file.size,
				url: undefined,
				createdAt: '',
				updatedAt: '',
				pinned: false
			};

			blobs.set(id, file);
			addAttachment(newAttachment);
		}

		// Reset so the same files can be re-selected if needed
		(event.target as HTMLInputElement).value = '';
	}

	const blobUrlCache = new SvelteMap<string, string>();

	function addAttachment(attachment: AttachmentDocType) {
		const blob = blobs.get(attachment.id);
		if (!blob) {
			notify(
				failure(`Attachment ${attachment.filename} is missing its file data and cannot be added.`)
			);
			return;
		}
		if (blob && !blobUrlCache.has(attachment.id)) {
			blobUrlCache.set(attachment.id, URL.createObjectURL(blob));
		}
		attachments = [...attachments, attachment];
	}

	function getPreviewUrl(attachment: AttachmentDocType): string | undefined {
		return blobUrlCache.get(attachment.id) ?? attachment.url;
	}

	function handleDeleteAttachment(attachmentId: string) {
		const url = blobUrlCache.get(attachmentId);
		if (url) {
			URL.revokeObjectURL(url); // Clean up blob URL
			blobUrlCache.delete(attachmentId);
		}
		deletedAttachmentIds.push(attachmentId); // track attachments to delete
		attachments = attachments.filter((a) => a.id !== attachmentId); // Update local state to remove the attachment
	}

	onDestroy(() => {
		// Clean up any remaining blob URLs when the component is destroyed
		for (const url of blobUrlCache.values()) {
			URL.revokeObjectURL(url);
		}
		blobUrlCache.clear();
	});

	function formatSize(bytes: number): string {
		if (bytes === 0) return '0 MB';
		const mb = bytes / (1024 * 1024);
		// Use .toFixed(1) for "1.5 MB" or .toFixed(2) for "1.45 MB"
		return mb < 0.1 ? '< 0.1 MB' : `${mb.toFixed(1)} MB`;
	}
</script>

<DatePicker
	bind:isOpen={showDatePicker}
	initialDate={workingNote.dueDateTimestamp
		? {
				timestamp: workingNote.dueDateTimestamp,
				hasTime: workingNote.dueDateHasTime ?? false
			}
		: undefined}
	onSave={(date) => {
		workingNote.dueDateTimestamp = date?.timestamp;
		workingNote.dueDateHasTime = date?.hasTime;
	}}
/>
<ThemedDialog bind:isOpen w="w-5/6" h="h-5/6">
	<div class="flex h-full flex-row">
		<form class="flex min-h-0 flex-1 flex-col space-y-2 pr-2" onsubmit={handleSubmit}>
			<input
				type="text"
				class="doodle-border w-full text-2xl font-bold outline-none"
				placeholder="Note title..."
				maxlength={MAX_NOTE_TITLE_LENGTH}
				bind:value={workingNote.title}
				required
			/>
			<hr class=" border border-gray-500" />

			<div class="overflow-y-auto">
				<QEditor bind:description={workingNote.description} />
				<div class="mt-4 flex min-h-0 flex-1 flex-col">
					<!-- Header Divider -->
					<div class="flex w-full items-center gap-3 opacity-60">
						<div class="flex-1 border-t-2 border-dashed border-gray-400"></div>
						<span class="text-xs font-bold tracking-widest text-gray-500 uppercase"
							>Attachments</span
						>
						<!-- The "Add" Action -->
						<input
							bind:this={fileInput}
							type="file"
							multiple
							class="hidden"
							onchange={handleFileSelected}
						/>
						<button
							type="button"
							title="Add file or image"
							class="flex size-7 items-center justify-center rounded-full border-2 border-black bg-amber-400 text-xl font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:bg-amber-300 active:translate-y-px active:shadow-none"
							onclick={handleAddAttachment}
						>
							+
						</button>
						<div class="flex-1 border-t-2 border-dashed border-gray-400"></div>
					</div>

					<div class=" gap-2 py-4 pr-2">
						<!-- BIG PREVIEW: Image/Screenshot -->
						<div class="flex w-full flex-wrap gap-3">
							{#each attachments.filter( (a) => a.mimeType.startsWith('image/') ) as attachment (attachment.id)}
								<div class="group relative mt-2 self-start">
									<!-- Washi Tape Effect -->
									<div
										class="absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 rotate-2 border border-blue-300 bg-blue-200/50 opacity-80 shadow-sm"
									></div>

									<div
										class="doodle-border flex w-64 flex-col overflow-hidden bg-white p-2 transition-transform hover:rotate-1"
									>
										<div
											class="aspect-video w-full overflow-hidden border border-gray-200 bg-gray-100"
										>
											<img
												src={getPreviewUrl(attachment)}
												alt="Preview"
												class="h-full w-full object-contain"
											/>
											<!-- File Size Badge -->
											<span
												class="text-xxs absolute top-1 right-1 rounded bg-black/70 px-1 py-0.5 font-bold text-white"
											>
												{formatSize(attachment.size)}
											</span>
										</div>
										<div class="mt-2 flex items-center justify-between">
											<span class="truncate text-xs font-bold italic">{attachment.filename}</span>
											<div class="flex gap-1">
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														handlePinAttachment(attachment.id);
													}}
													class="size-6 rounded border border-black {attachment.pinned
														? 'bg-amber-400'
														: 'bg-white'} text-xs hover:bg-amber-200">📌</button
												>
												<button
													type="button"
													class="size-6 rounded border border-black bg-white text-xs hover:bg-red-200"
													onclick={(e) => {
														e.stopPropagation();
														handleDeleteAttachment(attachment.id);
													}}>x</button
												>
											</div>
										</div>
									</div>
								</div>
							{:else}
								<span class="text-center text-sm italic text-gray-400">No image attachments...</span
								>
							{/each}
						</div>
						<div class="mt-4 border-t-2 border-dashed border-gray-300 pt-4">
							<!-- LIST ROW: Standard File -->
							{#each attachments.filter((a) => !a.mimeType.startsWith('image/')) as attachment (attachment.id)}
								<div class="doodle-border flex items-center gap-3 bg-white p-2 hover:bg-gray-50">
									<span class="text-2xl">📄</span>
									<div class="flex flex-1 flex-col">
										<span class="text-sm leading-tight font-bold">{attachment.filename}</span>
										<span class="text-xxs font-black text-gray-500 uppercase"
											>{formatSize(attachment.size)}</span
										>
									</div>
									<button
										type="button"
										class="size-8 rounded-full border border-black {attachment.pinned
											? 'bg-amber-400'
											: 'bg-white'} hover:bg-amber-200"
										onclick={(e) => {
											e.stopPropagation();
											handlePinAttachment(attachment.id);
										}}
										title="Pin attachment">📌</button
									>
									<button
										type="button"
										class="size-8 rounded-full border border-black bg-white hover:bg-red-200"
										onclick={(e) => {
											e.stopPropagation(); // Prevent triggering parent click events
											handleDeleteAttachment(attachment.id);
										}}
										title="Delete">x</button
									>
								</div>
							{:else}
								<span class="text-center text-sm italic text-gray-400">No file attachments...</span>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="mx-2 mt-auto flex justify-end gap-3 border-t-2 border-gray-200 pt-4">
				<button
					class="rounded-2xl border-2 border-black px-6 py-2 font-bold transition-transform active:translate-y-1"
					type="button"
					onclick={handleCancel}
				>
					Cancel
				</button>
				<button
					class="rounded-2xl border-2 border-black bg-green-400 px-8 py-2 font-bold shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
					type="submit"
				>
					Save Note
				</button>
			</div>
		</form>
		<div class="flex w-60 flex-col gap-1 border-l-2 border-gray-500 pl-4 font-patrick-hand text-xl">
			<div class="overflow-x-hidden overflow-y-auto">
				<div>
					<span class="mb-1 block">Project</span>
					<div class="relative">
						<span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">📁</span>
						<select
							bind:value={noteProjectId}
							class="doodle-border w-full cursor-pointer bg-transparent py-2 pr-4 pl-10"
						>
							{#each projectStore.projects as project (project.id)}
								<option value={project.id}>{project.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div>
					<span class="mb-1 block">Color</span>
					<div class="flex flex-wrap gap-1">
						{#each DEFAULT_MENU_COLORS as paletteColor (paletteColor)}
							<button
								type="button"
								class="size-10 rounded-xl border-2 border-black transition-all"
								style:background-color={paletteColor}
								class:border-4={workingNote.color === paletteColor}
								onclick={() => (workingNote.color = paletteColor)}
								title="Select color {paletteColor}"
							>
							</button>
						{/each}

						<label
							class="relative flex size-10 transform cursor-pointer items-center justify-center rounded-full border-2 border-black transition-all hover:scale-110 active:scale-100"
							style:background-color={workingNote.color}
							class:border-4={!DEFAULT_MENU_COLORS.includes(workingNote.color)}
						>
							<span class="text-m font-bold" style:color={textColorFromHex(workingNote.color)}
								>+</span
							>
							<input
								type="color"
								bind:value={workingNote.color}
								class="absolute inset-0 cursor-pointer opacity-0"
							/>
						</label>
					</div>
				</div>

				<div>
					<span class="mb-1 block">Due Date</span>
					<button
						class="doodle-border flex w-full items-center justify-center gap-2 py-2"
						onclick={() => (showDatePicker = true)}
					>
						{#if workingNote.dueDateTimestamp}
							<span
								class={isDueDatePast(
									workingNote.dueDateTimestamp,
									workingNote.dueDateHasTime,
									new Date()
								)
									? 'text-red-500'
									: ''}
							>
								{formatDueDate(workingNote.dueDateTimestamp, workingNote.dueDateHasTime)}
							</span>
						{:else}
							<span class="text-gray-400">Set Date...</span>
						{/if}
					</button>
				</div>
				<div>
					<span class="mb-1 block">Priority</span>
					<div class="flex w-full items-center gap-2 font-patrick-hand text-2xl">
						<button
							class="doodle-border flex-1 {workingNote.priority === 'low'
								? 'bg-blue-100 text-blue-800'
								: ''}"
							onclick={() => {
								workingNote.priority = workingNote.priority === 'low' ? undefined : 'low';
							}}>Low</button
						>
						<button
							class=" doodle-border flex-1 {workingNote.priority === 'medium'
								? 'bg-amber-100 text-amber-800'
								: ''}"
							onclick={() => {
								workingNote.priority = workingNote.priority === 'medium' ? undefined : 'medium';
							}}>Medium</button
						>
						<button
							class=" doodle-border flex-1 {workingNote.priority === 'high'
								? 'bg-red-100 text-red-800'
								: ''}"
							onclick={() => {
								workingNote.priority = workingNote.priority === 'high' ? undefined : 'high';
							}}>High</button
						>
					</div>
				</div>
				<div class="relative">
					<span class="mb-1 flex items-center gap-2">
						Tags
						{#if workingNote.tags != null && workingNote.tags.length > 0}
							<span
								class="rounded-full bg-black px-1.5 py-1 text-xs leading-none font-bold text-white"
							>
								{JSON.parse(workingNote.tags || '[]').length}
							</span>
						{/if}
						<button
							type="button"
							class="ml-auto text-sm opacity-50 transition-transform hover:opacity-100"
							class:rotate-180={showTags}
							onclick={() => (showTags = !showTags)}
						>
							▼
						</button>
					</span>

					<!-- Input Area -->
					<div
						class="doodle-border flex items-center bg-white/50 p-1 pl-2 transition-colors focus-within:bg-white"
					>
						<input
							type="text"
							placeholder="Add tag..."
							class="w-full bg-transparent font-patrick-hand text-lg outline-none"
							bind:value={tagInputText}
							onfocus={() => (showTags = true)}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									addTag();
								}
								if (e.key === 'Escape') showTags = false;
							}}
						/>
						<!-- The Plus Button -->
						<button
							type="button"
							title="Add file or image"
							class="flex size-7 items-center justify-center rounded-full border-2 border-black bg-amber-400 text-xl font-bold opacity-75 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:bg-amber-300 active:translate-y-px active:shadow-none"
							onclick={addTag}
						>
							+
						</button>
					</div>

					<!-- Dropdown Menu -->
					{#if showTags}
						<button
							type="button"
							aria-label="Close tags dropdown"
							class="fixed inset-0 z-10 cursor-default"
							onclick={() => (showTags = false)}
						>
						</button>

						<div
							class="doodle-border absolute right-0 bottom-[calc(100%+6px)] left-0 z-20 flex max-h-48 flex-col gap-2 overflow-y-auto bg-white p-3"
						>
							{#if (workingNote.tags || []).length === 0}
								<span class="text-center text-sm text-gray-400 italic">No tags yet...</span>
							{:else}
								<div class="flex flex-wrap gap-2">
									{#each JSON.parse(workingNote.tags || '[]') as tag (tag)}
										<span
											class="flex items-center gap-1 rounded border border-black bg-gray-50 px-2 py-0.5 text-sm shadow-[1px_1px_0px_rgba(0,0,0,1)]"
										>
											#{tag}
											<button
												type="button"
												class="font-bold hover:text-red-500"
												onclick={() =>
													(workingNote.tags = JSON.stringify([
														...JSON.parse(workingNote.tags || '[]').filter((t: string) => t !== tag)
													]))}
											>
												×
											</button>
										</span>
									{/each}
								</div>
							{/if}
							<button
								type="button"
								class="mt-1 w-full border-t border-dashed border-gray-300 pt-2 text-center text-xs font-bold tracking-widest text-gray-500 uppercase hover:text-black"
								onclick={() => (showTags = false)}
							>
								Close Menu
							</button>
						</div>
					{/if}
				</div>
			</div>
			<div class="mt-auto flex justify-end gap-3 border-t-2 border-gray-200 pt-2">
				<button
					class="mt-auto ml-auto size-fit rounded-2xl bg-red-700 px-5 py-3 font-bold text-white"
					class:hidden={workingNote.id === ''}
					onclick={() => {
						isOpen = false;
						confirmDelete({
							type: 'notes',
							id: workingNote.id,
							name: workingNote.title
						});
					}}>Delete</button
				>
			</div>
		</div>
	</div>
</ThemedDialog>
