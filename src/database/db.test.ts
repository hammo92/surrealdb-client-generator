import { describe, expect, it } from 'vitest'

import { resolveSurrealImage } from './db.js'

describe('resolveSurrealImage', () => {
	it.each([
		[2, 'surrealdb/surrealdb:v2.6.2'],
		[3, 'surrealdb/surrealdb:v3.0.2'],
	] as const)('pins the default image for SurrealDB %s schema-file mode', (surrealdbVersion, expectedImage) => {
		expect(resolveSurrealImage('surrealdb/surrealdb:latest', surrealdbVersion)).toBe(expectedImage)
	})

	it('preserves an explicitly configured image', () => {
		expect(resolveSurrealImage('surrealdb/surrealdb:v3.0.1', 3)).toBe('surrealdb/surrealdb:v3.0.1')
	})
})
