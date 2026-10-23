import { deepEqual, flatClone } from 'rxdb/plugins/utils';
import { stripAttachmentsDataFromDocument } from 'rxdb';
import type { RxAttachmentData, RxConflictHandler, RxDocumentData, RxDocumentMeta } from 'rxdb';

function addAttachmentsIfNotExists<T>(d: RxDocumentData<T>): RxDocumentData<T> {
	if (!d._attachments) {
		d = flatClone(d);
		d._attachments = {};
	}
	return d;
}

export type BaseDocType = {
	description_updatedAt?: string;
	updatedAt?: string;
	_deleted: boolean;
	_attachments: { [attachmentId: string]: RxAttachmentData };
	_rev: string;
	_meta: RxDocumentMeta;
};

export const customConflictHandler: RxConflictHandler<BaseDocType> = {
	isEqual(a, b, _ctx) {
		a = addAttachmentsIfNotExists(a);
		b = addAttachmentsIfNotExists(b);

		return deepEqual(stripAttachmentsDataFromDocument(a), stripAttachmentsDataFromDocument(b));
	},
	async resolve(i) {
		const master = i.realMasterState;
		const fork = i.newDocumentState;

		// description has its own LWW if available and different
		if (
			fork.description_updatedAt &&
			master.description_updatedAt &&
			fork.description_updatedAt !== master.description_updatedAt
		) {
			return fork.description_updatedAt > master.description_updatedAt ? fork : master;
		}

		// fall back to general LWW
		return (fork.updatedAt ?? '') >= (master.updatedAt ?? '') ? fork : master;
	}
};
