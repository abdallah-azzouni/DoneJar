import { deepEqual, flatClone } from 'rxdb/plugins/utils';
import { stripAttachmentsDataFromDocument } from 'rxdb';
import type { RxConflictHandler, RxDocumentData } from 'rxdb';

function addAttachmentsIfNotExists<T>(d: RxDocumentData<T>): RxDocumentData<T> {
	if (!d._attachments) {
		d = flatClone(d);
		d._attachments = {};
	}
	return d;
}

export const customConflictHandler: RxConflictHandler<any> = {
	isEqual(a, b, _ctx) {
		a = addAttachmentsIfNotExists(a);
		b = addAttachmentsIfNotExists(b);

		return deepEqual(stripAttachmentsDataFromDocument(a), stripAttachmentsDataFromDocument(b));
	},
	resolve(i) {
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
