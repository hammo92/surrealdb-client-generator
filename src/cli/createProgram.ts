import { Command } from 'commander'

export const createProgram = (version: string) => {
	const program = new Command()

	program
		.name('surql-gen')
		.description('Generate zod schema and typescript client code from running Surreal database or schema file')
		.version(version)

	program
		.option('-f, --schemaFile [schemaFile]', 'a SurrealQL file or directory containing definitions')
		.option('-c, --config [config]', 'config file', 'surql-gen.json')
		.option('-s, --surreal [surreal]', 'SurrealDB connection url', 'http://localhost:8000')
		.option('-u, --username [username]', 'auth username', 'root')
		.option('-p, --password [password]', 'auth password', 'root')
		.option('-n, --ns [ns]', 'the namespace', 'test')
		.option('-d, --db [db]', 'the database', 'test')
		.option('-o, --outputFolder [outputFolder]', 'output folder', 'client_generated')
		.option('-g, --generateClient', 'generate client', true)
		.option('--no-generateClient', 'no client generation')
		.option('-i, --surrealImage [surrealImage]', 'SurrealDB image', 'surrealdb/surrealdb:latest')
		.option('--sdkVersion <version>', 'SurrealDB SDK version (1 or 2)', (v: string) => Number.parseInt(v, 10), 1)
		.option('--surrealdbVersion <version>', 'SurrealDB version (2 or 3)', (v: string) => Number.parseInt(v, 10), 2)

	return program
}
