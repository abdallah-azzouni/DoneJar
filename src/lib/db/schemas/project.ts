import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxJsonSchema
} from 'rxdb';

import { MAX_PROJECT_NAME_LENGTH } from '$lib/constants';
import { HEX_COLOR_REGEX } from '$lib/constants';

export const projectSchemaLiteral = {
	title: 'project schema',
	description: 'describes a project in DoneJar',
	version: 0,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		name: { type: 'string', maxLength: MAX_PROJECT_NAME_LENGTH },
		type: { type: 'string', enum: ['default', 'blank', 'custom'] },
		color: { type: 'string', pattern: HEX_COLOR_REGEX.source },
		createdAt: { type: 'string', format: 'date-time' },
		updatedAt: { type: 'string', format: 'date-time' }
	},
	required: ['id', 'name', 'type', 'color', 'createdAt', 'updatedAt'],
	indexes: [] // to be add when i have queries that need it
} as const;

const _projectSchemaTyped = toTypedRxJsonSchema(projectSchemaLiteral);

export type ProjectDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof _projectSchemaTyped>;
export const projectSchema: RxJsonSchema<ProjectDocType> = projectSchemaLiteral;
