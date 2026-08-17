import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxJsonSchema
} from 'rxdb';

export const attachmentSchemaLiteral = {
	title: 'attachment schema',
	description: 'describes an attachment in DoneJar',
	version: 1,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		userId: { type: ['string', 'null'] },
		noteId: { type: 'string', maxLength: 21 },
		filename: { type: 'string' },
		mimeType: { type: 'string' },
		size: { type: 'number' },
		url: { type: ['string', 'null'] },
		pinned: { type: 'boolean' },
		createdAt: { type: 'string', format: 'date-time', maxLength: 40 },
		updatedAt: { type: 'string', format: 'date-time' }
	},
	required: [
		'id',
		'userId',
		'noteId',
		'filename',
		'mimeType',
		'size',
		'url',
		'pinned',
		'createdAt',
		'updatedAt'
	],
	indexes: ['noteId', ['noteId', 'createdAt']]
} as const;

const _attachmentSchemaTyped = toTypedRxJsonSchema(attachmentSchemaLiteral);

export type AttachmentDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
	typeof _attachmentSchemaTyped
>;
export const attachmentSchema: RxJsonSchema<AttachmentDocType> = attachmentSchemaLiteral;
