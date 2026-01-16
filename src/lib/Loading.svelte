<div class="mt-[25%] flex h-screen flex-row items-baseline justify-center">
	<h1 class="font-patrick-hand text-7xl">Loading</h1>
	<div class="loader"></div>
</div>

<style>
	/* HTML: <div class="loader"></div> */
	.loader {
		width: 60px;
		aspect-ratio: 2;
		--_g: no-repeat radial-gradient(circle closest-side, #000 90%, #0000);
		background:
			var(--_g) 0% 50%,
			var(--_g) 50% 50%,
			var(--_g) 100% 50%;
		background-size: calc(100% / 3) 50%;
		animation: l3 1s infinite linear;
	}
	@keyframes l3 {
		20% {
			background-position:
				0% 0%,
				50% 50%,
				100% 50%;
		}
		40% {
			background-position:
				0% 100%,
				50% 0%,
				100% 50%;
		}
		60% {
			background-position:
				0% 50%,
				50% 100%,
				100% 0%;
		}
		80% {
			background-position:
				0% 50%,
				50% 50%,
				100% 100%;
		}
	}
</style>
