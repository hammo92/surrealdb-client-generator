import { splitTopLevel } from './splitTopLevel.js'

const FIELD_CLAUSES = [
	'TYPE',
	'REFERENCE',
	'DEFAULT',
	'READONLY',
	'VALUE',
	'ASSERT',
	'PERMISSIONS',
	'COMMENT',
	'COMPUTED',
] as const

const PATTERNS = {
	DEFINE_FIELD: /DEFINE FIELD(?: IF NOT EXISTS)?\s+((?:`[^`]+`|[^`])+?)\s+ON(?: TABLE)?\s+([\w.:`\-[\]*]+)/im,
} as const

type PermissionOperation = 'select' | 'create' | 'update' | 'delete'

export type Permissions = {
	none?: boolean
	full?: boolean
} & {
	[K in PermissionOperation]?: string
}

export interface TokenizedDefinition {
	name: string
	table: string
	flexible?: boolean
	type?: string
	default?: string
	readonly?: boolean
	value?: string
	assert?: string
	permissions?: Permissions
	reference?: string
	comment?: string
	computed?: string
}

/**
 * Parses a PERMISSIONS clause body: `NONE`, `FULL`, or `FOR select WHERE ..., FOR create, update WHERE ...`.
 * Commas inside an expression's brackets do not separate operations.
 */
function parsePermissions(body: string): Permissions | undefined {
	if (/^NONE$/i.test(body)) return { none: true }
	if (/^FULL$/i.test(body)) return { full: true }

	const permissions: Permissions = {}
	let pending: PermissionOperation[] = []
	for (const rawPart of splitTopLevel(body, ',')) {
		const part = rawPart.replace(/^FOR\s+/i, '')
		const match = part.match(/^(select|create|update|delete)\b\s*([\s\S]*)$/i)
		if (!match) continue
		pending.push(match[1]?.toLowerCase() as PermissionOperation)
		const expression = match[2]?.trim()
		if (expression) {
			for (const operation of pending) permissions[operation] = expression
			pending = []
		}
	}
	return Object.keys(permissions).length ? permissions : undefined
}

type ValueClause = Exclude<(typeof FIELD_CLAUSES)[number], 'READONLY'>

type SplitClauses = Partial<Record<ValueClause, string>> & { flexible?: boolean; readonly?: boolean }

const CLAUSE_KEYWORDS = [...FIELD_CLAUSES, 'FLEXIBLE'] as const

/**
 * Splits the part of a field definition after `ON <table>` into its clauses.
 *
 * A keyword starts a clause only outside quotes and brackets, after whitespace (or at the start) and
 * before whitespace (or the end), and only the first time it appears, so `order_type`, `$value`,
 * `'... READONLY'` or a `type` field read inside a VALUE expression never end a clause. `FLEXIBLE`
 * is a flag in both positions SurrealDB has used: `FLEXIBLE TYPE object` (v1/v2) and
 * `TYPE object FLEXIBLE` (v3 `INFO` output).
 */
export function splitClauses(segment: string): SplitClauses {
	const result: SplitClauses = {}
	const seen = new Set<string>()
	let current: ValueClause | undefined
	let bodyStart = 0
	let quote: string | undefined
	let depth = 0

	const close = (endIndex: number) => {
		if (!current) return
		const body = segment.slice(bodyStart, endIndex).trim().replace(/;$/, '').trim()
		if (body) result[current] = body
		current = undefined
	}

	const keywordAt = (index: number): string | undefined => {
		if (index > 0 && !/\s/.test(segment[index - 1] ?? '')) return undefined
		for (const keyword of CLAUSE_KEYWORDS) {
			const candidate = segment.slice(index, index + keyword.length)
			const after = segment[index + keyword.length]
			if (candidate.toUpperCase() !== keyword || (after !== undefined && !/[\s;]/.test(after))) continue
			if (seen.has(keyword)) return undefined
			const rest = segment.slice(index + keyword.length).trimStart()
			if (keyword === 'COMMENT' && !/^['"]/.test(rest)) return undefined
			if (keyword === 'PERMISSIONS' && !/^(?:NONE|FULL|FOR)\b/i.test(rest)) return undefined
			return keyword
		}
		return undefined
	}

	for (let index = 0; index < segment.length; index++) {
		const char = segment[index] as string
		if (quote) {
			if (char === '\\') index++
			else if (char === quote) quote = undefined
			continue
		}
		if (char === "'" || char === '"' || char === '`') {
			quote = char
			continue
		}
		if (char === '(' || char === '[' || char === '{') {
			depth++
			continue
		}
		if (char === ')' || char === ']' || char === '}') {
			depth = Math.max(0, depth - 1)
			continue
		}
		if (depth > 0) continue
		const keyword = keywordAt(index)
		if (!keyword) continue
		close(index)
		seen.add(keyword)
		if (keyword === 'FLEXIBLE') result.flexible = true
		else if (keyword === 'READONLY') result.readonly = true
		else {
			current = keyword as ValueClause
			bodyStart = index + keyword.length
		}
		index += keyword.length - 1
	}
	close(segment.length)

	return result
}

export const tokenize = (originalDefinition: string): TokenizedDefinition => {
	const result: TokenizedDefinition = { name: '', table: '' }
	const definition = originalDefinition.trim()

	const nameMatch = definition.match(PATTERNS.DEFINE_FIELD)
	let remainingDefinitionAfterNameAndTable = definition

	if (nameMatch) {
		const fieldName = nameMatch[1] ? nameMatch[1].trim() : ''

		const stripBackticks = (str: string): string => {
			return str.replace(/`([^`]+)`/g, '$1')
		}

		result.name = stripBackticks(fieldName)
		result.table = nameMatch[2] ? nameMatch[2].trim() : ''
		const defineFieldPartRegex = new RegExp(
			`^DEFINE FIELD(?: IF NOT EXISTS)?\\s+${fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+ON(?: TABLE)?\\s+${result.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`,
			'i',
		)
		remainingDefinitionAfterNameAndTable = definition.replace(defineFieldPartRegex, '').trim()
	}

	const clauses = splitClauses(remainingDefinitionAfterNameAndTable)

	if (clauses.flexible) {
		result.flexible = true
	}
	if (clauses.TYPE) {
		result.type = clauses.TYPE
	}
	if (clauses.DEFAULT) {
		result.default = clauses.DEFAULT
	}
	if (clauses.readonly) {
		result.readonly = true
	}
	if (clauses.VALUE) {
		result.value = clauses.VALUE
	}
	if (clauses.ASSERT) {
		result.assert = clauses.ASSERT
	}
	if (clauses.REFERENCE) {
		result.reference = clauses.REFERENCE
	}
	if (clauses.COMMENT) {
		result.comment = clauses.COMMENT
	}
	if (clauses.COMPUTED) {
		result.computed = clauses.COMPUTED
	}
	const permissions = clauses.PERMISSIONS ? parsePermissions(clauses.PERMISSIONS) : undefined
	if (permissions) {
		result.permissions = permissions
	}

	return result
}
