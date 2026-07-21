# Crate.tf item URL contract

Status: stable

Contract version: `1.0.0`
Canonical origin: `https://crate.tf`

This document defines how an authoritative semicolon-delimited TF2 SKU maps to
a public Crate.tf item URL. It is language-neutral. `src/item-url.ts` is the
reference TypeScript implementation and `test-vectors.json` is the portable
conformance suite.

## Forward mapping

Given an authoritative TF2 SKU:

1. Trim the complete value.
2. Split it on semicolons.
3. Trim and lowercase every non-empty part.
4. Normalize common tolerant spellings:
   - `untradeable` becomes `untradable`;
   - `c-<n>`, `n-<n>`, `oq-<n>`, `p-<n>`, `pk-<n>`, `u-<n>`, and `w-<n>`
     become their compact forms, such as `u144`;
   - `kt-<n>`, `od-<n>`, and `td-<n>` retain their native hyphen.
5. Join the normalized parts with semicolons to obtain the normalized API SKU.
6. Replace only the semicolon separators with hyphens to obtain the canonical
   path segment.
7. Percent-encode the complete path segment for safe URL insertion.
8. Prefix it with `/item/`.

Example:

```text
9258;5;uncraftable;td-31154
-> 9258-5-uncraftable-td-31154
-> https://crate.tf/item/9258-5-uncraftable-td-31154
```

Native attribute hyphens are deliberately preserved. Consumers generating
links from authoritative SKUs do not need to implement reverse parsing.

## Reverse mapping

Crate.tf accepts canonical path segments and selected legacy forms. Reverse
parsing is grammar-aware because a plain global hyphen-to-semicolon replacement
would corrupt native attributes such as `td-31154`.

The first two tokens must be numeric item definition and quality values.
Subsequent tokens may be:

- flags: `australium`, `festive`, `spelled`, `strange`, `uncraftable`,
  `untradable`;
- compact numeric attributes: `c`, `n`, `oq`, `p`, `pk`, `u`, and `w` followed
  by digits;
- native hyphenated numeric attributes: `kt`, `od`, and `td` followed by a
  hyphen and digits;
- legacy `k<digits>` attributes.

Unknown or ambiguous path segments must be rejected rather than converted into
invented API SKUs.

## Compatibility and canonicalization

- Public links, sitemap entries, and canonical tags use the hyphenated form.
- Legacy raw or percent-encoded semicolon paths may be permanently redirected
  to the canonical path by Crate.tf.
- Query strings used for referral attribution are independent of this codec.
- A consumer must not change the algorithm silently. Contract changes require
  new conformance vectors and a semantic-version release.

## Conformance

An implementation conforms to version `1.0.0` when it produces every expected
result in `test-vectors.json` and rejects every listed invalid path segment.
