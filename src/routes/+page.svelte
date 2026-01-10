<script>
	import StickyNote from '$lib/StickyNote.svelte';
	import Crumple from '$lib/Crumple.svelte';
</script>

<header
	class="border-32 border-transparent bg-white [border-image:url('src/lib/assets/elements/border.svg')_30_round]"
>
	<div class="flex h-16 items-center gap-8">
		<a class="block text-teal-600" href="#">
			<span class="sr-only">Home</span>
			<svg
				viewBox="0 0 24 24"
				width="24"
				height="24"
				stroke="currentColor"
				stroke-width="2"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="css-i6dzq1"
				><circle cx="12" cy="5" r="3"></circle><line x1="12" y1="22" x2="12" y2="8"></line><path
					d="M5 12H2a10 10 0 0 0 20 0h-3"
				></path></svg
			>
		</a>

		<div class="flex flex-1 items-center justify-end md:justify-between">
			<nav aria-label="Global" class="hidden md:block">
				<ul class="flex items-center gap-6 text-sm">
					<li>
						<a class="text-gray-500 transition hover:text-gray-500/75" href="#"> About </a>
					</li>
				</ul>
			</nav>

			<div class="flex items-center gap-4">
				<button
					class="cursor-pointer border-none bg-transparent p-0 transition duration-150 hover:scale-105 focus:outline-none
								focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-95"
				>
					<img
						src="src/lib/assets/elements/create-button.svg"
						alt="create"
						class="pointer-events-none select-none"
					/>
				</button>

				<button
					class="size-12 cursor-pointer rounded-full border border-black bg-transparent p-2 transition duration-150 hover:scale-105
								focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:scale-95"
				>
					<img
						src="src/lib/assets/icons/menu.svg"
						alt="menu"
						class="pointer-events-none size-full select-none"
					/>
				</button>
			</div>
		</div>
	</div>
</header>

<div class="m-8 flex h-200 flex-row gap-4">
	<div class="flex w-3/8 flex-col items-center">
		<span class="font-patrick-hand text-7xl font-bold">TODO</span>
		<div
			class="h-full w-full border-32 border-transparent [border-image:url('src/lib/assets/elements/border.svg')_30_round]"
		>
			<Crumple />
			<Crumple />
		</div>
	</div>
	<div class="flex w-3/8 flex-col items-center">
		<span class="font-patrick-hand text-7xl font-bold">DOING</span>
		<div
			class="h-full w-full border-32 border-transparent [border-image:url('src/lib/assets/elements/border.svg')_30_round]"
		>
			<StickyNote color="text-yellow-500" />
		</div>
	</div>
	<div class="w-1/4 self-end">
		<div><img src="src/lib/assets/elements/beaker.png" alt="beaker" /></div>
	</div>
</div>
