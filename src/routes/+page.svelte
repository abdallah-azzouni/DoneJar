<script lang="ts">
	import 'doodle.css/doodle.css';
	import { isLoaded } from '$lib/stores/userData';
	import Loading from '$lib/components/Loading.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	import heroImage from '$lib/assets/landing/hero.png';
	import howItWorksStep1 from '$lib/assets/landing/step1.png';
	import howItWorksStep2 from '$lib/assets/landing/step2.gif';
	import howItWorksStep3 from '$lib/assets/landing/step3.gif';
	import featureDragDrop from '$lib/assets/landing/drag-drop.png';
	import featureBeaker from '$lib/assets/landing/beaker.png';
	import featureProjects from '$lib/assets/landing/projects.gif';
</script>

{#if !$isLoaded}
	<Loading />
{:else}
	<div class="min-h-screen bg-gradient-to-b from-amber-50 to-white">
		<!-- Hero Section -->
		<section class="container mx-auto px-6 py-20 md:py-32">
			<div class="flex flex-col items-center text-center">
				<h1 class="mb-6 font-patrick-hand text-6xl font-bold text-gray-900 md:text-8xl">DoneJar</h1>
				<p class="mb-4 max-w-3xl font-patrick-hand text-3xl text-gray-700 md:text-5xl">
					Turn Completed Tasks Into Satisfaction
				</p>
				<p class="mb-12 max-w-2xl text-xl text-gray-600 md:text-2xl">
					Make task tracking enjoyable. Watch your accomplishments fill up a virtual jar as you
					complete your to-dos.
				</p>

				<button
					onclick={() => goto(resolve('/app'))}
					class="doodle-border group relative overflow-hidden bg-yellow-400 px-12 py-4 font-patrick-hand text-3xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
				>
					Get Started
				</button>

				<div class="mt-16 w-full max-w-4xl">
					<img
						src={heroImage}
						alt="Screenshot of DoneJar app showing a kanban board with TODO, DOING, and DONE columns. The DONE column has a jar filled with colorful sticky notes representing completed tasks, creating a visual satisfaction jar."
						class="doodle-border w-full rounded-lg shadow-2xl"
					/>
				</div>
			</div>
		</section>

		<!-- How It Works Section -->
		<section class="bg-amber-50 py-20">
			<div class="container mx-auto px-6">
				<h2
					class="mb-16 text-center font-patrick-hand text-5xl font-bold text-gray-900 md:text-6xl"
				>
					How It Works
				</h2>

				<div class="grid gap-12 md:grid-cols-3">
					<!-- Step 1 -->
					<div class="flex flex-col items-center text-center">
						<div
							class="doodle-border mb-6 flex h-20 w-20 items-center justify-center bg-blue-400 font-patrick-hand text-4xl font-bold text-white"
						>
							1
						</div>
						<img
							src={howItWorksStep1}
							alt="Screenshot showing a user creating a new sticky note task by clicking the plus button in the TODO column"
							class="doodle-border mb-6 h-full w-full rounded-lg object-contain shadow-lg"
						/>
						<h3 class="mb-3 font-patrick-hand text-3xl font-bold text-gray-900">
							Create Your Tasks
						</h3>
						<p class="text-lg text-gray-600">
							Add your to-dos as colorful sticky notes in your TODO column
						</p>
					</div>

					<!-- Step 2 -->
					<div class="flex flex-col items-center text-center">
						<div
							class="doodle-border mb-6 flex h-20 w-20 items-center justify-center bg-green-400 font-patrick-hand text-4xl font-bold text-white"
						>
							2
						</div>
						<img
							src={howItWorksStep2}
							alt="Screenshot showing a sticky note being dragged from TODO to DOING column with a smooth animation"
							class="doodle-border mb-6 h-full w-full rounded-lg object-contain shadow-lg"
						/>
						<h3 class="mb-3 font-patrick-hand text-3xl font-bold text-gray-900">Drag & Drop</h3>
						<p class="text-lg text-gray-600">
							Move tasks through TODO, DOING, and DONE with simple drag and drop
						</p>
					</div>

					<!-- Step 3 -->
					<div class="flex flex-col items-center text-center">
						<div
							class="doodle-border mb-6 flex h-20 w-20 items-center justify-center bg-purple-400 font-patrick-hand text-4xl font-bold text-white"
						>
							3
						</div>
						<img
							src={howItWorksStep3}
							alt="Screenshot of a jar filling up with colorful crumpled paper notes as tasks are completed, showing visual progress and satisfaction"
							class="doodle-border mb-6 h-full w-full rounded-lg object-contain shadow-lg"
						/>
						<h3 class="mb-3 font-patrick-hand text-3xl font-bold text-gray-900">
							Watch Your Jar Fill
						</h3>
						<p class="text-lg text-gray-600">
							See your accomplishments pile up in a satisfying jar visualization
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section class="py-20">
			<div class="container mx-auto px-6">
				<h2
					class="mb-16 text-center font-patrick-hand text-5xl font-bold text-gray-900 md:text-6xl"
				>
					Why You'll Love It
				</h2>

				<div class="grid gap-12 md:grid-cols-3">
					<!-- Feature 1 -->
					<div class="doodle-border relative bg-white p-8 shadow-lg">
						<img
							src={featureDragDrop}
							alt="Illustration of sticky notes being dragged between columns with smooth animations and intuitive gestures"
							class=" mb-6 h-75 rounded-lg object-contain"
						/>
						<h3 class=" mb-3 font-patrick-hand text-3xl font-bold text-gray-900">
							Intuitive Drag & Drop
						</h3>
						<p class="mb-6 text-lg text-gray-600">
							Managing tasks feels natural and fun. No complicated menus or settings—just drag and
							drop.
						</p>
					</div>

					<!-- Feature 2 -->
					<div class="doodle-border items-center bg-white p-8 shadow-lg">
						<center>
							<img
								src={featureBeaker}
								alt="Close-up of the jar physics simulation showing colorful crumpled notes falling and stacking with realistic physics"
								class="mb-6 h-75 rounded-lg object-contain"
							/>
						</center>
						<h3 class="mb-3 font-patrick-hand text-3xl font-bold text-gray-900">
							Visual Satisfaction
						</h3>
						<p class="text-lg text-gray-600">
							Watch your completed tasks accumulate in a jar with delightful physics. Feel the
							progress!
						</p>
					</div>

					<!-- Feature 3 -->
					<div class="doodle-border bg-white p-8 shadow-lg">
						<img
							src={featureProjects}
							alt="Screenshot showing multiple project tabs with different colors, demonstrating organized project management"
							class="mb-6 h-75 object-contain not-last-of-type:rounded-lg"
						/>
						<h3 class="mb-3 font-patrick-hand text-3xl font-bold text-gray-900">
							Multiple Projects
						</h3>
						<p class="text-lg text-gray-600">
							Organize work, personal life, and side projects separately. Keep everything in one
							place.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Testimonial Section
	<section class="bg-amber-50 py-20">
		<div class="container mx-auto px-6">
			<div class="doodle-border mx-auto max-w-3xl bg-white p-12 text-center shadow-xl">
				<p class="mb-6 font-patrick-hand text-3xl text-gray-700 italic">
					"Finally, a to-do app that doesn't feel like work. Watching my jar fill up keeps me
					motivated!"
				</p>
				<p class="text-xl font-semibold text-gray-900">— Sarah K., Freelance Designer</p>
			</div>
		</div>
	</section> -->

		<!-- Final CTA Section -->
		<section class="py-20">
			<div class="container mx-auto px-6 text-center">
				<h2 class="mb-6 font-patrick-hand text-5xl font-bold text-gray-900 md:text-6xl">
					Ready to Make Task Tracking Fun?
				</h2>
				<p class="mb-10 text-2xl text-gray-600">
					Start filling your jar today. It's free to get started.
				</p>
				<button
					onclick={() => goto(resolve('/app'))}
					class="doodle-border group relative overflow-hidden bg-yellow-400 px-12 py-4 font-patrick-hand text-3xl font-bold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-yellow-500"
				>
					Get Started
				</button>
			</div>
		</section>

		<!-- Footer -->
		<footer class="border-t-2 border-gray-300 bg-gray-50 py-12">
			<div class="container mx-auto px-6">
				<div class="flex flex-col items-center justify-between md:flex-row">
					<p class="mb-4 font-patrick-hand text-2xl text-gray-600 md:mb-0">© 2026 DoneJar</p>
					<div class="flex gap-8">
						<a
							href="https://github.com/abdallah-azzouni/DoneJar"
							target="_blank"
							rel="noopener noreferrer"
							class="font-patrick-hand text-xl text-gray-600 transition-colors hover:text-gray-900"
						>
							GitHub
						</a>
						<button
							onclick={() => goto(resolve('/app'))}
							class="font-patrick-hand text-xl text-gray-600 transition-colors hover:text-gray-900"
						>
							Get Started
						</button>
					</div>
				</div>
			</div>
		</footer>
	</div>
{/if}
