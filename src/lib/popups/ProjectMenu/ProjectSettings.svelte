<script lang="ts">
	import { createProject, editProject } from '$lib/actions';
	import { textColorFromHex } from '$lib/UiHelper';
	import { Dialog } from 'bits-ui';
	import { notify } from '$lib/stores/notificationStore';
	import { failure, createColumn } from '$lib/types';
	import { type ColumnDocType, type ProjectDocType } from '$lib/db/schemas';
	import {
		MAX_PROJECT_NAME_LENGTH,
		DEFAULT_PROJECT_COLOR,
		DEFAULT_MENU_COLORS
	} from '$lib/constants';
	import { projectSettingStore, closeProjectSetting } from '$lib/stores/dialog';

	let project = $derived(projectSettingStore.data);
	let isOpen = $derived(projectSettingStore.isOpen);

	let newProject = $state({} as ProjectDocType);
	let customColumns: ColumnDocType[] = $state([]);

	let newColumnName = $state('');

	let inboxIndex: number | null = $state(null);
	let jarIndex: number | null = $state(null);

	$effect(() => {
		if (isOpen) {
			newProject = project
				? { ...project }
				: {
						id: '',
						name: '',
						type: 'default',
						color: DEFAULT_PROJECT_COLOR,
						maxCapacity: 100,
						createdAt: '',
						updatedAt: ''
					};
			customColumns = [];
			inboxIndex = null;
			jarIndex = null;
			newColumnName = '';
		}
	});

	function buildColumnsWithSpecialTypes(): ColumnDocType[] {
		return customColumns.map((col, i) => ({
			...col,
			specialType: i === inboxIndex ? 'inbox' : i === jarIndex ? 'jar' : undefined
		}));
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		let pass = true;

		newProject.maxCapacity = Number(newProject.maxCapacity);

		if (newProject.id === '') {
			if (newProject.type === 'custom') {
				const columns = buildColumnsWithSpecialTypes();
				const result = await createProject(
					newProject.name,
					newProject.type,
					newProject.color,
					newProject.maxCapacity,
					columns
				);
				notify(result);
				pass &&= result.type === 'success';
			} else {
				const result = await createProject(
					newProject.name,
					newProject.type,
					newProject.color,
					newProject.maxCapacity
				);
				notify(result);
				pass &&= result.type === 'success';
			}
		} else {
			const result = await editProject(newProject);
			notify(result);
			pass &&= result.type === 'success';
		}

		if (pass) {
			closeProjectSetting();
		}
	}

	function addColumn() {
		const trimmed = newColumnName.trim();
		if (!trimmed) {
			notify(failure('Column name cannot be empty'));
			return;
		}
		if (customColumns.map((c) => c.name.toLowerCase()).includes(trimmed.toLowerCase())) {
			notify(failure('Column name must be unique'));
			return;
		}

		if (customColumns.length >= 5) {
			notify(failure('Maximum of 5 columns allowed'));
			return;
		}
		customColumns = [
			...customColumns,
			createColumn({
				id: '',
				projectId: '',
				name: trimmed,
				position: customColumns.length
			})
		];
		newColumnName = '';
	}

	function removeColumn(index: number) {
		customColumns = customColumns.filter((_, i) => i !== index);
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
			if (inboxIndex === jarIndex) jarIndex = null;
		} else {
			jarIndex = jarIndex === index ? null : index;
			if (jarIndex === inboxIndex) inboxIndex = null;
		}
	}
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(o) => {
		if (!o) closeProjectSetting();
	}}
>
	<Dialog.Portal to="body">
		<Dialog.Overlay class="fixed inset-0 z-9998 bg-black/50 backdrop-blur-[1px]" />
		<Dialog.Content
			interactOutsideBehavior="ignore"
			class="fixed top-[7.5vh] left-1/2 z-9998 mx-auto h-[85vh] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border-2 border-black bg-[#FDFBF7] p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.15)]"
		>
			<form onsubmit={handleSubmit} class="flex h-full min-h-0 flex-col">
				<h1
					class=" text-center font-patrick-hand text-3xl font-bold tracking-wide text-gray-900 uppercase"
				>
					{#if newProject.id === ''}Create Project{:else}Edit Project{/if}
				</h1>
				<div class="flex-1 overflow-y-auto p-4">
					<div class="flex min-h-0 flex-1 flex-col gap-6 pr-2">
						<!-- Name Input -->
						<div>
							<input
								type="text"
								bind:value={newProject.name}
								class="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-lg font-bold placeholder-gray-400 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all focus:ring-2 focus:ring-amber-200 focus:outline-none"
								required
								placeholder="Project Name..."
								maxlength={MAX_PROJECT_NAME_LENGTH}
							/>
						</div>

						<!-- Project Color (Imported from Note Component) -->
						<div>
							<span class="mb-2 block font-patrick-hand text-xl font-bold text-gray-800"
								>Project Color</span
							>
							<div class="flex flex-wrap gap-2">
								{#each DEFAULT_MENU_COLORS as paletteColor (paletteColor)}
									<button
										type="button"
										class="size-10 rounded-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
										style:background-color={paletteColor}
										class:border-4={newProject.color === paletteColor}
										onclick={() => (newProject.color = paletteColor)}
										title="Select color {paletteColor}"
									>
									</button>
								{/each}

								<label
									class="relative flex size-10 transform cursor-pointer items-center justify-center rounded-full border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
									style:background-color={newProject.color}
									class:border-4={!DEFAULT_MENU_COLORS.includes(newProject.color)}
								>
									<span class="text-xl font-bold" style:color={textColorFromHex(newProject.color)}
										>+</span
									>
									<input
										type="color"
										bind:value={newProject.color}
										class="absolute inset-0 cursor-pointer opacity-0"
									/>
								</label>
							</div>
						</div>

						<!-- Max Capacity (Range + Number Input) -->
						<div>
							<div class="mb-2 flex items-center gap-3">
								<span class="font-patrick-hand text-xl font-bold text-gray-800">Max Capacity</span>
								<input
									type="number"
									bind:value={newProject.maxCapacity}
									class="w-20 rounded-lg border-2 border-black bg-white px-2 py-1 text-center font-bold shadow-[1px_1px_0px_rgba(0,0,0,1)] focus:ring-2 focus:ring-amber-200 focus:outline-none"
									min="1"
									max="500"
									required
								/>
								<span class="ml-auto font-patrick-hand text-sm text-gray-500"
									>Items auto-resize to fit in the jar</span
								>
							</div>
							<input
								type="range"
								bind:value={newProject.maxCapacity}
								class="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-amber-400"
								min="1"
								max="500"
							/>
						</div>

						<!-- Project Type (Only on Create) -->
						{#if newProject.id === ''}
							<div>
								<span class="mb-2 block font-patrick-hand text-xl font-bold text-gray-800"
									>Type</span
								>
								<select
									bind:value={newProject.type}
									class="w-full cursor-pointer rounded-xl border-2 border-black bg-white px-4 py-3 font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] focus:outline-none"
								>
									<option value="default">Default (TODO, DOING, DONE)</option>
									<option value="blank">Blank (no default columns)</option>
									<option value="custom">Custom (specify column names)</option>
								</select>
							</div>
						{/if}

						<!-- Custom Columns Section -->
						{#if newProject.type === 'custom' && newProject.id === ''}
							<div
								class="mt-4 rounded-xl border-2 border-black bg-white p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
							>
								{#if customColumns.length > 0}
									<div class="mb-4 overflow-hidden">
										<table class="w-full border-collapse text-left">
											<thead>
												<tr class="border-b-2 border-black/20">
													<th class="py-2 font-patrick-hand text-lg">Name</th>
													<th class="py-2 text-center font-patrick-hand text-lg">Inbox</th>
													<th class="py-2 text-center font-patrick-hand text-lg">Jar</th>
													<th class="w-10"></th>
												</tr>
											</thead>
											<tbody>
												{#each customColumns as row, i (i)}
													<tr class="border-b border-black/10 last:border-b-0">
														<td class="py-2 font-bold">{row.name}</td>
														<td class="py-2 text-center">
															<input
																type="radio"
																name="inbox"
																checked={inboxIndex === i}
																onclick={() => toggleRadio('inbox', i)}
																class="size-5 cursor-pointer accent-blue-500"
															/>
														</td>
														<td class="py-2 text-center">
															<input
																type="radio"
																name="jar"
																checked={jarIndex === i}
																onclick={() => toggleRadio('jar', i)}
																class="size-5 cursor-pointer accent-amber-500"
															/>
														</td>
														<td class="py-2 text-center">
															<button
																type="button"
																onclick={() => removeColumn(i)}
																class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-red-400 font-bold text-white shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-transform hover:scale-110"
																aria-label={`Remove column ${row.name}`}
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
									<p class="mb-4 text-center font-patrick-hand text-lg text-gray-500">
										No columns yet. Add one below.
									</p>
								{/if}

								<div class="flex items-center gap-3">
									<input
										type="text"
										bind:value={newColumnName}
										placeholder="Column Name..."
										class="flex-1 rounded-lg border-2 border-black px-3 py-2 font-bold focus:ring-2 focus:ring-amber-200 focus:outline-none"
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
										class="rounded-lg border-2 border-black bg-amber-300 px-4 py-2 font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
									>
										+ Add
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
				<!-- Action Buttons -->
				<div class="shrink-0 border-t-2 border-black/20 px-4 pt-3">
					<div class="flex justify-end gap-4">
						<button
							class="rounded-xl border-2 border-black bg-white px-6 py-2.5 font-bold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
							type="button"
							onclick={() => closeProjectSetting()}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="rounded-xl border-2 border-black bg-[#00E571] px-6 py-2.5 font-bold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5"
						>
							{#if newProject.id === ''}Create{:else}Save Changes{/if}
						</button>
					</div>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
