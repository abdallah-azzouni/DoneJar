import { dev } from '$app/environment';
import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb/plugins/core';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { projectSchema, columnSchema, noteSchema, attachmentSchema } from '$lib/db/schemas';
import { DB_NAME } from '$lib/constants';

// Plugins
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';

// Wrappers
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';

// plugins
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBCleanupPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);

let dbPromise: Promise<RxDatabase> | null = null;

const _create = async () => {
	if (dev) {
		const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
		addRxPlugin(RxDBDevModePlugin);
	}
	const dexieStorage = getRxStorageDexie();
	const compressedStorage = wrappedKeyCompressionStorage({ storage: dexieStorage });
	let finalStorage = compressedStorage;
	if (dev) {
		const { wrappedValidateAjvStorage } = await import('rxdb/plugins/validate-ajv');
		finalStorage = wrappedValidateAjvStorage({ storage: compressedStorage });
	}

	const db = await createRxDatabase({
		name: DB_NAME,
		storage: finalStorage,
		closeDuplicates: true,
		cleanupPolicy: {
			minimumDeletedTime: 1000 * 60 * 60 * 24 * 31, // 31 days
			minimumCollectionAge: 1000 * 60, // 1 minute
			awaitReplicationsInSync: true
		}
	});
	// Collections
	await db.addCollections({
		projects: { schema: projectSchema },
		columns: { schema: columnSchema },
		notes: { schema: noteSchema },
		attachments: { schema: attachmentSchema }
	});

	return db;
};

export const db = (): Promise<RxDatabase> => {
	if (!dbPromise) dbPromise = _create();
	return dbPromise;
};
