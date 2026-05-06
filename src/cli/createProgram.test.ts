import { describe, expect, it } from 'vitest'

import { createProgram } from './createProgram.js'

describe('createProgram', () => {
	it('prints the package version for --version', () => {
		let output = ''
		const program = createProgram('2.10.0')
		program.exitOverride()
		program.configureOutput({
			writeOut: value => {
				output += value
			},
			writeErr: value => {
				output += value
			},
		})

		expect(() => program.parse(['node', 'surql-gen', '--version'])).toThrow()
		expect(output.trim()).toBe('2.10.0')
	})

	it('parses SDK and SurrealDB version flags as numbers', () => {
		const program = createProgram('2.10.0')

		program.parse(['node', 'surql-gen', '--sdkVersion', '2', '--surrealdbVersion', '3'])

		expect(program.opts()).toMatchObject({
			sdkVersion: 2,
			surrealdbVersion: 3,
		})
	})
})
