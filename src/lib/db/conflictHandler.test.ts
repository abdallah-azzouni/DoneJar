import { describe, expect, it } from 'vitest';
import { customConflictHandler, type BaseDocType } from './conflictHandler';

describe('customConflictHandler', () => {
	it('prefers the fork when its description timestamp is newer', async () => {
		const master = {
			updatedAt: '2026-01-01',
			description_updatedAt: '2026-01-01'
		} as BaseDocType;

		const fork = {
			updatedAt: '2026-01-02',
			description_updatedAt: '2026-01-03'
		} as BaseDocType;

		const input = {
			realMasterState: master,
			newDocumentState: fork
		} as Parameters<typeof customConflictHandler.resolve>[0];

		const result = await customConflictHandler.resolve(input, 'test');

		expect(result).toEqual(fork);
	});

	it('prefers the master when its description timestamp is newer', async () => {
		const master = {
			updatedAt: '2026-01-01',
			description_updatedAt: '2026-01-03'
		} as BaseDocType;

		const fork = {
			updatedAt: '2026-01-04',
			description_updatedAt: '2026-01-02'
		} as BaseDocType;

		const input = {
			realMasterState: master,
			newDocumentState: fork
		} as Parameters<typeof customConflictHandler.resolve>[0];

		const result = await customConflictHandler.resolve(input, 'test');

		expect(result).toEqual(master);
	});

	it('falls back to updatedAt when the description rule does not apply', async () => {
		const master = {
			updatedAt: '2026-01-01'
		} as BaseDocType;

		const fork = {
			updatedAt: '2026-01-02'
		} as BaseDocType;

		const input = {
			realMasterState: master,
			newDocumentState: fork
		} as Parameters<typeof customConflictHandler.resolve>[0];

		const result = await customConflictHandler.resolve(input, 'test');

		expect(result).toEqual(fork);
	});

	it('falls back to updatedAt when the description timestamp is same', async () => {
		const master = {
			updatedAt: '2026-01-01',
			description_updatedAt: '2026-01-03'
		} as BaseDocType;

		const fork = {
			updatedAt: '2026-01-04',
			description_updatedAt: '2026-01-03'
		} as BaseDocType;

		const input = {
			realMasterState: master,
			newDocumentState: fork
		} as Parameters<typeof customConflictHandler.resolve>[0];

		const result = await customConflictHandler.resolve(input, 'test');

		expect(result).toEqual(fork);
	});

	it('prefers the fork when updatedAt timestamps are equal', async () => {
		const master = {
			updatedAt: '2026-01-01'
		} as BaseDocType;

		const fork = {
			updatedAt: '2026-01-01'
		} as BaseDocType;

		const input = {
			realMasterState: master,
			newDocumentState: fork
		} as Parameters<typeof customConflictHandler.resolve>[0];

		const result = await customConflictHandler.resolve(input, 'test');

		expect(result).toEqual(fork);
	});

	it('falls back to updatedAt when only fork has description_updatedAt', async () => {
		const master = { updatedAt: '2026-01-03' } as BaseDocType;
		const fork = { updatedAt: '2026-01-01', description_updatedAt: '2026-01-05' } as BaseDocType;

		// fork has newer description but master should win on updatedAt
		const input = {
			realMasterState: master,
			newDocumentState: fork
		} as Parameters<typeof customConflictHandler.resolve>[0];

		const result = await customConflictHandler.resolve(input, 'test');

		expect(result).toEqual(master);
	});
});
