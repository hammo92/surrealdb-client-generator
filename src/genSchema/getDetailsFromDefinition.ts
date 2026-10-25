import { handleAssertions, type SchemaType } from './handleAssertions.js'
import { type TokenizedDefinition, tokenize } from './tokenize.js'

export type FieldDetail = TokenizedDefinition & { zodString: string; skip: boolean }

const KNOWN_TYPES = [
	'string',
	'datetime',
	'set',
	'array',
	'number',
	'float',
	'int',
	'decimal',
	'bool',
	'object',
	'record',
	'duration',
	'uuid',
	'bytes',
	'any',
	'point',
	'line',
	'polygon',
	'multipoint',
	'multiline',
	'multipolygon',
	'collection',
	'geometrycollection',
	'geometry',
] as const

/** Splits on `separator` outside `<>`, `[]`, `()`, `{}` and quotes, so `none | array<record<a> | record<b>>` is two parts. */
export const splitTopLevel = (value: string, separator: '|' | ','): string[] => {
	const parts: string[] = []
	let depth = 0
	let quote: string | undefined
	let start = 0
	for (let index = 0; index < value.length; index++) {
		const char = value[index] as string
		if (quote) {
			if (char === '\\') index++
			else if (char === quote) quote = undefined
			continue
		}
		if (char === "'" || char === '"' || char === '`') quote = char
		else if ('<[({'.includes(char)) depth++
		else if ('>])}'.includes(char)) depth = Math.max(0, depth - 1)
		else if (char === separator && depth === 0) {
			parts.push(value.slice(start, index).trim())
			start = index + 1
		}
	}
	parts.push(value.slice(start).trim())
	return parts.filter(part => part.length > 0)
}

/** The top-level arguments of `keyword<...>` (`array<string, 10>` → `['string', '10']`), or undefined. */
const genericArguments = (type: string | undefined, keyword: string): string[] | undefined => {
	const match = type?.trim().match(new RegExp(`^(?:option<)?${keyword}<`, 'i'))
	if (!type || !match) return undefined
	const trimmed = type.trim()
	let depth = 0
	for (let index = match[0].length - 1; index < trimmed.length; index++) {
		const char = trimmed[index]
		if (char === '<') depth++
		else if (char === '>' && --depth === 0) return splitTopLevel(trimmed.slice(match[0].length, index), ',')
	}
	return undefined
}

const isStringLiteral = (part: string) =>
	(part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))

const isNumberLiteral = (part: string) => /^-?\d+(?:\.\d+)?$/.test(part)

const unquoteLiteral = (part: string) =>
	part.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')

const enumSchema = (values: string[]) =>
	`z.enum([${values.map(v => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(', ')}])`

/** `record`, `record<a>` or `record<a | b>` (one `recordId` per table). */
const recordSchema = (type: string | undefined) => {
	const tables = genericArguments(type, 'record')?.[0]
	if (!tables) return 'recordId()'
	const names = splitTopLevel(tables, '|')
	return names.length === 1
		? `recordId('${names[0]}')`
		: `z.union([${names.map(name => `recordId('${name}')`).join(', ')}])`
}

const getArrayType = (tokens: TokenizedDefinition, isInputSchema: boolean): string => {
	const elementType = genericArguments(tokens.type, 'array')?.[0]

	if (elementType) {
		if (elementType.toLowerCase() === 'record') {
			return 'recordId().array()'
		}

		const recordTypeMatch = elementType.match(/^record<(\w+)>$/i)
		if (recordTypeMatch) {
			return `recordId('${recordTypeMatch[1]}').array()`
		}

		const innerTypeDefinition: TokenizedDefinition = {
			...tokens,
			type: elementType,
			default: undefined,
		}
		const innerType = getZodTypeFromQLType(innerTypeDefinition, isInputSchema)
		return `z.array(${innerType})`
	}
	return 'z.array(z.unknown())'
}

const getSetType = (tokens: TokenizedDefinition, isInputSchema: boolean): string => {
	const elementType = genericArguments(tokens.type, 'set')?.[0]

	if (elementType) {
		const innerTypeDefinition: TokenizedDefinition = {
			...tokens,
			type: elementType,
			default: undefined,
		}
		const innerType = getZodTypeFromQLType(innerTypeDefinition, isInputSchema)
		return `z.array(${innerType})`
	}
	return 'z.array(z.unknown())'
}

const makeOptional = (schema: string, tokens: TokenizedDefinition, isInputSchema: boolean) => {
	const typeIsOptional = tokens.type?.toLowerCase().startsWith('option<') ?? false
	if (
		(!isInputSchema && typeIsOptional && !tokens.default) ||
		(isInputSchema && (tokens.default || tokens.value)) ||
		(typeIsOptional && isInputSchema)
	) {
		return `${schema}.optional()`
	}
	return schema
}

const makeFlexible = (zodString: string, isFlexible: boolean) => (isFlexible ? `${zodString}.passthrough()` : zodString)

const getSchemaForType = (type: string, tokens: TokenizedDefinition, isInputSchema: boolean, subSchema?: string) => {
	switch (type) {
		case 'string':
			return 'z.string()'
		case 'datetime':
			return 'z.string().datetime()'
		case 'set':
			return getSetType(tokens, isInputSchema)
		case 'array':
			return getArrayType(tokens, isInputSchema)
		case 'int':
			return 'z.number().int()'
		case 'number':
		case 'float':
		case 'decimal':
			return 'z.number()'
		case 'bool':
			return 'z.boolean()'
		case 'object':
			return subSchema ?? 'z.object({})'
		case 'record':
			return recordSchema(tokens.type)
		case 'duration':
			return 'z.string()'
		case 'uuid':
			return 'z.string().uuid()'
		case 'bytes':
			return 'z.instanceof(Uint8Array)'
		case 'any':
			return 'z.any()'
		case 'point':
		case 'line':
		case 'polygon':
		case 'multipoint':
		case 'multiline':
		case 'multipolygon':
		case 'collection':
		case 'geometrycollection':
		case 'geometry':
			return 'z.object({}).passthrough()'
		default:
			return 'z.unknown()'
	}
}

export const getZodTypeFromQLType = (
	tokens: TokenizedDefinition,
	isInputSchema: boolean,
	subSchema?: string,
): string => {
	let typeStringToProcess = tokens.type
	let isExplicitlyOptional = false

	if (!typeStringToProcess && tokens.flexible) {
		typeStringToProcess = 'any'
	}

	if (!typeStringToProcess) {
		let schema = 'z.any()'
		if (isInputSchema && tokens.value) {
			schema += '.optional()'
		}
		return schema
	}

	if (typeStringToProcess.toLowerCase().startsWith('option<') && typeStringToProcess.endsWith('>')) {
		isExplicitlyOptional = true
		typeStringToProcess = typeStringToProcess.substring('option<'.length, typeStringToProcess.length - 1)
	}

	const unionParts = splitTopLevel(typeStringToProcess, '|')
	if (unionParts.length > 1) {
		const nullableUnionParts = unionParts.filter(part => ['none', 'null'].includes(part.toLowerCase()))
		if (nullableUnionParts.length && nullableUnionParts.length < unionParts.length) {
			const nonNullableParts = unionParts.filter(part => !['none', 'null'].includes(part.toLowerCase()))
			const partTokens: TokenizedDefinition = { ...tokens, type: nonNullableParts.join(' | ') }
			const schema = getZodTypeFromQLType(partTokens, isInputSchema)
			return schema.endsWith('.optional()') ? schema : `${schema}.optional()`
		}

		// Quoted string literals (enum values)
		if (unionParts.every(isStringLiteral)) {
			return makeOptional(enumSchema(unionParts.map(unquoteLiteral)), tokens, isInputSchema)
		}

		// Check if all parts are known types (e.g., uuid | int)
		const typeKeywordRegex = /^(?:option<)?([\w]+)(?:<.*>)?$/i
		const allKnownTypes = unionParts.every(part => {
			const match = part.match(typeKeywordRegex)
			return match?.[1] ? KNOWN_TYPES.includes(match[1].toLowerCase() as (typeof KNOWN_TYPES)[number]) : false
		})

		// If not all known types, check for unquoted enum values (e.g., published | draft | archived)
		if (!allKnownTypes) {
			const allUnquotedIdentifiers = unionParts.every(part => /^[A-Za-z0-9_-]+$/.test(part))
			if (allUnquotedIdentifiers && !unionParts.every(isNumberLiteral)) {
				let schema = `z.enum([${unionParts.map(v => `'${v}'`).join(', ')}])`
				if (isExplicitlyOptional) {
					schema += '.optional()'
				}
				return schema
			}
		}

		// Handle as union of types; string literals among them become one enum
		const stringLiterals = unionParts.filter(isStringLiteral)
		const unionSchemas = [
			...(stringLiterals.length ? [enumSchema(stringLiterals.map(unquoteLiteral))] : []),
			...unionParts
				.filter(part => !isStringLiteral(part))
				.map(part => {
					const partTokens: TokenizedDefinition = { ...tokens, type: part, default: undefined }
					return getZodTypeFromQLType(partTokens, false)
				}),
		]
		const schema = makeOptional(`z.union([${unionSchemas.join(', ')}])`, tokens, isInputSchema)
		return isExplicitlyOptional && !schema.endsWith('.optional()') ? `${schema}.optional()` : schema
	}

	if (isNumberLiteral(typeStringToProcess)) {
		return makeOptional(`z.literal(${typeStringToProcess})`, tokens, isInputSchema)
	}

	if (typeStringToProcess.startsWith('[') && typeStringToProcess.endsWith(']')) {
		const elements = splitTopLevel(typeStringToProcess.slice(1, -1), ',').map(element =>
			getZodTypeFromQLType({ ...tokens, type: element, default: undefined, value: undefined }, false),
		)
		return makeOptional(`z.tuple([${elements.join(', ')}])`, tokens, isInputSchema)
	}

	if (typeStringToProcess.startsWith('range<') && typeStringToProcess.endsWith('>')) {
		const rangeContent = typeStringToProcess.slice(6, -1)
		const rangeMatch = rangeContent.match(/^(\d+)\.\.(\d+)$/)
		if (rangeMatch) {
			const [, min, max] = rangeMatch
			let schema = `z.number().min(${min}).max(${max})`
			schema = makeOptional(schema, tokens, isInputSchema)
			return schema
		}
	}

	if (typeStringToProcess) {
		const valueExtractionRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g
		const valueMatchesForValidation = Array.from(typeStringToProcess.matchAll(valueExtractionRegex))
		let isValidStructure = false

		if (valueMatchesForValidation.length > 0) {
			let reconstructedForValidation = ''
			valueMatchesForValidation.forEach((match, index) => {
				reconstructedForValidation += match[0]
				if (index < valueMatchesForValidation.length - 1) {
					reconstructedForValidation += ' | '
				}
			})
			const normalizedOriginal = typeStringToProcess.replace(/\s*\|\s*/g, ' | ')
			const normalizedReconstructed = reconstructedForValidation.replace(/\s*\|\s*/g, ' | ')
			if (normalizedOriginal === normalizedReconstructed) {
				isValidStructure = true
			}
		}

		if (isValidStructure) {
			const matches = Array.from(typeStringToProcess.matchAll(valueExtractionRegex))

			if (matches && matches.length > 0) {
				const enumValues = matches.map(match => {
					const doubleQuotedContent = match[1]
					const singleQuotedContent = match[2]
					const content = doubleQuotedContent !== undefined ? doubleQuotedContent : (singleQuotedContent ?? '')

					return content.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
				})

				let schema = `z.enum([${enumValues.map(v => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`).join(', ')}])`
				schema = makeOptional(schema, tokens, isInputSchema)
				return schema
			}
		}
	}

	const typeRegex = /(?:option<)?([\w]+)(?:<([\w<>.'"]+)>)?/i // Adjusted to better handle nested generics
	const match = typeStringToProcess?.match(typeRegex)

	if (match?.[1]) {
		const typeKeyword = match[1].toLowerCase() as SchemaType
		const currentLevelTokens: TokenizedDefinition = { ...tokens, type: typeStringToProcess }
		let schema = getSchemaForType(typeKeyword, currentLevelTokens, isInputSchema, subSchema)

		if (tokens.assert) {
			schema = handleAssertions(schema, tokens.assert, typeKeyword)
		}

		if (typeKeyword === 'object') {
			schema = makeFlexible(schema, !!tokens.flexible)
		}

		schema = makeOptional(schema, tokens, isInputSchema)
		return schema
	}

	if (isExplicitlyOptional) {
		return 'z.unknown().optional()'
	}

	return 'z.unknown()'
}

export const shouldFieldBeSkipped = (tokens: TokenizedDefinition, isInputSchema: boolean): boolean => {
	if (!isInputSchema) return false
	if (tokens.value?.trim().toLowerCase().startsWith('<future>')) return true
	if (tokens.computed !== undefined) return true
	return false
}

export const getDetailsFromDefinition = (definition: string, isInputSchema: boolean): FieldDetail => {
	const tokens = tokenize(definition)
	// `DEFINE FIELD id ... TYPE [record<a>, uuid]` types the key; the field itself is a record id of the table.
	const zodString =
		tokens.name === 'id' && tokens.table
			? `recordId('${tokens.table}')${isInputSchema ? '.optional()' : ''}`
			: getZodTypeFromQLType(tokens, isInputSchema)
	return {
		...tokens,
		zodString,
		skip: shouldFieldBeSkipped(tokens, isInputSchema),
	}
}
