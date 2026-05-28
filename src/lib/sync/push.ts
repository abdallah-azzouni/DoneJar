import { guardSync } from '$lib/pb/auth';
import { upsert, fetchRecordById } from '$lib/pb/pbRepository';
import { unsyncedItemsStore } from '$lib/stores/unsyncedStore';
import {
	projectRepository,
	columnRepository,
	noteRepository,
	attachmentRepository,
	deletedLogRepository
} from '$lib/db/dal';

import {
	ProjectSchema,
	ColumnSchema,
	NoteSchema,
	attachmentSchema,
	deletedLogSchema,
	success
} from '$lib/types';
import { get } from 'svelte/store';

async function pushRecord<
	T extends {
		id: string;
		version?: number | null;
		synced: number;
		updatedAt?: number;
		localBlob?: unknown;
		file?: unknown;
		url?: unknown;
	}
>(
	collection: string,
	localItem: T,
	localRepo: { update: (item: T) => Promise<void> },
	parse: (raw: unknown) => T
) {
	if (collection === 'attachments') {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { localBlob, url, ...rest } = localItem;
		localItem = { ...rest, file: localItem.localBlob } as T;
	}

	const nextVersion = (localItem.version ?? 0) + 1;
	try {
		await upsert(collection, localItem.id, { ...localItem, version: nextVersion });

		await localRepo.update({
			...localItem,
			version: nextVersion,
			synced: 1
		});
	} catch (error) {
		const e = error as { status?: number };
		if (e?.status === 409) {
			const raw = await fetchRecordById(collection, localItem.id);
			const serverItem = parse(raw);

			if (!serverItem) {
				throw new Error(
					`${collection} with id ${localItem.id} not found on server during conflict resolution`
				);
			}

			if (
				serverItem.updatedAt &&
				localItem.updatedAt &&
				serverItem.updatedAt > localItem.updatedAt
			) {
				await localRepo.update({ ...serverItem, synced: 1 });
			} else {
				await upsert(collection, localItem.id, {
					...localItem,
					version: nextVersion
				});
				await localRepo.update({ ...localItem, version: nextVersion, synced: 1 });
			}
		} else {
			throw error;
		}
	}
}

export async function push() {
	try {
		const guard = guardSync();
		if (guard.type === 'error') throw new Error(`Cannot push data to server: ${guard.message}`);

		const data = get(unsyncedItemsStore);

		if (Object.values(data).every((items) => items.length === 0)) {
			return success('No local changes to push');
		}

		// projects
		for (const project of data.projects) {
			await pushRecord(
				'projects',
				project,
				{
					update: async (item) => {
						await projectRepository.update(item);
					}
				},
				(raw) => ProjectSchema.parse(raw)
			);
		}

		// columns
		for (const column of data.columns) {
			await pushRecord(
				'columns',
				column,
				{
					update: async (item) => {
						await columnRepository.update(item);
					}
				},
				(raw) => ColumnSchema.parse(raw)
			);
		}

		// notes
		for (const note of data.notes) {
			await pushRecord(
				'notes',
				note,
				{
					update: async (item) => {
						await noteRepository.update(item);
					}
				},
				(raw) => NoteSchema.parse(raw)
			);
		}

		// attachments
		for (const attachment of data.attachments) {
			await pushRecord(
				'attachments',
				attachment,
				{
					update: async (item) => {
						await attachmentRepository.update(item);
					}
				},
				(raw) => attachmentSchema.parse(raw)
			);
		}

		// deleted logs
		for (const log of data.deletedLogs) {
			await pushRecord(
				'deleted_logs',
				log,
				{
					update: async (item) => {
						await deletedLogRepository.update(item);
					}
				},
				(raw) => deletedLogSchema.parse(raw)
			);
		}
	} catch (error) {
		throw new Error(`Push failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
