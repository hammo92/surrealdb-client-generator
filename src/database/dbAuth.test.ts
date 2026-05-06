import { describe, expect, it } from 'vitest'

import type { Config } from '../config/types.js'
import { authenticateDb } from './db.js'

describe('authenticateDb', () => {
	const config = {
		username: 'root',
		password: 'root',
		ns: 'test',
		db: 'test',
	} as Config

	it('signs in before selecting namespace and database', async () => {
		const calls: string[] = []
		const db = {
			signin: async () => {
				calls.push('signin')
			},
			use: async () => {
				calls.push('use')
			},
		}

		await authenticateDb(db, config)

		expect(calls).toEqual(['signin', 'use'])
	})
})
