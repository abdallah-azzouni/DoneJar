import {
	toTypedRxJsonSchema,
	type ExtractDocumentTypeFromTypedRxJsonSchema,
	type RxJsonSchema
} from 'rxdb';

export const projectMemberSchemaLiteral = {
	title: 'project member schema',
	description: 'describes a project member in DoneJar',
	version: 0,
	keyCompression: true,
	primaryKey: 'id',
	type: 'object',
	properties: {
		id: { type: 'string', maxLength: 36 },
		projectId: { type: 'string', maxLength: 36 },
		userId: { type: 'string', maxLength: 36 },
		role: { type: 'string' },
		createdAt: { type: 'string', format: 'date-time' },
		updatedAt: { type: 'string', format: 'date-time' }
	},
	required: ['id', 'projectId', 'userId', 'role', 'createdAt', 'updatedAt'],
	indexes: [['projectId', 'userId'], 'projectId']
} as const;

const _projectMemberSchemaTyped = toTypedRxJsonSchema(projectMemberSchemaLiteral);

export type ProjectMemberDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
	typeof _projectMemberSchemaTyped
>;
export const projectMemberSchema: RxJsonSchema<ProjectMemberDocType> = projectMemberSchemaLiteral;
