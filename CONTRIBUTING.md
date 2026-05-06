# Contributing

Thanks for contributing to `@sebastianwessel/surql-gen`.

## Development setup

1. Use the Node.js version from `.nvmrc` when present.
2. Install dependencies:

```bash
npm ci
```

3. Run quality checks:

```bash
npm run lint
npm test
npm run build
```

## Project structure

- `src/index.ts`: CLI entry point
- `src/cli/`: Commander program setup
- `src/config/`: CLI/config-file parsing and validation
- `src/database/`: database connection and metadata retrieval
- `src/genSchema/`: SurrealQL to Zod schema generation
- `src/genClient/`: generated client file templates
- `src/schema/`: schema source loading utilities for file and directory modes

## Pull request expectations

1. Add or update tests for behavioral changes.
2. Keep README/docs aligned with user-facing changes.
3. Verify SurrealDB 2.x and 3.x behavior when touching connection or introspection code.
4. Ensure lint, tests, and build pass.
5. Keep commits focused and descriptive.

## Release process

- Maintainers use the manual workflow in `.github/workflows/release-manual.yml`.
- See `docs/maintainers/releasing.md` for details.
