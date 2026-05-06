import { getZodTypeFromQLType } from './getDetailsFromDefinition.js'
import { tokenize } from './tokenize.js'

describe('Field schema generation', () => {
	describe('number', () => {
		it('basic - z.number()', () => {
			const query = 'DEFINE FIELD numField ON TABLE example TYPE number'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'numField',
				type: 'number',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.number()')
		})

		it('optional', () => {
			const query = 'DEFINE FIELD numField ON TABLE example TYPE option<number>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'numField',
				type: 'option<number>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.number().optional()')
		})

		it('is optional for input if default is set', () => {
			const query = 'DEFINE FIELD numField ON TABLE example TYPE option<number> DEFAULT 1'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'numField',
				type: 'option<number>',
				default: '1',
			})

			expect(getZodTypeFromQLType(result, true)).toBe('z.number().optional()')
		})

		it('is required for output if default is set', () => {
			const query = 'DEFINE FIELD numField ON TABLE example TYPE option<number> DEFAULT 1'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'numField',
				type: 'option<number>',
				default: '1',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.number()')
		})

		it('handles futures', () => {
			const query = 'DEFINE FIELD numField ON TABLE example TYPE number VALUE <future> {}'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'numField',
				type: 'number',
				value: '<future> {}',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.number()')
		})
	})

	describe('string', () => {
		it('basic', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE string'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'string',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string()')
		})

		it('optional', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE option<string>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'option<string>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().optional()')
		})

		it('is optional for input if default is set', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE option<string> DEFAULT "value"'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'option<string>',
				default: '"value"',
			})

			expect(getZodTypeFromQLType(result, true)).toBe('z.string().optional()')
		})

		it('is required for output if default is set', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE option<string> DEFAULT "value"'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'option<string>',
				default: '"value"',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string()')
		})

		it('email', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE string ASSERT string::is::email($value)'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'string',
				assert: 'string::is::email($value)',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().email()')
		})

		it('url', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE string ASSERT string::is::url($value)'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'string',
				assert: 'string::is::url($value)',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().url()')
		})

		it('uuid', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE string ASSERT string::is::uuid($value)'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'string',
				assert: 'string::is::uuid($value)',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().uuid()')
		})

		it('startsWith', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE string ASSERT string::is::startsWith($value)'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'string',
				assert: 'string::is::startsWith($value)',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string()')
		})

		it('endsWith', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE string ASSERT string::is::endsWith($value)'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'string',
				assert: 'string::is::endsWith($value)',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string()')
		})

		it('datetime', () => {
			const query = 'DEFINE FIELD stringField ON TABLE example TYPE string ASSERT string::is::datetime($value)'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'stringField',
				type: 'string',
				assert: 'string::is::datetime($value)',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().datetime()')
		})
	})

	describe('bool', () => {
		it('basic', () => {
			const query = 'DEFINE FIELD boolField ON TABLE example TYPE bool'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'boolField',
				type: 'bool',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.boolean()')
		})

		it('optional', () => {
			const query = 'DEFINE FIELD boolField ON TABLE example TYPE option<bool>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'boolField',
				type: 'option<bool>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.boolean().optional()')
		})

		it('is optional for input if default is set', () => {
			const query = 'DEFINE FIELD boolField ON TABLE example TYPE option<bool> DEFAULT true'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'boolField',
				type: 'option<bool>',
				default: 'true',
			})

			expect(getZodTypeFromQLType(result, true)).toBe('z.boolean().optional()')
		})

		it('is required for output if default is set', () => {
			const query = 'DEFINE FIELD boolField ON TABLE example TYPE option<bool> DEFAULT true'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'boolField',
				type: 'option<bool>',
				default: 'true',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.boolean()')
		})
	})

	describe('object', () => {
		it('basic', () => {
			const query = 'DEFINE FIELD objectField ON TABLE example TYPE object'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'objectField',
				type: 'object',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.object({})')
		})

		it('optional', () => {
			const query = 'DEFINE FIELD objectField ON TABLE example TYPE option<object>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'objectField',
				type: 'option<object>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.object({}).optional()')
		})

		it('is optional for input if default is set', () => {
			const query = 'DEFINE FIELD objectField ON TABLE example TYPE option<object> DEFAULT {}'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'objectField',
				type: 'option<object>',
				default: '{}',
			})

			expect(getZodTypeFromQLType(result, true)).toBe('z.object({}).optional()')
		})

		it('is required for output if default is set', () => {
			const query = 'DEFINE FIELD objectField ON TABLE example TYPE option<object> DEFAULT {}'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'objectField',
				type: 'option<object>',
				default: '{}',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.object({})')
		})
	})

	describe('datetime', () => {
		it('basic', () => {
			const query = 'DEFINE FIELD datetimeField ON TABLE example TYPE datetime'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'datetimeField',
				type: 'datetime',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().datetime()')
		})

		it('optional', () => {
			const query = 'DEFINE FIELD datetimeField ON TABLE example TYPE option<datetime>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'datetimeField',
				type: 'option<datetime>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().datetime().optional()')
		})

		it('is optional for input if default is set', () => {
			const query = 'DEFINE FIELD datetimeField ON TABLE example TYPE option<datetime> DEFAULT true'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'datetimeField',
				type: 'option<datetime>',
				default: 'true',
			})

			expect(getZodTypeFromQLType(result, true)).toBe('z.string().datetime().optional()')
		})

		it('is required for output if default is set', () => {
			const query = 'DEFINE FIELD datetimeField ON TABLE example TYPE option<datetime> DEFAULT true'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'datetimeField',
				type: 'option<datetime>',
				default: 'true',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.string().datetime()')
		})
	})

	describe('array', () => {
		it('basic', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE array'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'array',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.unknown())')
		})

		it('optional', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE option<array>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'option<array>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.unknown()).optional()')
		})

		it('is optional for input if default is set', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE option<array> DEFAULT [1,2,3]'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'option<array>',
				default: '[1,2,3]',
			})

			expect(getZodTypeFromQLType(result, true)).toBe('z.array(z.unknown()).optional()')
		})

		it('is required for output if default is set', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE option<array> DEFAULT [1,2,3]'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'option<array>',
				default: '[1,2,3]',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.unknown())')
		})

		it('optional number array', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE option<array<number>>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'option<array<number>>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.number()).optional()')
		})

		it('optional string array', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE option<array<string>>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'option<array<string>>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.string()).optional()')
		})

		it('optional bool array', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE option<array<bool>>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'option<array<bool>>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.boolean()).optional()')
		})

		it('number array', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE array<number>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'array<number>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.number())')
		})

		it('string array', () => {
			const query = 'DEFINE FIELD arrayField ON TABLE example TYPE array<string>'
			const result = tokenize(query)

			expect(result).toStrictEqual({
				table: 'example',
				name: 'arrayField',
				type: 'array<string>',
			})

			expect(getZodTypeFromQLType(result, false)).toBe('z.array(z.string())')
		})
	})

	describe('COMPUTED fields', () => {
		it('parses COMPUTED clause with simple expression', () => {
			const query = 'DEFINE FIELD fullName ON TABLE user TYPE string COMPUTED string::concat(firstName, " ", lastName)'
			const result = tokenize(query)

			expect(result.name).toBe('fullName')
			expect(result.table).toBe('user')
			expect(result.type).toBe('string')
			expect(result.computed).toBe('string::concat(firstName, " ", lastName)')
		})

		it('parses COMPUTED clause without TYPE', () => {
			const query = 'DEFINE FIELD total ON TABLE order COMPUTED price * quantity'
			const result = tokenize(query)

			expect(result.name).toBe('total')
			expect(result.table).toBe('order')
			expect(result.computed).toBe('price * quantity')
		})

		it('parses COMPUTED clause with other clauses', () => {
			const query =
				'DEFINE FIELD age ON TABLE user TYPE number COMPUTED time::now() - birthday COMMENT "calculated age"'
			const result = tokenize(query)

			expect(result.name).toBe('age')
			expect(result.type).toBe('number')
			expect(result.computed).toBe('time::now() - birthday')
			expect(result.comment).toBe('"calculated age"')
		})

		it('field without COMPUTED has no computed property', () => {
			const query = 'DEFINE FIELD name ON TABLE user TYPE string'
			const result = tokenize(query)

			expect(result.computed).toBeUndefined()
		})
	})
})
