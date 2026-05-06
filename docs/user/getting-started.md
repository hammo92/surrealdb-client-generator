# Getting Started

## Install

Run directly:

```bash
npx surql-gen
```

Or install as a dev dependency:

```bash
npm i -D @sebastianwessel/surql-gen
```

## Basic Usage

Generate from a running SurrealDB 2.x instance:

```bash
surql-gen --surreal http://localhost:8000 --username root --password root --ns test --db test --surrealdbVersion 2
```

Generate from a running SurrealDB 3.x instance:

```bash
surql-gen --surreal ws://localhost:8000 --username root --password root --ns test --db test --surrealdbVersion 3
```

Generate from schema definitions with a temporary Docker-backed database:

```bash
surql-gen -f ./schema.surql --surrealdbVersion 3
```

Generate from a schema directory:

```bash
surql-gen -f ./db/schema
```

## Output

By default, output is written to `client_generated`:

- `_generated/`: regenerated each run
- `schema/`: extension points for custom application code
- `client/`: generated repository helpers when `generateClient` is enabled
