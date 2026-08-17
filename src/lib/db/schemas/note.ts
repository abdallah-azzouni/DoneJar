import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxJsonSchema
} from 'rxdb';

import { MAX_NOTE_TITLE_LENGTH } from '$lib/constants';
import { HEX_COLOR_REGEX } from '$lib/constants';

export const noteSchemaLiteral = {
	title: 'note schema',
	description: 'describes a note in DoneJar',
	version: 3,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		userId: { type: ['string', 'null'] },
		columnId: { type: 'string', maxLength: 21 },
		title: { type: 'string', maxLength: MAX_NOTE_TITLE_LENGTH },
		description: { type: ['string', 'null'] },
		description_updatedAt: { type: ['string', 'null'], format: 'date-time' },
		color: { type: 'string', pattern: HEX_COLOR_REGEX.source },
		dueDateHasTime: { type: ['boolean', 'null'], default: false },
		dueDateTimestamp: { type: ['string', 'null'], format: 'date-time' },
		priority: { type: ['string', 'null'], enum: ['low', 'medium', 'high', null] },
		pinned: { type: ['boolean', 'null'], default: false },
		createdAt: { type: 'string', format: 'date-time' },
		updatedAt: { type: 'string', format: 'date-time' }
	},
	required: [
		'id',
		'userId',
		'columnId',
		'title',
		'description',
		'description_updatedAt',
		'color',
		'dueDateHasTime',
		'dueDateTimestamp',
		'priority',
		'pinned',
		'createdAt',
		'updatedAt'
	],
	indexes: ['columnId']
} as const;

const _noteSchemaTyped = toTypedRxJsonSchema(noteSchemaLiteral);

export type NoteDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof _noteSchemaTyped>;
export const noteSchema: RxJsonSchema<NoteDocType> = noteSchemaLiteral;
