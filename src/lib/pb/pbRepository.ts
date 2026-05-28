import { pb } from '$lib/pb/pb';
import {
	projectRepository,
	columnRepository,
	noteRepository,
	attachmentRepository
} from '$lib/db/dal';
import { guardSync } from './auth';

// Meta
export async function getUserServerVersion(): Promise<number | null> {
	if (!pb.authStore.record?.id) throw new Error('User not found');
	const record = await pb
		.collection('users')
		.getOne(pb.authStore.record.id, { fields: 'serverVersion' });
	return record.serverVersion;
}

export async function setUserServerVersion(version: number): Promise<void> {
	if (!pb.authStore.record?.id) throw new Error('User not found');
	await pb.collection('users').update(pb.authStore.record.id, { serverVersion: version });
}

// Fetch delta (pull)
async function getUpdatedEntities<T extends { id: string; version?: number }>(
	rawItems: T[],
	repository: {
		getBulkByIds: (ids: string[]) => Promise<({ id: string; version?: number | null } | null)[]>;
	}
) {
	const localItems = await repository.getBulkByIds(rawItems.map((i) => i.id));
	const localMap = new Map(localItems.filter(Boolean).map((i) => [i!.id, i!.version ?? 0]));
	const t = rawItems.filter(
		(item) => !localMap.has(item.id) || localMap.get(item.id)! < (item.version ?? 0)
	);
	return t;
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
// function will get all data from server if the collection.version higher than local,
export async function getAllDataFromServer() {
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
			attachments: attachments.map((a) => ({ ...a, url: pb.files.getURL(a, a.file) })),
			deletedLogs: serverData.deletedLogs
		};
	} catch (error) {
		throw new Error(
			error instanceof Error ? error.message : 'Unknown error while fetching data from server'
		);
	}
}

// Push
export async function upsert<T extends { id: string }>(collection: string, id: string, data: T) {
	try {
		return await pb.collection(collection).update(id, { ...data, userId: pb.authStore.record?.id });
	} catch {
		console.warn(
			`Record with id ${id} not found in collection ${collection}, creating new record.`
		);
		return await pb.collection(collection).create({ ...data, id, userId: pb.authStore.record?.id });
	}
}

export const fetchRecordById = async (collection: string, id: string) => {
	try {
		return await pb.collection(collection).getOne(id);
	} catch (error) {
		console.error(`Failed to fetch record ${id} from collection ${collection}:`, error);
		return null;
	}
};

export async function getUserInfo() {
	try {
		guardSync();
	} catch (error) {
		throw new Error(`Error fetching user info: ${error}`);
	}
}
