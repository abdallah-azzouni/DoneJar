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
	version: 0,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		columnId: { type: 'string', maxLength: 21 },
		projectId: { type: 'string', maxLength: 21 },
		title: { type: 'string', maxLength: MAX_NOTE_TITLE_LENGTH },
		tags: { type: 'string' },
		description: { type: 'string' },
		color: { type: 'string', pattern: HEX_COLOR_REGEX.source },
		dueDateHasTime: { type: 'boolean', default: false },
		dueDateTimestamp: { type: 'string', format: 'date-time' },
		priority: { type: 'string', enum: ['low', 'medium', 'high'] },
		position: { type: 'number' },
		pinned: { type: 'boolean', default: false },
		createdAt: { type: 'string', format: 'date-time' },
		updatedAt: { type: 'string', format: 'date-time' }
	},
	required: ['id', 'columnId', 'projectId', 'title', 'color', 'position', 'createdAt', 'updatedAt'],
	indexes: [] // to be add when i have queries that need it
} as const;

const _noteSchemaTyped = toTypedRxJsonSchema(noteSchemaLiteral);

export type NoteDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof _noteSchemaTyped>;
export const noteSchema: RxJsonSchema<NoteDocType> = noteSchemaLiteral;
