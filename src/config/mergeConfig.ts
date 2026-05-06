import type { Command } from 'commander'

export const mergeConfig = (program: Command, fileContent: Record<string, unknown>) => {
	const options = program.opts()
	const explicitOptions = Object.fromEntries(
		Object.entries(options).filter(([key]) => program.getOptionValueSource(key) !== 'default'),
	)

	return {
		...options,
		...fileContent,
		...explicitOptions,
	}
}
