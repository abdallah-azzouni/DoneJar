import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxJsonSchema
} from 'rxdb';

export const columnSchemaLiteral = {
	title: 'column schema',
	description: 'describes a column in DoneJar',
	version: 0,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		projectId: { type: 'string', maxLength: 21 },
		name: { type: 'string' },
		sortKey: { type: 'string' },
		filters: {
			type: 'object',
			additionalProperties: {
				type: 'array',
				items: { type: 'string' }
			}
		},
		position: { type: 'number' },
		specialType: { type: 'string', enum: ['jar', 'inbox'] }
	},
	required: ['id', 'projectId', 'name', 'position'],
	indexes: [] // to be add when i have queries that need it
} as const;

const _columnSchemaTyped = toTypedRxJsonSchema(columnSchemaLiteral);

export type ColumnDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof _columnSchemaTyped>;
export const columnSchema: RxJsonSchema<ColumnDocType> = columnSchemaLiteral;
