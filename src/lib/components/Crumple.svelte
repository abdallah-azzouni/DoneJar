<script>
	export let color = 'bg-black-300';
	let deg = Math.floor(Math.random() * 360);
</script>

<div class="relative size-12">
	<img
		src="src/lib/assets/elements/paper.png"
		alt=""
		class="h-full w-full grayscale"
		style="filter: grayscale(100%) brightness(1.5); transform: rotate({deg}deg);"
	/>
	<div
		class="absolute inset-0 size-full mix-blend-multiply"
		style="
		background-color: {color};
		transform: rotate({deg}deg);

      -webkit-mask-image: url(src/lib/assets/elements/paper.png);
    mask-image: url(src/lib/assets/elements/paper.png);
    mask-repeat: no-repeat; 
    mask-size: contain;
  "
	></div>
</div>
