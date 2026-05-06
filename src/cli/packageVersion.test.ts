import { describe, expect, it } from 'vitest'

import packageJson from '../../package.json'
import { packageVersion } from './packageVersion.js'

describe('packageVersion', () => {
	it('matches package.json', () => {
		expect(packageVersion).toBe(packageJson.version)
	})
})
