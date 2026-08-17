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
	version: 2,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		userId: { type: ['string', 'null'] },
		name: { type: 'string', maxLength: MAX_PROJECT_NAME_LENGTH },
		type: { type: 'string', enum: ['default', 'blank', 'custom'] },
		color: { type: 'string', pattern: HEX_COLOR_REGEX.source },
		maxCapacity: { type: 'number', minimum: 1, maximum: 500, default: 100 },
		createdAt: { type: 'string', format: 'date-time', maxLength: 40 },
		updatedAt: { type: 'string', format: 'date-time' }
	},
	required: ['id', 'userId', 'name', 'type', 'color', 'maxCapacity', 'createdAt', 'updatedAt'],
	indexes: ['createdAt']
} as const;

const _projectSchemaTyped = toTypedRxJsonSchema(projectSchemaLiteral);

export type ProjectDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof _projectSchemaTyped>;
export const projectSchema: RxJsonSchema<ProjectDocType> = projectSchemaLiteral;
