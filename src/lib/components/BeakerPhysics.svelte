<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import paperTexture from '$lib/assets/elements/paper.png';

	let { items = [], width, height } = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let scratchCanvas: HTMLCanvasElement;
	let scratchCtx: CanvasRenderingContext2D | null = null;

	let particles: any[] = [];
	let imgLoaded = false;
	const paperImg = new Image();
	let animationId: number;

	$effect(() => {
		const count = items.length;
		if (imgLoaded) {
			syncParticles();
		}
		if (canvas && width && height) {
			canvas.width = width;
			canvas.height = height;
		}
	});

	function syncParticles() {
		const currentCount = particles.length;
		const targetCount = items.length;

		if (targetCount > currentCount) {
			for (let i = currentCount; i < targetCount; i++) {
				const newNote = items[i];
				if (newNote) {
					dropGrain(newNote.color);
				}
			}
		} else if (targetCount < currentCount) {
			particles = particles.slice(0, targetCount);
		}
	}
	function dropGrain(noteColor: string) {
		const responsiveRadius = width * 0.08;

		particles.push({
			x: width / 2,
			y: -50,
			vx: (Math.random() - 0.5) * 2,
			vy: 2,
			r: responsiveRadius,
			rotation: Math.random() * Math.PI * 2,
			rotationSpeed: (Math.random() - 0.5) * 0.1,
			color: noteColor
		});
	}

	const BOUNDARIES = {
		left: 0.17,
		right: 0.83,
		bottom: 0.88
	};

	function update() {
		if (!ctx || !canvas) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const leftBoundary = width * BOUNDARIES.left;
		const rightBoundary = width * BOUNDARIES.right;
		const bottomBoundary = height * BOUNDARIES.bottom;

		particles.forEach((p, i) => {
			// Gravity & Velocity
			p.vy += 0.25;
			p.x += p.vx;
			p.y += p.vy;

			// 3. COLLISION LOGIC using the dynamic boundaries
			// Floor Level
			if (p.y + p.r > bottomBoundary) {
				p.y = bottomBoundary - p.r;
				p.vy *= -0.4;
				p.vx *= 0.9;
			}

			// Walls
			if (p.x - p.r < leftBoundary) {
				p.x = leftBoundary + p.r;
				p.vx *= -0.5;
			}
			if (p.x + p.r > rightBoundary) {
				p.x = rightBoundary - p.r;
				p.vx *= -0.5;
			}

			// Collisions
			for (let j = i + 1; j < particles.length; j++) {
				let p2 = particles[j];
				let dx = p2.x - p.x;
				let dy = p2.y - p.y;
				let dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < p.r * 1.5) {
					let angle = Math.atan2(dy, dx);
					const force = 0.5;
					p.vx -= Math.cos(angle) * force;
					p.vy -= Math.sin(angle) * force;
					p2.vx += Math.cos(angle) * force;
					p2.vy += Math.sin(angle) * force;
				}
			}

			const size = p.r * 2;
			scratchCtx!.clearRect(0, 0, 100, 100);

			scratchCtx!.save();
			scratchCtx!.translate(50, 50);
			scratchCtx!.rotate(p.rotation);

			// 1. Draw the vibrant color first
			scratchCtx!.fillStyle = p.color;
			scratchCtx!.fillRect(-p.r, -p.r, size, size);

			// 2. Mask it so the color only exists where the paper texture is opaque
			// This cuts the rectangle into the shape of your "crumpled paper"
			scratchCtx!.globalCompositeOperation = 'destination-in';
			scratchCtx!.drawImage(paperImg, -p.r, -p.r, size, size);

			// 3. Add the texture details (wrinkles) back on top
			// 'soft-light' or 'overlay' will keep the color bright while adding shadows/highlights
			scratchCtx!.globalCompositeOperation = 'soft-light';
			scratchCtx!.drawImage(paperImg, -p.r, -p.r, size, size);

			// 4. (Optional) If it's still too dark, "Invert" the texture logic by
			// using 'lighter' or 'screen' to punch up the highlights
			scratchCtx!.globalCompositeOperation = 'screen';
			scratchCtx!.globalAlpha = 0.3; // subtle texture overlay
			scratchCtx!.drawImage(paperImg, -p.r, -p.r, size, size);

			scratchCtx!.restore();

			// Copy to main canvas
			ctx!.drawImage(scratchCanvas, p.x - 50, p.y - 50);
		});

		animationId = requestAnimationFrame(update);
	}

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d');

			// Setup offscreen canvas
			scratchCanvas = document.createElement('canvas');
			scratchCanvas.width = 100;
			scratchCanvas.height = 100;
			scratchCtx = scratchCanvas.getContext('2d');

			paperImg.src = paperTexture;
			paperImg.onload = () => {
				imgLoaded = true;
				syncParticles(); // Load existing items
				update();
			};
		}
	});

	onDestroy(() => {
		cancelAnimationFrame(animationId);
	});
</script>

<canvas
	bind:this={canvas}
	width="400"
	height="500"
	class="pointer-events-none absolute inset-0 z-20 h-full w-full"
></canvas>
