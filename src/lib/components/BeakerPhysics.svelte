<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Matter from 'matter-js';
	import paperTexture from '$lib/assets/elements/paper.png';

	// ============================================================================
	// PROPS & STATE
	// ============================================================================

	let { items = [], activeProject = '' } = $props();

	// Canvas dimensions
	const width = 400;
	const height = 500;

	// Physics properties
	const ELASTICITY = 0.5;
	const FRICTION = 0.7;

	// Boundary positions (relative to canvas dimensions)
	const FLOOR_Y_RATIO = 0.88;
	const FLOOR_WIDTH_RATIO = 1;
	const LEFT_WALL_X_RATIO = 0.2;
	const RIGHT_WALL_X_RATIO = 0.87;
	const WALL_THICKNESS = 10;

	// Particle properties
	const PARTICLE_SIZE_MULTIPLIER = 1.25;
	const PARTICLE_RADIUS_RATIO = 0.08;
	const PARTICLE_CHAMFER_RATIO = 0.1;
	const PARTICLE_DENSITY = 0.001;

	// Particle spawn properties
	const SPAWN_Y = 100;
	const SPAWN_VELOCITY_RANGE = 3;
	const SPAWN_VELOCITY_Y = 2;
	const SPAWN_ANGULAR_VELOCITY_RANGE = 0.05;

	// Rendering properties
	const TEXTURE_OVERLAY_ALPHA = 0.3;
	const SCRATCH_CANVAS_SIZE = 100;

	// ============================================================================
	// CANVAS & RENDERING
	// ============================================================================

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let scratchCanvas: HTMLCanvasElement;
	let scratchCtx: CanvasRenderingContext2D | null = null;

	let paperImg = new Image();
	let imgLoaded = false;

	// ============================================================================
	// PHYSICS ENGINE
	// ============================================================================

	let engine: Matter.Engine;
	let world: Matter.World;
	let runner: Matter.Runner;
	let walls: Matter.Body[] = [];

	// Store particle metadata (color, size) linked to Matter.js bodies
	const particleData = new Map<Matter.Body, { color: string; size: number }>();

	// Track project changes
	let lastActiveProject = activeProject;

	// Track animation frame for cleanup
	let animationFrameId: number | null = null;

	// Debug mode for visualizing walls
	let showWalls = true; // Set to true to see wall boundaries

	// ============================================================================
	// PHYSICS INITIALIZATION
	// ============================================================================

	function initPhysics() {
		engine = Matter.Engine.create({
			gravity: { x: 0, y: 0.8 },
			constraintIterations: 3,
			positionIterations: 6,
			velocityIterations: 4
		});
		world = engine.world;
		createBoundaries();
		runner = Matter.Runner.create();
	}

	function createBoundaries() {
		const boundaryOptions = {
			isStatic: true,
			restitution: ELASTICITY,
			friction: FRICTION,
			render: { visible: false }
		};

		const floor = Matter.Bodies.rectangle(
			width / 2,
			height * FLOOR_Y_RATIO + WALL_THICKNESS / 2,
			width * FLOOR_WIDTH_RATIO,
			WALL_THICKNESS,
			boundaryOptions
		);

		const leftWall = Matter.Bodies.rectangle(
			width * LEFT_WALL_X_RATIO - WALL_THICKNESS / 2,
			height / 2,
			WALL_THICKNESS,
			height,
			boundaryOptions
		);

		const rightWall = Matter.Bodies.rectangle(
			width * RIGHT_WALL_X_RATIO + WALL_THICKNESS / 2,
			height / 2,
			WALL_THICKNESS,
			height,
			boundaryOptions
		);

		walls = [floor, leftWall, rightWall];
		Matter.World.add(world, walls);
	}

	// ============================================================================
	// PARTICLE MANAGEMENT
	// ============================================================================

	function createPaperBody(color: string, size: number): Matter.Body {
		const paperSize = size * PARTICLE_SIZE_MULTIPLIER;

		const body = Matter.Bodies.rectangle(width / 2, SPAWN_Y, paperSize, paperSize, {
			restitution: ELASTICITY,
			friction: FRICTION,
			density: PARTICLE_DENSITY,
			render: { visible: false },
			angle: Math.random() * Math.PI * 2,
			chamfer: { radius: size * PARTICLE_CHAMFER_RATIO }
		});

		Matter.Body.setVelocity(body, {
			x: (Math.random() - 0.5) * SPAWN_VELOCITY_RANGE,
			y: SPAWN_VELOCITY_Y
		});

		Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * SPAWN_ANGULAR_VELOCITY_RANGE);

		particleData.set(body, { color, size });

		return body;
	}

	function syncParticles() {
		if (!world) return;

		// Detect project change - reinitialize everything
		if (activeProject !== lastActiveProject) {
			lastActiveProject = activeProject;
			reinitializePhysics();
			return;
		}

		// Same project - adjust particle count
		const currentBodies = Array.from(particleData.keys());
		const targetCount = items.length;

		if (targetCount < currentBodies.length) {
			removeExcessParticles(currentBodies, targetCount);
		} else if (targetCount > currentBodies.length) {
			addNewParticles(currentBodies.length, targetCount);
		}
	}

	function removeExcessParticles(currentBodies: Matter.Body[], targetCount: number) {
		const bodiesToRemove = currentBodies.slice(targetCount);
		bodiesToRemove.forEach((body) => {
			Matter.World.remove(world, body);
			particleData.delete(body);
		});
	}

	function addNewParticles(startIndex: number, targetCount: number) {
		for (let i = startIndex; i < targetCount; i++) {
			const newNote = items[i];
			if (newNote) {
				const responsiveRadius = width * PARTICLE_RADIUS_RATIO;
				const body = createPaperBody(newNote.color, responsiveRadius);
				Matter.World.add(world, body);
			}
		}
	}

	function reinitializePhysics() {
		// Cleanup old state first
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}

		if (runner) Matter.Runner.stop(runner);
		if (engine) {
			Matter.Engine.clear(engine);
			Matter.World.clear(world, false);
		}

		particleData.clear();

		// Initialize new physics
		if (canvas) {
			ctx = canvas.getContext('2d');
			scratchCanvas = document.createElement('canvas');
			scratchCanvas.width = SCRATCH_CANVAS_SIZE;
			scratchCanvas.height = SCRATCH_CANVAS_SIZE;
			scratchCtx = scratchCanvas.getContext('2d');

			initPhysics();

			paperImg.src = paperTexture;
			paperImg.onload = () => {
				imgLoaded = true;
				Matter.Runner.run(runner, engine);
				render();
				syncParticles();
			};
		}
	}

	// ============================================================================
	// RENDERING
	// ============================================================================

	function render() {
		if (!ctx || !canvas) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Debug: Visualize walls
		if (showWalls) {
			ctx.strokeStyle = 'red';
			ctx.lineWidth = 2;
			walls.forEach((wall) => {
				const vertices = wall.vertices;
				ctx.beginPath();
				ctx.moveTo(vertices[0].x, vertices[0].y);
				for (let i = 1; i < vertices.length; i++) {
					ctx.lineTo(vertices[i].x, vertices[i].y);
				}
				ctx.closePath();
				ctx.stroke();
			});
		}

		particleData.forEach((data, body) => {
			if (!world.bodies.includes(body)) {
				particleData.delete(body);
				return;
			}

			renderParticle(body, data);
		});

		animationFrameId = requestAnimationFrame(render);
	}

	function renderParticle(body: Matter.Body, data: { color: string; size: number }) {
		const { color, size } = data;
		const { x, y } = body.position;
		const angle = body.angle;

		drawTexturedPaper(x, y, angle, color, size);
	}

	function drawTexturedPaper(x: number, y: number, angle: number, color: string, size: number) {
		scratchCtx!.clearRect(0, 0, SCRATCH_CANVAS_SIZE, SCRATCH_CANVAS_SIZE);
		scratchCtx!.save();
		scratchCtx!.translate(SCRATCH_CANVAS_SIZE / 2, SCRATCH_CANVAS_SIZE / 2);
		scratchCtx!.rotate(angle);

		// Base color
		scratchCtx!.fillStyle = color;
		scratchCtx!.fillRect(-size, -size, size * 2, size * 2);

		// Apply paper texture mask
		scratchCtx!.globalCompositeOperation = 'destination-in';
		scratchCtx!.drawImage(paperImg, -size, -size, size * 2, size * 2);

		// Soft light blend
		scratchCtx!.globalCompositeOperation = 'soft-light';
		scratchCtx!.drawImage(paperImg, -size, -size, size * 2, size * 2);

		// Screen overlay
		scratchCtx!.globalCompositeOperation = 'screen';
		scratchCtx!.globalAlpha = TEXTURE_OVERLAY_ALPHA;
		scratchCtx!.drawImage(paperImg, -size, -size, size * 2, size * 2);

		scratchCtx!.restore();
		ctx!.drawImage(scratchCanvas, x - SCRATCH_CANVAS_SIZE / 2, y - SCRATCH_CANVAS_SIZE / 2);
	}

	// ============================================================================
	// REACTIVE EFFECTS
	// ============================================================================

	$effect(() => {
		const project = activeProject;
		const size = items.length;

		if (imgLoaded && world) {
			syncParticles();
		}
	});

	// ============================================================================
	// LIFECYCLE
	// ============================================================================

	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d');
			scratchCanvas = document.createElement('canvas');
			scratchCanvas.width = SCRATCH_CANVAS_SIZE;
			scratchCanvas.height = SCRATCH_CANVAS_SIZE;
			scratchCtx = scratchCanvas.getContext('2d');

			initPhysics();

			paperImg.src = paperTexture;
			paperImg.onload = () => {
				imgLoaded = true;
				Matter.Runner.run(runner, engine);
				render();
				syncParticles();
			};
		}
	});

	onDestroy(() => {
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
		if (runner) Matter.Runner.stop(runner);
		if (engine) {
			Matter.Engine.clear(engine);
			Matter.World.clear(world, false);
		}
		particleData.clear();
		if (scratchCanvas) {
			scratchCanvas.width = 0;
			scratchCanvas.height = 0;
		}
	});
</script>

<canvas
	bind:this={canvas}
	width="400"
	height="500"
	class="pointer-events-none absolute inset-0 z-20 h-full w-full"
></canvas>
