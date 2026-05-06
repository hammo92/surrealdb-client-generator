# Schema Inputs

`schemaFile` accepts either a single file or a directory.

## Files

Supported file extensions:

- `.surql`
- `.surrealql`

Example:

```bash
surql-gen -f ./schema.surql
```

## Directories

When a directory is provided, files are loaded recursively and sorted by path before insertion into the temporary database.

Example:

```bash
surql-gen -f ./db/schema
```

## Ignore Rules

Place a `.ignore` file in the schema directory to exclude files or folders. Patterns are relative to the schema directory.

Example:

```txt
# Ignore migration snapshots
migrations/**

# Ignore a specific file
legacy.surql
```
