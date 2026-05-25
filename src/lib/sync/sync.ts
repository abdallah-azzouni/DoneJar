import { syncService } from '$lib/db/dal';
import { guardSync, getUserServerVersion } from '$lib/pb/pbRepository';
import { failure, success, type ActionResult } from '$lib/types';
import { pull } from '$lib/sync/pull';
import { push } from '$lib/sync/push';

export async function sync(): Promise<ActionResult> {
	try {
		// Check if we are online and logged in
		const guard = guardSync();
		if (guard.type === 'error') return guard;

		// Check if pull is needed
		const onlineServerVersion = await getUserServerVersion();
		const localServerVersion = syncService.getServerVersion();

		// first sync locally
		if (!localServerVersion) {
			// 0 is considered null here, meaning never synced before
			return await pullAndPush(onlineServerVersion);
		}
		// first sync server-side
		if (onlineServerVersion === 0) {
			await pushWithCheck(onlineServerVersion);

			return success('Sync successful (initial push)');
		}

		// no change, skip pull
		if (onlineServerVersion === localServerVersion) {
			await pushWithCheck(onlineServerVersion);

			return success('Sync successful (no changes to pull)');
		} else {
			// server has changes, pull first to avoid conflicts, then push local changes
			return await pullAndPush(onlineServerVersion);
		}
	} catch (error) {
		return failure(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function pullAndPush(onlineServerVersion: number | null): Promise<ActionResult> {
	try {
		await pull();
		await pushWithCheck(onlineServerVersion);

		return success('Sync successful');
	} catch (error) {
		console.error('Sync failed full error:', error);
		return failure(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

async function pushWithCheck(onlineServerVersion: number | null) {
	await push();
	const newServerVersion = await getUserServerVersion();
	if ((newServerVersion || 0) > (onlineServerVersion || 0)) {
		syncService.setServerVersion(onlineServerVersion || 0); // Update local server version after successful push
	} else {
		throw new Error('Sync failed: Server version did not update after push');
	}
}
