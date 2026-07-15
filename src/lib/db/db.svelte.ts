import { dev } from '$app/environment';
import { addRxPlugin, createRxDatabase, type RxDatabase } from 'rxdb/plugins/core';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { projectSchema, columnSchema, noteSchema, attachmentSchema } from '$lib/db/schemas';
import { DB_NAME } from '$lib/constants';

// Plugins
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';

import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

if (dev) {
	addRxPlugin(RxDBDevModePlugin);
}

// Wrappers
import { wrappedKeyCompressionStorage } from 'rxdb/plugins/key-compression';

// plugins
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBCleanupPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

let dbPromise: Promise<RxDatabase> | null = null;

const _create = async () => {
	const dexieStorage = getRxStorageDexie();
	const compressedStorage = wrappedKeyCompressionStorage({ storage: dexieStorage });

	const finalStorage = dev
		? wrappedValidateAjvStorage({ storage: compressedStorage })
		: compressedStorage;

	const database = await createRxDatabase({
		name: DB_NAME,
		storage: finalStorage,
		cleanupPolicy: {
			minimumDeletedTime: 1000 * 60 * 60 * 24 * 31, // 31 days
			minimumCollectionAge: 1000 * 60, // 1 minute
			awaitReplicationsInSync: true
		}
	});
	// Collections
	await database.addCollections({
		projects: { schema: projectSchema },
		columns: { schema: columnSchema },
		notes: {
			schema: noteSchema,
			migrationStrategies: {
				1: function (oldDocument) {
					if (oldDocument.tags) {
						delete oldDocument.tags;
					}
					return oldDocument;
				}
			}
		},
		attachments: { schema: attachmentSchema }
	});

	return database;
};

const dbState = $state({ ready: false });
export const isDbReady = () => dbState.ready;

// make the dbPrmoise null.
export const resetDb = () => {
	dbPromise = null;
	dbState.ready = false;
};

export const closeDb = async (): Promise<void> => {
	if (!dbPromise) return;
	try {
		const existing = await dbPromise;
		if (!existing.closed) await existing.close();
	} catch {
		// nothing live to close
	}
};

export const initDb = async (): Promise<void> => {
	if (dbPromise) return;
	dbPromise = _create().catch((err) => {
		dbPromise = null;
		throw err;
	});

	await dbPromise;
	dbState.ready = true;
};

export const db = async (): Promise<RxDatabase> => {
	if (!dbPromise) throw new Error('DB_NOT_INITIALIZED');

	const existing = await dbPromise;
	if (!existing.closed) return existing;
	console.warn('Existing DB instance was closed. Creating a new one.');
	dbPromise = null;
	dbState.ready = false;
	return dbPromise!;
};
