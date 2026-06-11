import { toTypedRxJsonSchema, type ExtractDocumentTypeFromTypedRxJsonSchema } from 'rxdb';
import {
	projectSchemaLiteral,
	columnSchemaLiteral,
	noteSchemaLiteral,
	attachmentSchemaLiteral
} from '$lib/db/schemas/index';

export const backupSchemaLiteral = {
	title: 'backup schema',
	description: 'describes the structure of a backup file in DoneJar',
	version: 0,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		projects: { type: 'array', items: projectSchemaLiteral },
		columns: { type: 'array', items: columnSchemaLiteral },
		notes: { type: 'array', items: noteSchemaLiteral },
		attachments: { type: 'array', items: attachmentSchemaLiteral },
		blobs: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					attachmentId: { type: 'string', maxLength: 21 },
					data: { type: 'string' }
				},
				required: ['attachmentId', 'data']
			}
		}
	},
	required: ['projects', 'columns', 'notes', 'attachments', 'blobs']
} as const;

const _backupSchemaTyped = toTypedRxJsonSchema(backupSchemaLiteral);
export type BackupDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof _backupSchemaTyped>;
