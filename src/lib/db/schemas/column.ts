import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxJsonSchema
} from 'rxdb';

export const columnSchemaLiteral = {
	title: 'column schema',
	description: 'describes a column in DoneJar',
	version: 1,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 21 },
		userId: { type: ['string', 'null'] },
		projectId: { type: 'string', maxLength: 21 },
		name: { type: 'string' },
		sortKey: { type: ['string', 'null'] },
		filters: { type: ['string', 'null'] },
		position: { type: 'number' },
		specialType: { type: ['string', 'null'], enum: ['jar', 'inbox', null] }
	},
	required: ['id', 'userId', 'projectId', 'name', 'sortKey', 'filters', 'position', 'specialType'],
	indexes: ['projectId']
} as const;

const _columnSchemaTyped = toTypedRxJsonSchema(columnSchemaLiteral);

export type ColumnDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof _columnSchemaTyped>;
export const columnSchema: RxJsonSchema<ColumnDocType> = columnSchemaLiteral;
