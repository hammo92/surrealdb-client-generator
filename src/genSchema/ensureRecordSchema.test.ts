import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { RecordId, StringRecordId } from 'surrealdb'
import { describe, expect, test } from 'vitest'
import z from 'zod'

import { ensureRecordSchema } from './ensureRecordSchema.js'

const RecordIdValue = z.union([
	z.string(),
	z.number(),
	z.bigint(),
	z.record(z.string(), z.unknown()),
	z.array(z.unknown()),
])

type RecordIdValue = z.infer<typeof RecordIdValue>

function recordId<Table extends string = string>(table?: Table) {
	const tableRegex = table ? table : '[A-Za-z_][A-Za-z0-9_]*'
	const idRegex = '[^:]+'
	const fullRegex = new RegExp(`^${tableRegex}:${idRegex}$`)

	return z
		.union([
			z
				.custom<RecordId<string>>((val): val is RecordId<string> => val instanceof RecordId)
				.refine((val): val is RecordId<Table> => !table || val.table.name === table, {
					message: table ? `RecordId must be of type '${table}'` : undefined,
				}),
			z
				.custom<StringRecordId>((val): val is StringRecordId => val instanceof StringRecordId)
				.refine(val => !table || val.toString().startsWith(`${table}:`), {
					message: table ? `StringRecordId must start with '${table}:'` : undefined,
				}),
			z.string().regex(fullRegex, {
				message: table
					? `Invalid record ID format. Must be '${table}:id'`
					: "Invalid record ID format. Must be 'table:id'",
			}),
			z.object({
				rid: z.string().regex(fullRegex),
			}),
			z
				.object({
					tb: z.string(),
					id: z.union([z.string(), z.number(), z.record(z.string(), z.unknown())]),
				})
				.refine(val => !table || val.tb === table, {
					message: table ? `RecordId must be of type '${table}'` : undefined,
				}),
		])
		.transform((val): RecordId<Table> | StringRecordId => {
			if (val instanceof RecordId) {
				return val as RecordId<Table>
			}
			if (val instanceof StringRecordId) {
				return val
			}
			if (typeof val === 'string') {
				const [tb, ...idParts] = val.split(':')
				const id = idParts.join(':')
				if (!tb || !id) throw new Error('Invalid record ID string format')
				return new StringRecordId(val)
			}
			if ('rid' in val) {
				const [tb, ...idParts] = val.rid.split(':')
				const id = idParts.join(':')
				if (!tb || !id) throw new Error('Invalid rid object format')
				return new StringRecordId(val.rid)
			}
			if ('tb' in val && 'id' in val) {
				return new RecordId(val.tb, val.id) as RecordId<Table>
			}
			throw new Error('Invalid input for RecordId')
		})
}

describe('recordId type tests', () => {
	const createRecordId = (tb: string, id: RecordIdValue) => new RecordId(tb, id)
	const createStringRecordId = (tb: string, id: RecordIdValue) => {
		const idStr = typeof id === 'object' ? JSON.stringify(id) : String(id)
		return new StringRecordId(`${tb}:${idStr}`)
	}

	test('Valid simple RecordId', () => {
		const schema = recordId()
		const result = schema.safeParse(createRecordId('internet', 'test'))
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('internet')
				expect(result.data.id).toBe('test')
			} else {
				expect(result.data.toString()).toBe('internet:test')
			}
		}
	})

	test('Valid simple StringRecordId', () => {
		const schema = recordId()
		const result = schema.safeParse(createStringRecordId('internet', 'test'))
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('internet')
				expect(result.data.id).toBe('test')
			} else {
				expect(result.data.toString()).toBe('internet:test')
			}
		}
	})

	test('Valid simple string', () => {
		const schema = recordId()
		const result = schema.safeParse('internet:test')
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('internet')
				expect(result.data.id).toBe('test')
			} else {
				expect(result.data.toString()).toBe('internet:test')
			}
		}
	})

	test('Invalid string (does not start with valid table name)', () => {
		const schema = recordId()
		const result = schema.safeParse('123invalid:test')
		expect(result.success).toBe(false)
	})

	test('Valid numeric RecordId', () => {
		const schema = recordId()
		const result = schema.safeParse(createRecordId('internet', 9000))
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('internet')
				expect(result.data.id).toBe(9000)
			} else {
				expect(result.data.toString()).toBe('internet:9000')
			}
		}
	})

	test('Valid numeric StringRecordId', () => {
		const schema = recordId()
		const result = schema.safeParse(createStringRecordId('internet', 9000))
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('internet')
				expect(result.data.id).toBe('9000')
			} else {
				expect(result.data.toString()).toBe('internet:9000')
			}
		}
	})

	test('Valid object-based RecordId', () => {
		const schema = recordId()
		const objId = { location: 'London', date: new Date().toISOString() }
		const result = schema.safeParse(createRecordId('temperature', objId))
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('temperature')
				expect(result.data.id).toEqual(objId)
			} else {
				expect(result.data.toString()).toBe(`temperature:${JSON.stringify(objId)}`)
			}
		}
	})

	test('Valid object-based StringRecordId', () => {
		const schema = recordId()
		const objId = { location: 'London', date: new Date().toISOString() }
		const result = schema.safeParse(createStringRecordId('temperature', objId))
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('temperature')
				expect(result.data.id).toBe(JSON.stringify(objId))
			} else {
				expect(result.data.toString()).toBe(`temperature:${JSON.stringify(objId)}`)
			}
		}
	})

	test('Valid object with tb and id', () => {
		const schema = recordId()
		const result = schema.safeParse({ tb: 'internet', id: 9000 })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('internet')
				expect(result.data.id).toBe(9000)
			} else {
				expect(result.data.toString()).toBe('internet:9000')
			}
		}
	})

	test('Valid object with rid', () => {
		const schema = recordId()
		const result = schema.safeParse({ rid: 'internet:9000' })
		expect(result.success).toBe(true)
		if (result.success) {
			expect(result.data instanceof RecordId || result.data instanceof StringRecordId).toBe(true)
			if (result.data instanceof RecordId) {
				expect(result.data.table.name).toBe('internet')
				expect(result.data.id).toBe('9000')
			} else {
				expect(result.data.toString()).toBe('internet:9000')
			}
		}
	})

	test('Invalid record ID (not a valid string format)', () => {
		const schema = recordId()
		const result = schema.safeParse('invalidstring')
		expect(result.success).toBe(false)
	})

	test('Invalid RecordId with wrong table', () => {
		const schema = recordId('internet')
		const result = schema.safeParse(createRecordId('users', 'test'))
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("RecordId must be of type 'internet'")
		}
	})

	test('Invalid StringRecordId with wrong table', () => {
		const schema = recordId('internet')
		const result = schema.safeParse(createStringRecordId('users', 'test'))
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("StringRecordId must start with 'internet:'")
		}
	})

	test('Invalid string with wrong table', () => {
		const schema = recordId('internet')
		const result = schema.safeParse('users:test')
		expect(result.success).toBe(false)
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("Invalid record ID format. Must be 'internet:id'")
		}
	})
})

describe('ensureRecordSchema', () => {
	test('emits Zod 4 compatible record schemas', async () => {
		const tempDir = await mkdtemp(resolve(tmpdir(), 'surql-gen-record-schema-'))
		try {
			await ensureRecordSchema(tempDir, 'surrealdb', 2)
			const content = await readFile(resolve(tempDir, 'recordSchema.ts'), 'utf-8')

			expect(content).not.toContain('z.record(z.unknown())')
			expect(content).toContain('z.record(z.string(), z.unknown())')
		} finally {
			await rm(tempDir, { recursive: true, force: true })
		}
	})
})
