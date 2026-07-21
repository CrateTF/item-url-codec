# Releasing

Stable GitHub releases publish `@cratetf/item-url-codec` to npm through npm
Trusted Publishing. The workflow uses GitHub OIDC, stores no npm publishing
token, and produces npm provenance for the public package.

## Registry bootstrap

npm requires a package to exist before a trusted publisher can be configured.
The initial release therefore uses this one-time bootstrap:

1. Confirm that the public `@cratetf` npm scope exists and that the maintainer
   has package-publishing permission with account-level 2FA enabled.
2. From a reviewed, clean checkout, run:

   ```bash
   npm ci
   npm run check
   npm pack --dry-run
   npm publish --access public
   ```

3. In the npm package settings, add a GitHub Actions trusted publisher:
   - organization: `CrateTF`
   - repository: `item-url-codec`
   - workflow filename: `publish.yml`
   - environment: empty
   - allowed action: `npm publish`
4. After a successful OIDC release, set npm publishing access to **Require
   two-factor authentication and disallow tokens**.

## Stable release

1. Update the version in `package.json` and `package-lock.json`.
2. Update `CHANGELOG.md` and contract vectors when behavior changes.
3. Run `npm ci`, `npm run check`, and `npm pack --dry-run`.
4. Review the tarball file list.
5. Commit and push the reviewed change.
6. Create and push a signed `v<version>` tag.
7. Publish a non-prerelease GitHub release for that tag.
8. Verify the `Publish to npm` workflow and the matching npm version and
   provenance record.

The workflow rejects a release tag that differs from `package.json`. A rerun
for an existing npm version is a safe no-op. Prerelease GitHub releases do not
publish.
