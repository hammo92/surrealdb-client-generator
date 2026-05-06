# Release Process

This repository provides a manual GitHub Actions workflow at `.github/workflows/release-manual.yml` to publish new versions.

## Checklist

1. Confirm `package.json` and `jsr.json` versions match.
2. Confirm README and `docs/` describe user-facing changes.
3. Run:

```bash
npm test -- --run
npm run build
```

4. For SurrealDB compatibility changes, verify both supported server majors.
5. Trigger the manual release workflow from `main`.

## Semver Guidance

- Use a patch release for internal fixes that do not affect generated output or runtime compatibility.
- Use a minor release for additive flags, wider compatibility, or new generated-code modes.
- Use a major release when defaults or generated APIs intentionally break existing consumers.
