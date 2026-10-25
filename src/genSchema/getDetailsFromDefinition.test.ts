import { getDetailsFromDefinition } from './getDetailsFromDefinition.js'

describe('getDetailsFromDefinition', () => {
	describe('input schema', () => {
		const isInputSchema = true
		it('returns optional string for optional string without default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string>;',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns optional string for optional string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string> DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns optional string for string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE string DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns required string for string without default', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD description ON TABLE product TYPE string;', isInputSchema)

			expect(result.zodString).toBe('z.string()')
		})

		it('mark fields with value <future> as skipped', () => {
			const result = getDetailsFromDefinition(
				`DEFINE FIELD price.amount ON TABLE product TYPE number;
  VALUE <future> {
    LET $lowest_vendor = (SELECT vendors[WHERE price.amount = math::min(vendors.*.price.amount)][0] FROM this);
    $lowest_vendor.price.amount;
  };`,
				isInputSchema,
			)

			expect(result.skip).toBeTruthy()
		})

		it('adds passthrough to the schema if FLEXIBLE is set', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD metadata ON TABLE user FLEXIBLE TYPE object', isInputSchema)

			expect(result.zodString).toBe('z.object({}).passthrough()')
		})

		it('returns a array schema with item type unknown', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD list ON TABLE product TYPE array;', isInputSchema)

			expect(result.zodString).toBe('z.array(z.unknown())')
		})

		it('returns a array schema with item type array<string>', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD list ON TABLE product TYPE array<string>;', isInputSchema)

			expect(result.zodString).toBe('z.array(z.string())')
		})

		it('generates a enum schema for string', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD permissions ON acl TYPE string ASSERT INSIDE ['create', 'read', 'write', 'delete'] PERMISSIONS FULL;",
				isInputSchema,
			)

			expect(result.zodString).toBe("z.enum(['create', 'read', 'write', 'delete'])")
		})

		it('generates a enum schema for array<string>', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD permissions ON acl TYPE array<string> ASSERT ALLINSIDE ['create', 'read', 'write', 'delete'] PERMISSIONS FULL;",
				isInputSchema,
			)
			const expected = `z.array(z.enum(['create', 'read', 'write', 'delete'])).refine(
					(arr) => arr.every((item) => ['create', 'read', 'write', 'delete'].includes(item)),
					{ message: "Array items must be one of ['create', 'read', 'write', 'delete']" }
			)`
			expect(result.zodString).toEqualIgnoringWhitespace(expected)
		})

		it('generates a enum schema for array', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD permissions ON acl TYPE array ASSERT ALLINSIDE ['create', 'read', 'write', 'delete'] PERMISSIONS FULL;",
				isInputSchema,
			)
			const expected = `z.array(z.enum(['create', 'read', 'write', 'delete'])).refine(
					(arr) => arr.every((item) => ['create', 'read', 'write', 'delete'].includes(item)),
					{ message: "Array items must be one of ['create', 'read', 'write', 'delete']" }
			)`
			expect(result.zodString).toEqualIgnoringWhitespace(expected)
		})
	})

	describe('Union string literal types (enum-like)', () => {
		const isInputSchema = true // Default for most of these, can be overridden

		it('returns z.enum for basic union string literal type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE "published" | "draft" | "archived";',
				false, // isInputSchema = false for this output schema test
			)
			expect(result.name).toBe('status')
			expect(result.type).toBe('"published" | "draft" | "archived"')
			expect(result.zodString).toBe("z.enum(['published', 'draft', 'archived'])")
		})

		it('returns optional z.enum for option<union string literal type>', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft">;',
				false, // isInputSchema = false
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns optional z.enum for input schema with option<union string literal type>', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft">;',
				true, // isInputSchema = true
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns optional z.enum for input schema when union string literal type has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE "published" | "draft" DEFAULT "draft";',
				isInputSchema, // true
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns required z.enum for output schema when union string literal type has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE "published" | "draft" DEFAULT "draft";',
				false, // isInputSchema
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft'])")
		})

		it('returns optional z.enum for input schema when option<union string literal type> has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft"> DEFAULT "draft";',
				isInputSchema, // true
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('returns required z.enum for output schema when option<union string literal type> has a DEFAULT', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD status ON post TYPE option<"published" | "draft"> DEFAULT "draft";',
				false, // isInputSchema
			)
			expect(result.zodString).toBe("z.enum(['published', 'draft'])")
		})

		it('handles string literals with spaces', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD role ON user TYPE "project admin" | "content editor";',
				false,
			)
			expect(result.zodString).toBe("z.enum(['project admin', 'content editor'])")
		})

		it('handles string literals with escaped quotes', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD message ON log TYPE "value with \\"quotes\\"" | "another value";',
				false,
			)
			expect(result.zodString).toBe("z.enum(['value with \"quotes\"', 'another value'])")
		})

		it('handles string literals with other special characters if tokenizer passes them through', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD category ON item TYPE "tools/hardware" | "apparel";', false)
			expect(result.zodString).toBe("z.enum(['tools/hardware', 'apparel'])")
		})

		it('should not conflict with regular string type if not a union literal', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD name ON "user" TYPE string;', false)
			expect(result.zodString).toBe('z.string()')
		})

		it('should handle option<string> correctly and not misinterpret as enum', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD description ON "product" TYPE option<string>;', false)
			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns z.enum for basic union string literal type with single quotes', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD status ON post TYPE 'published' | 'draft' | 'archived';",
				false,
			)
			expect(result.name).toBe('status')
			expect(result.type).toBe("'published' | 'draft' | 'archived'")
			expect(result.zodString).toBe("z.enum(['published', 'draft', 'archived'])")
		})

		it('returns optional z.enum for option<union string literal type with single quotes>', () => {
			const result = getDetailsFromDefinition("DEFINE FIELD status ON post TYPE option<'published' | 'draft'>;", false)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('handles single-quoted string literals with escaped single quotes', () => {
			const result = getDetailsFromDefinition(
				"DEFINE FIELD message ON log TYPE 'value with \\'quotes\\'' | 'another value';",
				false,
			)
			expect(result.zodString).toBe("z.enum(['value with \\'quotes\\'', 'another value'])")
		})

		it('handles mixed quotes if the tokenizer allows (though SurrealDB likely expects consistency per literal)', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD mixed ON test TYPE "double_quoted" | \'single_quoted\';',
				false,
			)
			expect(result.zodString).toBe("z.enum(['double_quoted', 'single_quoted'])")
		})

		it('handles unquoted enum values', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD status ON post TYPE published | draft | archived;', false)
			expect(result.zodString).toBe("z.enum(['published', 'draft', 'archived'])")
		})

		it('handles option<unquoted enum values>', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD status ON post TYPE option<published | draft>;', false)
			expect(result.zodString).toBe("z.enum(['published', 'draft']).optional()")
		})

		it('handles union of types', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD uid ON account TYPE uuid | int;', false)
			expect(result.zodString).toBe('z.union([z.string().uuid(), z.number().int()])')
		})

		it('handles option<union of types>', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD uid ON account TYPE option<uuid | int>;', false)
			expect(result.zodString).toBe('z.union([z.string().uuid(), z.number().int()]).optional()')
		})
	})

	describe('output schema', () => {
		const isInputSchema = false
		it('returns optional string for optional string without default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string>;',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string().optional()')
		})

		it('returns a record with defined type', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD record ON TABLE product TYPE record<test>;', isInputSchema)

			expect(result.zodString).toBe(`recordId('test')`)
		})

		it('returns an array of records with defined type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD record ON TABLE product TYPE array<record<test>>;',
				isInputSchema,
			)

			expect(result.zodString).toBe(`recordId('test').array()`)
		})

		it('returns an array of records without defined types', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD record ON TABLE product TYPE array<record>;', isInputSchema)

			expect(result.zodString).toBe('recordId().array()')
		})

		it('returns an optional array of records with defined type', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD record ON TABLE product TYPE option<array<record<test>>>;',
				isInputSchema,
			)

			expect(result.zodString).toBe(`recordId('test').array().optional()`)
		})

		it('returns an optional array of records without defined types', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD record ON TABLE product TYPE option<array<record>>;',
				isInputSchema,
			)

			expect(result.zodString).toBe('recordId().array().optional()')
		})

		it('returns required string for optional string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE option<string> DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string()')
		})

		it('returns required string for string with default', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD description ON TABLE product TYPE string DEFAULT "hello";',
				isInputSchema,
			)

			expect(result.zodString).toBe('z.string()')
		})

		it('returns required string for string without default', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD description ON TABLE product TYPE string;', isInputSchema)

			expect(result.zodString).toBe('z.string()')
		})

		it('does not mark fields with value <future> as skipped', () => {
			const result = getDetailsFromDefinition(
				`DEFINE FIELD price.amount ON TABLE product TYPE number;
  VALUE <future> {
    LET $lowest_vendor = (SELECT vendors[WHERE price.amount = math::min(vendors.*.price.amount)][0] FROM this);
    $lowest_vendor.price.amount;
  };`,
				isInputSchema,
			)

			expect(result.zodString).toBe('z.number()')
			expect(result.skip).toBeFalsy()
		})

		it('adds passthrough to the schema if FLEXIBLE is set', () => {
			const result = getDetailsFromDefinition('DEFINE FIELD metadata ON TABLE user FLEXIBLE TYPE object', isInputSchema)

			expect(result.zodString).toBe('z.object({}).passthrough()')
		})
	})

	describe('COMPUTED fields', () => {
		it('skips COMPUTED fields in input schema', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD fullName ON TABLE user TYPE string COMPUTED string::concat(firstName, " ", lastName)',
				true,
			)

			expect(result.skip).toBe(true)
			expect(result.computed).toBe('string::concat(firstName, " ", lastName)')
		})

		it('does not skip COMPUTED fields in output schema', () => {
			const result = getDetailsFromDefinition(
				'DEFINE FIELD fullName ON TABLE user TYPE string COMPUTED string::concat(firstName, " ", lastName)',
				false,
			)

			expect(result.skip).toBe(false)
			expect(result.zodString).toBe('z.string()')
		})
	})
})

describe('SurrealDB v3 introspection unions', () => {
	it('maps none | int to an optional integer', () => {
		const input = getDetailsFromDefinition('DEFINE FIELD age ON person TYPE none | int PERMISSIONS FULL', true)
		const output = getDetailsFromDefinition('DEFINE FIELD age ON person TYPE none | int PERMISSIONS FULL', false)

		expect(input.zodString).toBe('z.number().int().optional()')
		expect(output.zodString).toBe('z.number().int().optional()')
	})

	it('maps none | record<table> to an optional record schema', () => {
		const input = getDetailsFromDefinition(
			'DEFINE FIELD friend ON person TYPE none | record<person> PERMISSIONS FULL',
			true,
		)

		expect(input.zodString).toBe("recordId('person').optional()")
	})

	it('maps null | string to an optional string', () => {
		const input = getDetailsFromDefinition('DEFINE FIELD email ON person TYPE null | string PERMISSIONS FULL', true)

		expect(input.zodString).toBe('z.string().optional()')
	})
})

describe('integer fields', () => {
	it('maps int to an integer schema and keeps float, decimal and number unconstrained', () => {
		expect(getDetailsFromDefinition('DEFINE FIELD n ON t TYPE int PERMISSIONS FULL', false).zodString).toBe(
			'z.number().int()',
		)
		expect(getDetailsFromDefinition('DEFINE FIELD n ON t TYPE int DEFAULT 0 PERMISSIONS FULL', false).zodString).toBe(
			'z.number().int()',
		)
		expect(getDetailsFromDefinition('DEFINE FIELD n ON t TYPE int DEFAULT 0 PERMISSIONS FULL', true).zodString).toBe(
			'z.number().int().optional()',
		)
		for (const type of ['float', 'decimal', 'number']) {
			expect(getDetailsFromDefinition(`DEFINE FIELD n ON t TYPE ${type} PERMISSIONS FULL`, false).zodString).toBe(
				'z.number()',
			)
		}
	})

	it('maps array<int> to an array of integers', () => {
		expect(getDetailsFromDefinition('DEFINE FIELD n ON t TYPE array<int> PERMISSIONS FULL', false).zodString).toBe(
			'z.array(z.number().int())',
		)
	})
})

describe('SurrealDB v3 type shapes', () => {
	const out = (definition: string) => getDetailsFromDefinition(definition, false).zodString
	const input = (definition: string) => getDetailsFromDefinition(definition, true).zodString

	it('maps a record link to one of several tables to a union of record ids', () => {
		expect(out('DEFINE FIELD out ON comments_on TYPE record<recipe | post> PERMISSIONS FULL')).toBe(
			"z.union([recordId('recipe'), recordId('post')])",
		)
		expect(out('DEFINE FIELD target ON t TYPE none | record<hazard | incident> PERMISSIONS FULL')).toBe(
			"z.union([recordId('hazard'), recordId('incident')]).optional()",
		)
		expect(out('DEFINE FIELD target ON t TYPE array<record<hazard | incident>> PERMISSIONS FULL')).toBe(
			"z.array(z.union([recordId('hazard'), recordId('incident')]))",
		)
	})

	it('splits unions only at the top level', () => {
		expect(out('DEFINE FIELD liked ON t TYPE none | array<record<recipe> | record<post>> PERMISSIONS FULL')).toBe(
			"z.array(z.union([recordId('recipe'), recordId('post')])).optional()",
		)
		expect(out("DEFINE FIELD tags ON t TYPE none | array<'main' | 'side'> PERMISSIONS FULL")).toBe(
			"z.array(z.enum(['main', 'side'])).optional()",
		)
		expect(out("DEFINE FIELD tags ON t TYPE array<'Sk' | 'Sen'> PERMISSIONS FULL")).toBe(
			"z.array(z.enum(['Sk', 'Sen']))",
		)
	})

	it('keeps a nullable union of literals as one enum', () => {
		expect(out("DEFINE FIELD stage ON t TYPE none | 'intake' | 'quotation' READONLY PERMISSIONS FULL")).toBe(
			"z.enum(['intake', 'quotation']).optional()",
		)
	})

	it('groups the string literals of a mixed union into one enum', () => {
		expect(out("DEFINE FIELD kind ON t TYPE 'ANY' | 'STRING' | array<'ANY' | 'STRING'> PERMISSIONS FULL")).toBe(
			"z.union([z.enum(['ANY', 'STRING']), z.array(z.enum(['ANY', 'STRING']))])",
		)
	})

	it('maps numeric literal types to literals', () => {
		expect(out('DEFINE FIELD revision ON t TYPE 1 DEFAULT 1 READONLY PERMISSIONS FULL')).toBe('z.literal(1)')
		expect(input('DEFINE FIELD revision ON t TYPE 1 DEFAULT 1 READONLY PERMISSIONS FULL')).toBe(
			'z.literal(1).optional()',
		)
		expect(out('DEFINE FIELD level ON t TYPE 1 | 2 PERMISSIONS FULL')).toBe('z.union([z.literal(1), z.literal(2)])')
	})

	it('maps a tuple type to z.tuple', () => {
		expect(out('DEFINE FIELD pair ON t TYPE [record<organisation>, uuid] PERMISSIONS FULL')).toBe(
			"z.tuple([recordId('organisation'), z.string().uuid()])",
		)
	})

	it('maps an id field with a typed key to a record id of its table', () => {
		const definition = 'DEFINE FIELD id ON auth_event TYPE [none | record<user>, datetime] PERMISSIONS FULL'
		expect(out(definition)).toBe("recordId('auth_event')")
		expect(input(definition)).toBe("recordId('auth_event').optional()")
	})

	it('makes a mixed union with a default optional once in input schemas', () => {
		expect(input("DEFINE FIELD v ON t TYPE string | int DEFAULT 'x' PERMISSIONS FULL")).toBe(
			'z.union([z.string(), z.number().int()]).optional()',
		)
	})

	it('reads the element type of a sized array', () => {
		expect(out('DEFINE FIELD v ON t TYPE array<string, 10> PERMISSIONS FULL')).toBe('z.array(z.string())')
	})
})
