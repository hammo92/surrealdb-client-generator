import { describe, expect, it } from 'vitest'

import type { Config } from '../config/types.js'
import { prepareTemporaryNamespace } from './db.js'

describe('prepareTemporaryNamespace', () => {
	it('defines namespace and database before selecting both', async () => {
		const calls: string[] = []
		const db = {
			query: async (query: string) => {
				calls.push(`query:${query}`)
			},
			use: async (selection: { namespace: string; database?: string }) => {
				calls.push(`use:${selection.namespace}:${selection.database ?? ''}`)
			},
		}
		const config = {
			ns: 'test',
			db: 'test',
		} as Config

		await prepareTemporaryNamespace(db, config)

		expect(calls).toEqual(['query:DEFINE NAMESPACE test', 'use:test:', 'query:DEFINE DATABASE test', 'use:test:test'])
	})
})
