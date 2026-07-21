# Contributing

Thank you for helping keep Crate.tf item links stable.

## Before opening a change

- Open an issue for changes to canonical URL behavior or supported SKU grammar.
- Keep the runtime dependency-free unless maintainers explicitly approve a
  dependency.
- Do not include private Crate.tf source, production data, credentials, or
  internal endpoints.

## Development workflow

1. Fork and clone the repository.
2. Install exact dependencies with `npm ci`.
3. Change the implementation and documentation together.
4. Add or update entries in `test-vectors.json` for behavior changes.
5. Run `npm run check` and `npm pack --dry-run`.
6. Open a pull request describing compatibility and migration impact.

## Compatibility rules

- A new accepted input that preserves existing outputs is normally a minor
  release.
- A bug fix that does not change documented canonical outputs is normally a
  patch release.
- Any change to an existing canonical path, exported API, or rejection rule is
  potentially breaking and requires a major release.
- Existing public Crate.tf URLs must remain redirect-compatible when canonical
  behavior changes.

## Pull request checklist

- [ ] Contract documentation matches the implementation.
- [ ] Portable vectors cover the change.
- [ ] Tests cover canonical, legacy, and invalid inputs where applicable.
- [ ] `npm run check` passes.
- [ ] `npm pack --dry-run` contains no unexpected files.
- [ ] `CHANGELOG.md` is updated when behavior changes.
