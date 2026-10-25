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

/**
 * Splits an expression at the boolean operators in `operators` (`AND`, `&&`, `OR`, `||`) that sit
 * outside quotes and brackets; word operators must stand alone (`brand` or `ORDER` do not split).
 */
export const splitTopLevelOperator = (value: string, operators: readonly string[]): string[] => {
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
		else if ('[({'.includes(char)) depth++
		else if ('])}'.includes(char)) depth = Math.max(0, depth - 1)
		else if (depth === 0) {
			const operator = operators.find(candidate => {
				if (value.slice(index, index + candidate.length).toUpperCase() !== candidate) return false
				if (!/^\w/.test(candidate)) return true
				return !/\w/.test(value[index - 1] ?? '') && !/\w/.test(value[index + candidate.length] ?? '')
			})
			if (operator) {
				parts.push(value.slice(start, index).trim())
				start = index + operator.length
				index += operator.length - 1
			}
		}
	}
	parts.push(value.slice(start).trim())
	return parts.filter(part => part.length > 0)
}

/** Removes brackets that wrap the whole expression: `(($value > 0))` → `$value > 0`. */
export const unwrapParentheses = (value: string): string => {
	let current = value.trim()
	while (current.startsWith('(') && current.endsWith(')')) {
		let depth = 0
		let closesAtEnd = true
		for (let index = 0; index < current.length; index++) {
			if (current[index] === '(') depth++
			else if (current[index] === ')' && --depth === 0 && index < current.length - 1) {
				closesAtEnd = false
				break
			}
		}
		if (!closesAtEnd) break
		current = current.slice(1, -1).trim()
	}
	return current
}
