<script>
	export let color = 'bg-black-300';
</script>

<div class="relative size-12">
	<img
		src="src/lib/assets/elements/paper.png"
		alt=""
		class="h-full w-full rotate-0 grayscale"
		style="filter: grayscale(100%) brightness(1.5);"
	/>
	<div
		class="absolute inset-0 size-full mix-blend-multiply"
		style="
		background-color: {color};

      -webkit-mask-image: url(src/lib/assets/elements/paper.png);
    mask-image: url(src/lib/assets/elements/paper.png);
    mask-repeat: no-repeat; 
    mask-size: contain;
  "
	></div>
</div>
