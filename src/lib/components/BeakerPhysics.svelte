<script lang="ts">
	import { onMount } from 'svelte';
	import { type NoteDocType } from '$lib/db/schemas/index';

	let { items = [], maxCapacity = 500 }: { items: NoteDocType[]; maxCapacity: number } = $props();

	const SIM_WIDTH = 605;
	const SIM_HEIGHT = 750;
	const GRAVITY = 1500;

	const DXS = [1, -1, 0, 1];
	const DYS = [0, 1, 1, 1];

	const PHYS_CONFIG = {
		SUBSTEPS: 4,
		CORNER_RADIUS: 100,
		SHOULDER_RADIUS: 200,
		COLLISION_RESPONSE: 0.85,
		ROLLING_FRICTION: 0.02,
		WALL_BOUNCE_DAMPING: 0.5,
		FLOOR_BOUNCE_Y_DAMPING: 0.3,
		FLOOR_BOUNCE_X_DAMPING: 0.98,
		LAUNCH_Y_OFFSET: 50,
		MAX_FRAME_TIME: 0.1
	};

	let MAX_CAPACITY = $derived(Math.max(maxCapacity, items.length));
	const PACK_DENSITY = 0.87;

	const jarArea = (() => {
		const rectArea = SIM_WIDTH * SIM_HEIGHT;
		const cornerCut = (1 - Math.PI / 4) * PHYS_CONFIG.CORNER_RADIUS ** 2;
		const shoulderCut = (1 - Math.PI / 4) * PHYS_CONFIG.SHOULDER_RADIUS ** 2;
		return rectArea - 2 * cornerCut - 2 * shoulderCut;
	})();

	let DEFAULT_RADIUS = $derived(Math.sqrt((jarArea * PACK_DENSITY) / (MAX_CAPACITY * Math.PI)));
	let CELL_SIZE = $derived(Math.ceil(DEFAULT_RADIUS * 2));
	let GRID_COLS = $derived(Math.ceil(SIM_WIDTH / CELL_SIZE));
	let GRID_ROWS = $derived(Math.ceil(SIM_HEIGHT / CELL_SIZE));
	let TOTAL_CELLS = $derived(GRID_COLS * GRID_ROWS);

	let entities: Entity[] = [];
	let gridHead = $derived(new Int32Array(TOTAL_CELLS));
	let entityNext = new Int32Array(0);

	// Populate entities
	$effect(() => {
		const radius = DEFAULT_RADIUS;
		const currentItems = items;

		const entityMap = new Map(entities.map((e) => [e.id, e]));
		let updatedEntities: Entity[] = [];

		for (let i = 0; i < currentItems.length; i++) {
			const item = currentItems[i];
			const existing = entityMap.get(item.id);

			if (existing) {
				existing.color = item.color;
				existing.radius = radius;
				updatedEntities.push(existing);
			} else {
				const x = SIM_WIDTH / 2;
				const y = PHYS_CONFIG.LAUNCH_Y_OFFSET;
				const launchVelocityX = (Math.random() - 0.5) * 300;
				const launchVelocityY = (Math.random() - 0.5) * 100;
				const fixedDt = 0.016;

				updatedEntities.push({
					id: item.id,
					x,
					y,
					oldX: x - launchVelocityX * fixedDt,
					oldY: y - launchVelocityY * fixedDt,
					radius: DEFAULT_RADIUS,
					color: item.color
				});
			}
		}

		entities = updatedEntities;
		entityNext = new Int32Array(entities.length);
	});

	let rafId: number;

	type Entity = {
		id: string;
		x: number;
		y: number;
		oldX: number;
		oldY: number;
		radius: number;
		color: string;
	};

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	function updatePhysics(dt: number) {
		for (let i = 0; i < entities.length; i++) {
			const entity = entities[i];
			const vx = (entity.x - entity.oldX) * 1;
			const vy = (entity.y - entity.oldY) * 1;

			entity.oldX = entity.x;
			entity.oldY = entity.y;
			entity.x += vx;
			entity.y += vy + GRAVITY * dt * dt;

			// Boundaries
			if (entity.x - entity.radius < 0) {
				entity.x = entity.radius;
				entity.oldX = entity.x + (entity.x - entity.oldX) * PHYS_CONFIG.WALL_BOUNCE_DAMPING;
			} else if (entity.x + entity.radius > SIM_WIDTH) {
				entity.x = SIM_WIDTH - entity.radius;
				entity.oldX = entity.x - (entity.x - entity.oldX) * PHYS_CONFIG.WALL_BOUNCE_DAMPING;
			}
			if (entity.y - entity.radius < 0) entity.y = entity.radius;
			else if (entity.y + entity.radius > SIM_HEIGHT) {
				entity.y = SIM_HEIGHT - entity.radius;
				const current_vy = entity.y - entity.oldY;
				entity.oldY = entity.y + current_vy * PHYS_CONFIG.FLOOR_BOUNCE_Y_DAMPING;
				const current_vx = entity.x - entity.oldX;
				entity.oldX = entity.x - current_vx * PHYS_CONFIG.FLOOR_BOUNCE_X_DAMPING;
			}

			const cornerRadius = PHYS_CONFIG.CORNER_RADIUS;

			// --- BOTTOM LEFT CORNER CURVE ---
			if (entity.x < cornerRadius && entity.y > SIM_HEIGHT - cornerRadius) {
				const cx = cornerRadius;
				const cy = SIM_HEIGHT - cornerRadius;
				const dx = entity.x - cx;
				const dy = entity.y - cy;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const maxDist = cornerRadius - entity.radius;
				if (dist > maxDist && dist > 0) {
					entity.x = cx + (dx / dist) * maxDist;
					entity.y = cy + (dy / dist) * maxDist;
				}
			}

			// --- BOTTOM RIGHT CORNER CURVE ---
			if (entity.x > SIM_WIDTH - cornerRadius && entity.y > SIM_HEIGHT - cornerRadius) {
				const cx = SIM_WIDTH - cornerRadius;
				const cy = SIM_HEIGHT - cornerRadius;
				const dx = entity.x - cx;
				const dy = entity.y - cy;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const maxDist = cornerRadius - entity.radius;
				if (dist > maxDist && dist > 0) {
					entity.x = cx + (dx / dist) * maxDist;
					entity.y = cy + (dy / dist) * maxDist;
				}
			}

			// --- TOP SHOULDER CURVES (Narrowing into the neck) ---
			const shoulderRadius = PHYS_CONFIG.SHOULDER_RADIUS;
			// Top Left Shoulder
			if (entity.x < shoulderRadius && entity.y < shoulderRadius) {
				const cx = shoulderRadius;
				const cy = shoulderRadius;
				const dx = entity.x - cx;
				const dy = entity.y - cy;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const maxDist = shoulderRadius - entity.radius;
				if (dist > maxDist && dist > 0) {
					entity.x = cx + (dx / dist) * maxDist;
					entity.y = cy + (dy / dist) * maxDist;
				}
			}
			// Top Right Shoulder
			if (entity.x > SIM_WIDTH - shoulderRadius && entity.y < shoulderRadius) {
				const cx = SIM_WIDTH - shoulderRadius;
				const cy = shoulderRadius;
				const dx = entity.x - cx;
				const dy = entity.y - cy;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const maxDist = shoulderRadius - entity.radius;
				if (dist > maxDist && dist > 0) {
					entity.x = cx + (dx / dist) * maxDist;
					entity.y = cy + (dy / dist) * maxDist;
				}
			}
		}

		// 2. Clear and Rebuild Flat Spatial Grid
		gridHead.fill(-1);
		entityNext.fill(-1);

		for (let i = 0; i < entities.length; i++) {
			const ent = entities[i];
			// Clamp indexes safety check
			const cx = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(ent.x / CELL_SIZE)));
			const cy = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(ent.y / CELL_SIZE)));
			const cellIdx = cx + cy * GRID_COLS;

			// Link list insertion
			entityNext[i] = gridHead[cellIdx];
			gridHead[cellIdx] = i;
		}

		// 3. Unidirectional Collision Pass
		for (let y = 0; y < GRID_ROWS; y++) {
			for (let x = 0; x < GRID_COLS; x++) {
				const cellIdx = x + y * GRID_COLS;
				const head1 = gridHead[cellIdx];
				if (head1 === -1) continue;

				// Self cell collisions
				let i = head1;
				while (i !== -1) {
					let j = entityNext[i];
					while (j !== -1) {
						solveCollision(entities[i], entities[j]);
						j = entityNext[j];
					}
					i = entityNext[i];
				}

				for (let n = 0; n < 4; n++) {
					const nx = x + DXS[n];
					const ny = y + DYS[n];

					if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS) {
						const targetCellIdx = nx + ny * GRID_COLS;
						let idx1 = gridHead[cellIdx];

						while (idx1 !== -1) {
							let idx2 = gridHead[targetCellIdx];
							while (idx2 !== -1) {
								solveCollision(entities[idx1], entities[idx2]);
								idx2 = entityNext[idx2];
							}
							idx1 = entityNext[idx1];
						}
					}
				}
			}
		}
	}

	function solveCollision(e1: Entity, e2: Entity) {
		const dx = e1.x - e2.x;
		const dy = e1.y - e2.y;
		const distSq = dx * dx + dy * dy;
		const rSum = e1.radius + e2.radius;

		if (distSq < rSum * rSum) {
			if (distSq === 0) {
				const angle = Math.random() * Math.PI * 2;
				e1.x += Math.cos(angle) * rSum;
				e1.y += Math.sin(angle) * rSum;
				return;
			}

			const dist = Math.sqrt(distSq);
			const overlap = rSum - dist;

			const response = overlap * PHYS_CONFIG.COLLISION_RESPONSE;
			const nx = dx / dist;
			const ny = dy / dist;

			e1.x += nx * response * 0.5;
			e1.y += ny * response * 0.5;
			e2.x -= nx * response * 0.5;
			e2.y -= ny * response * 0.5;

			// Friction exchange
			const v1x = e1.x - e1.oldX;
			const v1y = e1.y - e1.oldY;
			const v2x = e2.x - e2.oldX;
			const v2y = e2.y - e2.oldY;

			const rollingFriction = PHYS_CONFIG.ROLLING_FRICTION;
			const tangentX = -ny;
			const tangentY = nx;

			const relTangentV = (v1x - v2x) * tangentX + (v1y - v2y) * tangentY;

			e1.oldX += tangentX * relTangentV * rollingFriction;
			e1.oldY += tangentY * relTangentV * rollingFriction;
			e2.oldX -= tangentX * relTangentV * rollingFriction;
			e2.oldY -= tangentY * relTangentV * rollingFriction;
		}
	}

	function updatePhysicsSubSteps(dt: number, sub_steps: number) {
		const sub_dt = dt / sub_steps;
		for (let i = sub_steps; i--;) {
			updatePhysics(sub_dt);
		}
	}

	let lastTime = 0;
	let isRunning = true;
	function loop(timestamp: number) {
		if (!isRunning) return;
		if (!lastTime) lastTime = timestamp;
		let dt = Math.min((timestamp - lastTime) / 1000, PHYS_CONFIG.MAX_FRAME_TIME);
		lastTime = timestamp;

		updatePhysicsSubSteps(dt, PHYS_CONFIG.SUBSTEPS);

		if (ctx) {
			ctx.clearRect(0, 0, SIM_WIDTH, SIM_HEIGHT);
			for (let i = 0; i < entities.length; i++) {
				const entity = entities[i];
				ctx.beginPath();
				ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
				ctx.fillStyle = entity.color;
				ctx.fill();
			}
		}
		if (isRunning) {
			rafId = requestAnimationFrame(loop);
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
		isRunning = true;
		rafId = requestAnimationFrame(loop);

		return () => {
			isRunning = false;
			cancelAnimationFrame(rafId);
		};
	});
</script>

<canvas
	bind:this={canvas}
	width={SIM_WIDTH}
	height={SIM_HEIGHT}
	class="pointer-events-none absolute inset-0 h-full w-full object-contain"
></canvas>
