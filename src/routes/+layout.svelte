<script lang="ts">
	import './layout.css';
	import Toast from '$lib/components/Toast.svelte';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="desktop-only-notice">
	<span style="font-size: 3rem;">🖥️</span>
	<h1 class="font-patrick-hand text-4xl font-bold text-gray-900">DoneJar is best on desktop</h1>
	<p class="max-w-md text-lg text-gray-600">
		For the full drag-and-drop experience, please visit on a device with a wider screen.
	</p>
</div>
<Toast />
{@render children()}
