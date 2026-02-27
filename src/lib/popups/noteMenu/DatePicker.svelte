<script lang="ts">
	import ThemedDialog from '../ThemedDialog.svelte';
	import { Button, Calendar, Separator } from 'bits-ui';
	import CaretLeftIcon from 'phosphor-svelte/lib/CaretLeftIcon';
	import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { untrack } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import './datePicker.css';

	let {
		isOpen = $bindable(false),
		initialDate = null,
		onSave
	}: {
		isOpen: boolean;
		initialDate?: { timestamp: number; hasTime: boolean } | null;
		onSave?: (value: { timestamp: number; hasTime: boolean } | null) => void;
	} = $props();

	const tz = getLocalTimeZone();

	let value: { timestamp: DateValue; hasTime: boolean } = $state({
		timestamp: today(tz),
		hasTime: false
	});
	let hours = $state(12);
	let minutes = $state(0);
	let period: 'AM' | 'PM' = $state('AM');

	function from24h(h24: number): { hours: number; period: 'AM' | 'PM' } {
		if (h24 === 0) return { hours: 12, period: 'AM' };
		if (h24 < 12) return { hours: h24, period: 'AM' };
		if (h24 === 12) return { hours: 12, period: 'PM' };
		return { hours: h24 - 12, period: 'PM' };
	}

	function currentDate() {
		const hours = new Date().getHours() % 12 || 12;
		const minutes = new Date().getMinutes();
		const period: 'AM' | 'PM' = new Date().getHours() >= 12 ? 'PM' : 'AM';
		return { hours, minutes, period };
	}

	// Restore previous date or reset to today when dialog opens
	$effect(() => {
		if (isOpen) {
			untrack(() => {
				baseDate = today(tz);
				if (initialDate) {
					const d = new SvelteDate(initialDate.timestamp);
					value.timestamp = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
					value.hasTime = initialDate.hasTime;
					// Check if time was stored
					if (initialDate.hasTime) {
						const t = from24h(d.getHours());
						hours = t.hours;
						period = t.period;
						minutes = d.getMinutes();
					} else {
						const current = currentDate();
						hours = current.hours;
						minutes = current.minutes;
						period = current.period;
					}
				} else {
					value.timestamp = today(tz);
					value.hasTime = false;
					const current = currentDate();
					hours = current.hours;
					minutes = current.minutes;
					period = current.period;
				}
			});
		}
	});

	function to24h(h: number, p: 'AM' | 'PM'): number {
		if (p === 'AM') return h === 12 ? 0 : h;
		return h === 12 ? 12 : h + 12;
	}

	function toTimestamp(): number {
		const d = new SvelteDate(value.timestamp.year, value.timestamp.month - 1, value.timestamp.day);
		if (value.hasTime) {
			d.setHours(to24h(hours, period), minutes, 0, 0);
		}
		return d.getTime();
	}

	function handleSave() {
		onSave?.({ timestamp: toTimestamp(), hasTime: value.hasTime });
		isOpen = false;
	}

	function handleClear() {
		onSave?.(null);
		isOpen = false;
	}

	function handleCancel() {
		isOpen = false;
	}

	let baseDate = $state(today(tz));

	const presets = [
		{
			label: 'Today',
			onclick: () => {
				value = { ...value, timestamp: baseDate };
			}
		},
		{
			label: 'Tomorrow',
			onclick: () => {
				value = { ...value, timestamp: baseDate.add({ days: 1 }) };
			}
		},
		{
			label: 'In 3 days',
			onclick: () => {
				value = { ...value, timestamp: baseDate.add({ days: 3 }) };
			}
		},
		{
			label: 'In a week',
			onclick: () => {
				value = { ...value, timestamp: baseDate.add({ days: 7 }) };
			}
		},
		{
			label: 'In a month',
			onclick: () => {
				value = { ...value, timestamp: baseDate.add({ months: 1 }) };
			}
		}
	];
</script>

<ThemedDialog bind:isOpen w="w-1/2">
	<div
		class="border-dark-10 bg-background-alt shadow-card rounded-15px mt-6 flex max-w-81 flex-col gap-4 border p-5.5"
	>
		<Calendar.Root
			weekdayFormat="short"
			fixedWeeks={true}
			type="single"
			bind:value={value.timestamp}
		>
			{#snippet children({ months, weekdays })}
				<Calendar.Header class="flex items-center justify-between">
					<Calendar.PrevButton
						class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center active:scale-[0.98] active:transition-all"
					>
						<CaretLeftIcon class="size-6" />
					</Calendar.PrevButton>
					<Calendar.Heading class="text-[15px] font-medium" />
					<Calendar.NextButton
						class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center active:scale-[0.98] active:transition-all"
					>
						<CaretRightIcon class="size-6" />
					</Calendar.NextButton>
				</Calendar.Header>
				<div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
					{#each months as month, i (i)}
						<Calendar.Grid class="w-full border-collapse space-y-1 select-none">
							<Calendar.GridHead>
								<Calendar.GridRow class="mb-1 flex w-full justify-between">
									{#each weekdays as day, i (i)}
										<Calendar.HeadCell
											class="text-muted-foreground w-10 rounded-md text-xs font-normal!"
										>
											<div>{day.slice(0, 2)}</div>
										</Calendar.HeadCell>
									{/each}
								</Calendar.GridRow>
							</Calendar.GridHead>
							<Calendar.GridBody>
								{#each month.weeks as weekDates, i (i)}
									<Calendar.GridRow class="flex w-full">
										{#each weekDates as date, i (i)}
											<Calendar.Cell
												{date}
												month={month.value}
												class="relative size-10 p-0! text-center text-sm"
											>
												<Calendar.Day
													class="rounded-9px text-foreground hover:border-foreground data-selected:bg-foreground data-disabled:text-foreground/30 data-selected:text-background data-unavailable:text-muted-foreground group relative inline-flex size-10 items-center justify-center border border-transparent bg-transparent p-0 text-sm font-normal whitespace-nowrap data-disabled:pointer-events-none data-outside-month:pointer-events-none data-selected:font-medium data-unavailable:line-through"
												>
													<div
														class="bg-foreground group-data-selected:bg-background absolute top-1.25 hidden size-1 rounded-full group-data-today:block"
													></div>
													{date.day}
												</Calendar.Day>
											</Calendar.Cell>
										{/each}
									</Calendar.GridRow>
								{/each}
							</Calendar.GridBody>
						</Calendar.Grid>
					{/each}
				</div>
			{/snippet}
		</Calendar.Root>
		<Separator.Root class="bg-dark-10 h-px w-full" />
		<Button.Root
			class="border-dark-10 text-foreground shadow-mini hover:bg-foreground/5 inline-flex h-8 items-center justify-center rounded-md border px-4.25 text-xs font-medium whitespace-nowrap transition-all select-none active:scale-[0.98]"
			onclick={() => {
				value.hasTime = !value.hasTime;
			}}
		>
			{value.hasTime ? 'Remove time' : 'Include time'}
		</Button.Root>
		{#if value.hasTime}
			<div class="flex w-full flex-row items-center justify-center gap-2">
				<input
					type="number"
					min="1"
					max="12"
					bind:value={hours}
					oninput={() => {
						if (hours > 12) hours = 12;
						if (hours < 1) hours = 1;
					}}
					class="bg-background-alt border-dark-10 text-foreground w-14 rounded-md border px-2 py-1.5 text-center text-sm"
					placeholder="HH"
				/>
				<span class="text-foreground text-sm font-medium">:</span>
				<input
					type="number"
					min="0"
					max="59"
					bind:value={minutes}
					oninput={() => {
						if (minutes > 59) minutes = 59;
						if (minutes < 0) minutes = 0;
					}}
					class="bg-background-alt border-dark-10 text-foreground w-14 rounded-md border px-2 py-1.5 text-center text-sm"
					placeholder="MM"
				/>
				<Button.Root
					class="border-dark-10 text-foreground shadow-mini hover:bg-foreground/5 inline-flex h-8 w-14 items-center justify-center rounded-md border text-xs font-medium transition-all select-none active:scale-[0.98]"
					onclick={() => (period = period === 'AM' ? 'PM' : 'AM')}
				>
					{period}
				</Button.Root>
			</div>
		{/if}
		<Separator.Root class="bg-dark-10 h-px w-full" />
		<div class="flex w-full flex-row flex-wrap items-center gap-2">
			{#each presets as preset (preset.label)}
				<Button.Root
					class="border-dark-10 text-foreground shadow-mini hover:bg-foreground/5 inline-flex h-8 flex-1 items-center justify-center rounded-md border px-4.25 text-xs font-medium whitespace-nowrap transition-all select-none active:scale-[0.98]"
					onclick={preset.onclick}
				>
					<span class="sr-only"> Set date to </span>
					{preset.label}
				</Button.Root>
			{/each}
		</div>
		<Separator.Root class="bg-dark-10 h-px w-full" />
		<div class="flex w-full items-center gap-2">
			<Button.Root
				class="text-destructive border-dark-10 shadow-mini hover:bg-destructive/10 inline-flex h-8 flex-1 items-center justify-center rounded-md border px-4.25 text-xs font-medium transition-all select-none active:scale-[0.98]"
				onclick={handleClear}
			>
				Clear
			</Button.Root>
			<Button.Root
				class="border-dark-10 text-foreground shadow-mini hover:bg-foreground/5 inline-flex h-8 flex-1 items-center justify-center rounded-md border px-4.25 text-xs font-medium transition-all select-none active:scale-[0.98]"
				onclick={handleCancel}
			>
				Cancel
			</Button.Root>
			<Button.Root
				class="bg-foreground text-background shadow-mini inline-flex h-8 flex-1 items-center justify-center rounded-md border px-4.25 text-xs font-medium transition-all select-none active:scale-[0.98]"
				onclick={handleSave}
			>
				Save
			</Button.Root>
		</div>
	</div>
</ThemedDialog>
