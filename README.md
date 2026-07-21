# Crate.tf item URL codec

The official, dependency-free reference implementation for converting TF2 SKUs
to canonical Crate.tf item links and parsing supported item URL segments back to
API SKUs.

This repository is the public integration contract for websites, bots, browser
extensions, and other tools linking to Crate.tf item pages. Crate.tf backend
APIs continue to use authoritative semicolon-delimited TF2 SKUs; public item
URLs use a readable hyphenated representation.

## Why this exists

A naive replacement works in the forward direction when the input is already a
canonical TF2 SKU, but it cannot safely parse URLs in reverse. Some valid SKU
attributes contain native hyphens:

```text
9258;5;uncraftable;td-31154
```

The corresponding public path is:

```text
/item/9258-5-uncraftable-td-31154
```

The codec recognizes the TF2 SKU grammar and preserves attributes such as
`td-31154`, `kt-2`, and `od-456`.

## Installation

Install the package from npm:

```bash
npm install @cratetf/item-url-codec
```

Non-JavaScript integrations can implement the language-neutral contract from
[CONTRACT.md](./CONTRACT.md) and verify their implementation against
[test-vectors.json](./test-vectors.json).

## Usage

```ts
import {
  toApiSkuFromItemPathSegment,
  toCrateTfItemUrl,
  toItemPathFromSku,
} from '@cratetf/item-url-codec'

toItemPathFromSku('5978;6;c151')
// '/item/5978-6-c151'

toCrateTfItemUrl('9258;5;uncraftable;td-31154')
// 'https://crate.tf/item/9258-5-uncraftable-td-31154'

toApiSkuFromItemPathSegment('9258-5-uncraftable-td-31154')
// '9258;5;uncraftable;td-31154'
```

For outbound links, integrations normally need only `toCrateTfItemUrl()` or
`toItemPathFromSku()`. Reverse parsing is primarily useful to Crate.tf itself.

## Public API

### `normalizeTf2Sku(rawSku)`

Normalizes case, whitespace, `untradeable`, and known tolerant numeric
attribute spellings while preserving the semicolon-delimited API representation.

### `toCanonicalItemPathSegment(rawSku)`

Returns the canonical hyphenated item path segment.

### `toItemPathFromSku(rawSku)`

Returns the canonical site-relative `/item/<segment>` path.

### `toCrateTfItemUrl(rawSku, baseUrl?)`

Returns an absolute item URL. It defaults to `https://crate.tf` and rejects an
empty SKU or non-HTTP(S) base URL.

### `toApiSkuFromItemPathSegment(pathSegment)`

Returns the normalized API SKU for a canonical or supported legacy segment.
Returns an empty string for ambiguous or unsupported segments.

### `isCanonicalItemPathSegment(value)`

Returns whether the input is already the exact canonical path representation.

## Canonical examples

| API SKU | Canonical path |
| --- | --- |
| `5021;6` | `/item/5021-6` |
| `5978;6;c151` | `/item/5978-6-c151` |
| `30911;5;u144` | `/item/30911-5-u144` |
| `9258;5;uncraftable;td-31154` | `/item/9258-5-uncraftable-td-31154` |
| `123;6;kt-2` | `/item/123-6-kt-2` |
| `123;6;od-456;oq6` | `/item/123-6-od-456-oq6` |

## Requirements and compatibility

- Zero runtime dependencies.
- ESM package with bundled TypeScript declarations.
- Browser and Node.js compatible.
- Node.js `20` or newer for package tooling and automated tests.
- Semantic Versioning for public API and contract changes.

The package does not check whether an SKU currently exists in the Crate.tf
catalog. It only normalizes and converts identifiers. A correctly formed link
may still return `404` when the item is not present in the live catalog.

## Development

```bash
npm ci
npm run check
npm pack --dry-run
```

`npm run check` performs strict TypeScript validation, builds declarations and
source maps, and executes the conformance tests.

## Security

This package processes public identifiers and does not access credentials,
network services, or the filesystem. Report security concerns according to
[SECURITY.md](./SECURITY.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Changes to parsing behavior must include
portable contract vectors and tests.

## License

MIT. See [LICENSE](./LICENSE).
