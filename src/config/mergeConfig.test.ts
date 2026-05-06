import { describe, expect, it } from 'vitest'

import { createProgram } from '../cli/createProgram.js'
import { mergeConfig } from './mergeConfig.js'

describe('mergeConfig', () => {
	it('lets config file values override CLI defaults', () => {
		const program = createProgram('2.10.0')
		program.parse(['node', 'surql-gen'])

		const configInput = mergeConfig(program, {
			surrealdbVersion: 3,
			sdkVersion: 2,
		})

		expect(configInput.surrealdbVersion).toBe(3)
		expect(configInput.sdkVersion).toBe(2)
	})

	it('lets explicit CLI values override config file values', () => {
		const program = createProgram('2.10.0')
		program.parse(['node', 'surql-gen', '--surrealdbVersion', '3', '--sdkVersion', '2'])

		const configInput = mergeConfig(program, {
			surrealdbVersion: 2,
			sdkVersion: 1,
		})

		expect(configInput.surrealdbVersion).toBe(3)
		expect(configInput.sdkVersion).toBe(2)
	})
})
