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
