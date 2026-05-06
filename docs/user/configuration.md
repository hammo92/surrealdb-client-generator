# Configuration

Configuration can be provided via CLI flags, config file, or both.
When both are present, explicit CLI values override config file values. Config file values override CLI defaults.

## Compatibility Matrix

| Tool version | Runtime `surrealdb` SDK dependency | SurrealDB server | Generated client mode |
| --- | --- | --- | --- |
| 2.9.x | `surrealdb@^1.3.2` | 2.x only | SDK v1 |
| 2.10.x | `surrealdb@^2.0.0` | 2.x and 3.x | SDK v1 by default, SDK v2 with `sdkVersion: 2` |

## Example Config

```json
{
  "schemaFile": "./schema",
  "surreal": "http://localhost:8000",
  "username": "root",
  "password": "root",
  "ns": "test",
  "db": "test",
  "outputFolder": "./client_generated",
  "generateClient": true,
  "surrealImage": "surrealdb/surrealdb:latest",
  "sdkVersion": 1,
  "surrealdbVersion": 2
}
```

## Important Options

- `schemaFile`: file or directory containing `.surql` / `.surrealql` files
- `surreal`: SurrealDB endpoint for existing-database mode
- `ns`, `db`, `username`, `password`: auth and database selection
- `outputFolder`: generated output root
- `generateClient`: toggle generated client code
- `surrealImage`: container image used for temporary schema-file mode database
- `surrealdbVersion`: SurrealDB server major version, `2` or `3`; used to pin the default temporary Docker image
- `sdkVersion`: generated client API style, `1` or `2`

## Container Images

When `schemaFile` is set and `surrealImage` is left as `surrealdb/surrealdb:latest`, the generator pins the temporary Docker image from `surrealdbVersion`:

- `surrealdbVersion: 2` uses `surrealdb/surrealdb:v2.6.2`
- `surrealdbVersion: 3` uses `surrealdb/surrealdb:v3.0.2`

Explicit `surrealImage` values are preserved.

## Zod Compatibility Note

- Zod v4 dropped `z.string().ip()`.
- To keep generated code compatible with both Zod 3 and Zod 4, IP assertions are emitted as `refine` validators instead of `string().ip()`.
