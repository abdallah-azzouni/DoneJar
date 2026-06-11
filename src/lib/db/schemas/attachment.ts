import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxJsonSchema
} from 'rxdb';

export const attachmentSchemaLiteral = {
	title: 'attachment schema',
	description: 'describes an attachment in DoneJar',
	version: 0,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		noteId: { type: 'string', maxLength: 21 },
		filename: { type: 'string' },
		mimeType: { type: 'string' },
		size: { type: 'number' },
		url: { type: 'string' },
		pinned: { type: 'boolean' },
		createdAt: { type: 'number' },
		updatedAt: { type: 'number' }
	},
	required: ['id', 'noteId', 'filename', 'mimeType', 'size', 'pinned', 'createdAt', 'updatedAt'],
	indexes: [] // to be add when i have queries that need it
} as const;

const _attachmentSchemaTyped = toTypedRxJsonSchema(attachmentSchemaLiteral);

export type AttachmentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
	typeof _attachmentSchemaTyped
>;
export const attachmentSchema: RxJsonSchema<AttachmentDocType> = attachmentSchemaLiteral;
