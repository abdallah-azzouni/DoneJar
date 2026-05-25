import { pb } from '$lib/pb/pb';
import { failure, success, type ActionResult } from '$lib/types';
import {
	projectRepository,
	columnRepository,
	noteRepository,
	attachmentRepository
} from '$lib/db/dal';

export async function getUserServerVersion(): Promise<number | null> {
	const guard = guardSync();
	if (guard.type === 'error') throw new Error(`Cannot get user server version: ${guard.message}`);
	try {
		if (!pb.authStore.record?.id) throw new Error('User not found');

		const record = await pb
			.collection('users')
			.getOne(pb.authStore.record.id, { fields: 'serverVersion' });
		return record.serverVersion;
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : 'Unknown error while fetching user server version'
		);
	}
}
export function guardSync(): ActionResult {
	if (typeof navigator !== 'undefined' && !navigator.onLine) return failure('offline');
	if (!pb.authStore.isValid) return failure('unauthenticated');
	return success('ok');
}

async function fetchServerData() {
	const [projects, columns, notes, attachments, deletedLogs] = await Promise.all([
		pb.collection('projects').getFullList(),
		pb.collection('columns').getFullList(),
		pb.collection('notes').getFullList(),
		pb.collection('attachments').getFullList(),
		pb.collection('deleted_logs').getFullList()
	]);
	return { projects, columns, notes, attachments, deletedLogs };
}

async function getUpdatedEntities<T extends { id: string; version?: number }>(
	rawItems: T[],
	repository: {
		getBulkByIds: (ids: string[]) => Promise<({ id: string; version?: number | null } | null)[]>;
	}
) {
	const localItems = await repository.getBulkByIds(rawItems.map((i) => i.id));

	const localMap = new Map(localItems.filter(Boolean).map((i) => [i!.id, i!.version ?? 0]));

	return rawItems.filter((item) => (localMap.get(item.id) ?? 0) < (item.version ?? 0));
}

// function will get all data from server if the collection.version higher than local,
export async function getAllDataFromServer() {
	const guard = guardSync();
	if (guard.type === 'error') throw new Error(`Cannot get data from server: ${guard.message}`);

	try {
		const serverData = await fetchServerData();

		const [projects, columns, notes, attachments] = await Promise.all([
			getUpdatedEntities(serverData.projects, projectRepository),
			getUpdatedEntities(serverData.columns, columnRepository),
			getUpdatedEntities(serverData.notes, noteRepository),
			getUpdatedEntities(serverData.attachments, attachmentRepository)
		]);

		return {
			projects: projects,
			columns: columns,
			notes: notes,
			attachments: attachments,
			deletedLogs: serverData.deletedLogs
		};
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : 'Unknown error while fetching data from server'
		);
	}
}
