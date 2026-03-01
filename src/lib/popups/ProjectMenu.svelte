<script lang="ts">
	import { dataActions } from '$lib/Actions';
	import { type ProjectInterface, type Column } from '$lib/stores/userData';
	import ThemedDialog from '$lib/popups/ThemedDialog.svelte';
	import DeletePConfirmation from './DeletePConfirmation.svelte';

	let {
		isOpen = $bindable(false),
		projectInfo
	}: { isOpen: boolean; projectInfo: ProjectInterface } = $props();

	let newProject = $state(projectInfo);
	let customColumns: Column[] = $state([]);
	let showDeleteProject = $state(false);

	let newColumnName = $state('');

	let inboxIndex: number | null = $state(null);
	let jarIndex: number | null = $state(null);

	$effect(() => {
		if (isOpen) {
			newProject = { ...projectInfo };
			customColumns = [];
			inboxIndex = null;
			jarIndex = null;
			newColumnName = '';
		}
	});

	function buildColumnsWithSpecialTypes(): Column[] {
		return customColumns.map((col, i) => ({
			...col,
			specialType: i === inboxIndex ? 'inbox' : i === jarIndex ? 'jar' : null
		}));
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (newProject.id === '') {
			if (newProject.type === 'custom') {
				if (customColumns.length === 0) {
					alert('Custom projects must have at least 1 column.');
					return;
				}
				const columns = buildColumnsWithSpecialTypes();
				dataActions.createProject(newProject.name, newProject.type, newProject.color, columns);
			} else {
				dataActions.createProject(newProject.name, newProject.type, newProject.color);
			}
		} else {
			dataActions.editProject(newProject);
		}
		isOpen = false;
	}

	function addColumn() {
		const trimmed = newColumnName.trim();
		if (!trimmed) return;

		customColumns = [...customColumns, { name: trimmed, notes: [], specialType: null }];
		newColumnName = '';
	}

	function removeColumn(index: number) {
		customColumns = customColumns.filter((_, i) => i !== index);
		// Adjust radio indices after removal
		if (inboxIndex !== null) {
			if (inboxIndex === index) inboxIndex = null;
			else if (inboxIndex > index) inboxIndex--;
		}
		if (jarIndex !== null) {
			if (jarIndex === index) jarIndex = null;
			else if (jarIndex > index) jarIndex--;
		}
	}

	function toggleRadio(type: 'inbox' | 'jar', index: number) {
		if (type === 'inbox') {
			inboxIndex = inboxIndex === index ? null : index;
			// Prevent same column being both
			if (inboxIndex === jarIndex) jarIndex = null;
		} else {
			jarIndex = jarIndex === index ? null : index;
			if (jarIndex === inboxIndex) inboxIndex = null;
		}
	}
</script>

<DeletePConfirmation
	bind:isOpen={showDeleteProject}
	projectName={newProject.name}
	projectId={newProject.id}
/>
<ThemedDialog bind:isOpen>
	<h1 class="m-4 text-2xl font-bold">
		{#if newProject.id === ''}Create a new{:else}Edit
		{/if} project
	</h1>
	<hr class="border-gray-500" />

	<form class="m-4 mx-16 space-y-4" onsubmit={handleSubmit}>
		<span><b>Name</b></span>
		<div>
			<input
				type="text"
				bind:value={newProject.name}
				class="w-full rounded-md border border-gray-500 p-1.5 focus:outline-none"
				required
				placeholder="Project Name..."
			/>
		</div>
		<span><b>Color</b></span>
		<div>
			<input type="color" bind:value={newProject.color} />
		</div>
		{#if newProject.id === ''}
			<span><b>Type</b></span>
			<div>
				<select
					bind:value={newProject.type}
					class="w-full rounded-md border border-gray-500 p-1.5 focus:outline-none"
				>
					<option value="default">Default (TODO, DOING, DONE)</option>
					<option value="blank">Blank (no default columns)</option>
					<option value="custom">Custom (specify column names)</option>
				</select>
			</div>
		{/if}
		{#if newProject.type === 'custom'}
			{#if customColumns.length > 0}
				<div class="doodle-border overflow-hidden">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-300 bg-gray-50">
								<th class="px-4 py-2 text-left font-patrick-hand text-lg">Name</th>
								<th class="px-4 py-2 text-center font-patrick-hand text-lg">Inbox</th>
								<th class="px-4 py-2 text-center font-patrick-hand text-lg">Jar</th>
								<th class="w-10"></th>
							</tr>
						</thead>
						<tbody>
							{#each customColumns as row, i (i)}
								<tr class="border-b border-gray-200 last:border-b-0">
									<td class="px-4 py-2 font-patrick-hand text-lg">{row.name}</td>
									<td class="px-4 py-2 text-center">
										<input
											type="radio"
											name="inbox"
											checked={inboxIndex === i}
											onclick={() => toggleRadio('inbox', i)}
											class="size-4 cursor-pointer accent-blue-500"
										/>
									</td>
									<td class="px-4 py-2 text-center">
										<input
											type="radio"
											name="jar"
											checked={jarIndex === i}
											onclick={() => toggleRadio('jar', i)}
											class="size-4 cursor-pointer accent-amber-500"
										/>
									</td>
									<td class="px-2 py-2 text-center">
										<button
											type="button"
											onclick={() => removeColumn(i)}
											class="cursor-pointer text-lg text-red-400 transition-colors hover:text-red-600"
											aria-label="Remove column {row.name}"
										>
											✕
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="text-sm text-gray-400">No columns yet. Add one below.</p>
			{/if}
			<div class="flex items-center gap-2">
				<input
					type="text"
					bind:value={newColumnName}
					placeholder="Column Name..."
					class="flex-1 rounded-md border border-gray-500 p-1.5 focus:outline-none"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addColumn();
						}
					}}
				/>
				<button
					type="button"
					onclick={addColumn}
					class="rounded-md bg-gray-600 px-4 py-1.5 font-bold text-white transition-colors hover:bg-gray-700"
				>
					+ Add
				</button>
			</div>
		{/if}
		<div class="mx-8 mt-auto mb-6 flex justify-end gap-3">
			<div>
				<button
					class="size-fit rounded-2xl bg-red-700 p-4 font-bold text-white {newProject.id === ''
						? 'hidden'
						: ''}"
					onclick={() => {
						isOpen = false;
						showDeleteProject = true;
					}}>Delete</button
				>
			</div>
			<div>
				<button
					class="rounded-2xl bg-gray-500 p-4 font-bold text-white"
					type="button"
					onclick={() => (isOpen = false)}
				>
					Cancel
				</button>
				<button type="submit" class="rounded-2xl bg-green-500 p-4 font-bold text-white">
					{#if newProject.id === ''}Create{:else}Save{/if}
				</button>
			</div>
		</div>
	</form>
</ThemedDialog>
