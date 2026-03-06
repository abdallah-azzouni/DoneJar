<script lang="ts">
	import { notification } from '$lib/stores/notificationStore';
</script>

{#if $notification}
	<div class="toast {$notification.type}">
		<span>{$notification.message}</span>
		<button onclick={() => notification.set(null)} aria-label="Dismiss">✕</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 9999;
		animation: slide-in 0.2s ease;
	}

	.error {
		background: #ff4444;
		color: white;
	}

	.success {
		background: #22c55e;
		color: white;
	}

	button {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 1rem;
		padding: 0;
		opacity: 0.8;
	}

	button:hover {
		opacity: 1;
	}

	@keyframes slide-in {
		from {
			transform: translateY(10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
