<script>
	import paper from '$lib/assets/elements/paper.png';

	let { color = '#ffffff' } = $props();

	let deg = Math.floor(Math.random() * 360);
</script>

<div class="relative size-12">
	<img
		src={paper}
		alt=""
		class="h-full w-full grayscale"
		style="filter: grayscale(100%) brightness(1.5); transform: rotate({deg}deg);"
	/>
	<div
		class="absolute inset-0 size-full mix-blend-multiply"
		style="
		background-color: {color};
		transform: rotate({deg}deg);

      -webkit-mask-image: url({paper});
    mask-image: url({paper});
    mask-repeat: no-repeat; 
    mask-size: contain;
  "
	></div>
</div>
