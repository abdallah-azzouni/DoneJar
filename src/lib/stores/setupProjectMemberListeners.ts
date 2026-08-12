import { reSyncAll } from '$lib/sb/replication.svelte';
import { projectRepository } from '$lib/db/dal';
import { SvelteSet } from 'svelte/reactivity';
import { from, type Subscription } from 'rxjs';
import { db } from '$lib/db/db.svelte';

export async function setupProjectMemberListeners(currentUserId: string): Promise<Subscription> {
	// Listen to ALL changes (INSERT, UPDATE) happening on project_members in RxDB
	const db$ = await db();
	let lastKnownRole = new Map();
	return db$.project_members.$.subscribe(async (changeEvent) => {
		const doc = changeEvent.documentData;
		if (!doc) return;

		// -------------------------------------------------------------
		// 1. RESYNC LOGIC:
		// IMPORTANT: this manual reSyncAll() call is load-bearing, not a redundant safety net.
		// Empirically verified (July 2026): when pushModifier throws to reject a doc
		// (e.g. project-membership push guard), RxDB does NOT automatically retry
		// that push once conditions change. Tested explicitly:
		//   - pushModifier returning null: doc is silently dropped from sync, never retried.
		//   - pushModifier throwing, WITH manual reSyncAll() on membership insert: doc
		//     correctly re-offered to pushModifier and syncs.
		//   - pushModifier throwing, WITHOUT calling reSyncAll(): doc never syncs, indefinitely.
		// This may relate to known pushModifier bugs in RxDB's Supabase replication plugin
		// (see https://github.com/pubkey/rxdb/issues/7513 — push.modifier was at one point
		// not applied at all). Did not find documentation describing intended retry behavior
		// for pushModifier-thrown rejections specifically — this comment IS the documentation.
		// Do not remove this call assuming RxDB will self-heal; it won't, at least not on the
		// RxDB version tested against.
		// -------------------------------------------------------------
		if (
			(changeEvent.operation === 'INSERT' || changeEvent.operation === 'UPDATE') &&
			doc.userId === currentUserId
		) {
			const prevRole = lastKnownRole.get(doc.projectId);
			if (prevRole === doc.role) {
				return;
			}
			lastKnownRole.set(doc.projectId, doc.role);
			console.log('Membership updated for user, triggering reSyncAll...');
			scheduleResync();
		}

		// -------------------------------------------------------------
		// 2. PURGE LOGIC:
		// If current user's role changed to 'deleted' (or _deleted flag),
		// purge the local project storage.
		// -------------------------------------------------------------

		if (doc.userId === currentUserId && doc.role === 'deleted') {
			console.warn(`User removed from project ${doc.projectId}. Purging local data...`);
			await purgeDeletedMembership(doc.projectId, currentUserId);
		}
	});
}

let resyncTimeout: ReturnType<typeof setTimeout>;
function scheduleResync() {
	clearTimeout(resyncTimeout);
	resyncTimeout = setTimeout(() => {
		console.log('Triggering reSyncAll (debounced)...');
		reSyncAll();
	}, 150);
}

const activePurges = new SvelteSet<string>();
async function purgeDeletedMembership(
	projectId: string,
	userId: string
): Promise<{ success: boolean; error?: string }> {
	if (!projectId || !userId) {
		console.error('Purge aborted: Missing projectId or userId');
		return { success: false, error: 'Invalid inputs provided.' };
	}

	const lockKey = `${projectId}-${userId}`;
	if (activePurges.has(lockKey)) {
		console.warn(`Purge already in progress for key: ${lockKey}. Ignoring duplicate request.`);
		return { success: false, error: 'Operation already in progress.' };
	}
	activePurges.add(lockKey);

	try {
		await projectRepository.deleteFullProject(projectId);

		return { success: true };
	} catch (err: unknown) {
		console.error('Unexpected failure during purge:', err);
		const errorMessage = err instanceof Error ? err.message : 'Failed to purge local project data.';
		return { success: false, error: errorMessage };
	} finally {
		activePurges.delete(lockKey);
	}
}
