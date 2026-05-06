import { Surreal } from 'surrealdb'
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers'

import type { Config } from '../config/types.js'

const DEFAULT_IMAGES: Record<number, string> = {
	2: 'surrealdb/surrealdb:v2.6.2',
	3: 'surrealdb/surrealdb:v3.0.2',
}

export const resolveSurrealImage = (surrealImage: string, surrealdbVersion: number) => {
	if (surrealImage !== 'surrealdb/surrealdb:latest') {
		return surrealImage
	}

	return DEFAULT_IMAGES[surrealdbVersion] ?? surrealImage
}

let db: Surreal
let container: StartedTestContainer | null = null

export const getDb = () => {
	if (db) {
		return db
	}
	throw new Error('Not connected to a database')
}

type AuthDb = {
	signin: (credentials: Record<string, string>) => Promise<unknown>
	use: (selection: { namespace: string; database?: string }) => Promise<unknown>
	query?: (query: string) => Promise<unknown>
}

const assertSafeIdentifier = (value: string, label: string) => {
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
		throw new Error(`${label} must be a simple SurrealDB identifier when creating a temporary database`)
	}
}

export const prepareTemporaryNamespace = async (db: Required<Pick<AuthDb, 'query' | 'use'>>, config: Config) => {
	assertSafeIdentifier(config.ns, 'Namespace')
	assertSafeIdentifier(config.db, 'Database')

	await db.query(`DEFINE NAMESPACE ${config.ns}`)
	await db.use({ namespace: config.ns })
	await db.query(`DEFINE DATABASE ${config.db}`)
	await db.use({ namespace: config.ns, database: config.db })
}

export const authenticateDb = async (db: AuthDb, config: Config, prepareTemporaryDatabase = false) => {
	let lastSignInError: unknown
	const signInPayloads: Record<string, string>[] = [
		{
			username: config.username,
			password: config.password,
		},
		{
			namespace: config.ns,
			database: config.db,
			username: config.username,
			password: config.password,
		},
	]

	for (const payload of signInPayloads) {
		try {
			await db.signin(payload)
			lastSignInError = undefined
			break
		} catch (error) {
			lastSignInError = error
		}
	}

	if (lastSignInError) {
		throw lastSignInError
	}

	if (prepareTemporaryDatabase) {
		if (!db.query) {
			throw new Error('Database query support is required to prepare a temporary database')
		}
		await prepareTemporaryNamespace(db as Required<Pick<AuthDb, 'query' | 'use'>>, config)
		return
	}

	await db.use({
		namespace: config.ns,
		database: config.db,
	})
}

async function startSurrealDBContainer(config: Config): Promise<StartedTestContainer> {
	try {
		console.log('Starting temporary SurrealDB instance')
		const newContainer = await new GenericContainer(config.surrealImage)
			.withExposedPorts(8000)
			.withCommand(['start', '--user', config.username, '--pass', config.password, 'memory'])
			.withWaitStrategy(Wait.forLogMessage('Started web server'))
			.start()

		const port = newContainer.getMappedPort(8000)
		const host = newContainer.getHost()
		config.surreal = `http://${host}:${port}`
		console.log(`Temporary SurrealDB instance started at ${config.surreal}`)

		return newContainer
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes('pull access denied') || error.message.includes('not found')) {
				throw new Error(`Invalid or inaccessible Docker image: ${config.surrealImage}`)
			}
			if (error.message.includes('connection refused')) {
				throw new Error('Unable to connect to Docker daemon. Is Docker running?')
			}
		}
		throw new Error(`Failed to start SurrealDB container: ${error}`)
	}
}

export const connectDb = async (config: Config, createInstance = false) => {
	if (createInstance) {
		const pinnedImage = resolveSurrealImage(config.surrealImage, config.surrealdbVersion)
		if (pinnedImage !== config.surrealImage) {
			console.log(
				`Warning: using 'surrealdb/surrealdb:latest' may not match surrealdbVersion ${config.surrealdbVersion}. Using ${pinnedImage} instead.`,
			)
			config.surrealImage = pinnedImage
		}
		try {
			container = await startSurrealDBContainer(config)
		} catch (error) {
			console.error('Error starting SurrealDB container:', error instanceof Error ? error.message : error)
			throw error // Re-throw to be caught by the caller if needed
		}
	}

	console.log('Connecting to database')
	db = new Surreal()

	let retries = 5
	while (retries > 0) {
		try {
			await db.connect(config.surreal)
			break
		} catch (error) {
			console.log(`Connection failed. Retrying... (${retries} attempts left)`)
			retries--
			if (retries === 0) {
				throw error
			}
			await new Promise(resolve => setTimeout(resolve, 1000))
		}
	}

	await authenticateDb(db, config, createInstance && config.surrealdbVersion === 3)
	console.log('Connected to database successfully')
}

export const insertDefinitions = async (content: string) => {
	const db = getDb()
	await db.query(content, {})
	console.log('Definitions written to database')
}

export const closeDb = async () => {
	if (db) {
		await db.close()
	}
	if (container) {
		await container.stop()
		console.log('Temporary SurrealDB instance stopped')
	}
	console.log('Database connection closed')
}
