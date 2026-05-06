import { describe, expect, it } from 'vitest'
import { configFileSchema } from './configFileSchema.js'

describe('configFileSchema', () => {
	it('defaults sdkVersion to 1', () => {
		const config = configFileSchema.parse({})
		expect(config.sdkVersion).toBe(1)
	})

	it('defaults surrealdbVersion to 2', () => {
		const config = configFileSchema.parse({})
		expect(config.surrealdbVersion).toBe(2)
	})

	it('accepts sdkVersion 1', () => {
		const config = configFileSchema.parse({ sdkVersion: 1 })
		expect(config.sdkVersion).toBe(1)
	})

	it('accepts sdkVersion 2', () => {
		const config = configFileSchema.parse({ sdkVersion: 2 })
		expect(config.sdkVersion).toBe(2)
	})

	it('accepts surrealdbVersion 2', () => {
		const config = configFileSchema.parse({ surrealdbVersion: 2 })
		expect(config.surrealdbVersion).toBe(2)
	})

	it('accepts surrealdbVersion 3', () => {
		const config = configFileSchema.parse({ surrealdbVersion: 3 })
		expect(config.surrealdbVersion).toBe(3)
	})

	it('rejects invalid sdkVersion', () => {
		expect(() => configFileSchema.parse({ sdkVersion: 3 })).toThrow()
	})

	it('rejects invalid surrealdbVersion', () => {
		expect(() => configFileSchema.parse({ surrealdbVersion: 1 })).toThrow()
	})

	it('preserves all existing defaults', () => {
		const config = configFileSchema.parse({})
		expect(config.surreal).toBe('memory')
		expect(config.db).toBe('test')
		expect(config.ns).toBe('test')
		expect(config.username).toBe('root')
		expect(config.password).toBe('root')
		expect(config.outputFolder).toBe('client_generated')
		expect(config.generateClient).toBe(true)
		expect(config.surrealImage).toBe('surrealdb/surrealdb:latest')
	})
})
