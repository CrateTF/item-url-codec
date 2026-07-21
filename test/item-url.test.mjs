import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import {
  CRATETF_ITEM_URL_BASE,
  isCanonicalItemPathSegment,
  normalizeTf2Sku,
  toApiSkuFromItemPathSegment,
  toCanonicalItemPathSegment,
  toCrateTfItemUrl,
  toItemPathFromSku,
} from '../dist/index.js'

const vectors = JSON.parse(
  readFileSync(new URL('../test-vectors.json', import.meta.url), 'utf8'),
)

describe('canonical item URL contract', () => {
  for (const vector of vectors.canonical) {
    it(`round-trips ${vector.sku}`, () => {
      assert.equal(toCanonicalItemPathSegment(vector.sku), vector.segment)
      assert.equal(toItemPathFromSku(vector.sku), vector.path)
      assert.equal(toApiSkuFromItemPathSegment(vector.segment), vector.sku)
      assert.equal(isCanonicalItemPathSegment(vector.segment), true)
      assert.equal(
        toCrateTfItemUrl(vector.sku),
        `${vectors.canonicalBaseUrl}${vector.path}`,
      )
    })
  }
})

describe('normalization and compatibility', () => {
  it('normalizes known tolerant SKU spellings', () => {
    assert.equal(normalizeTf2Sku('30911;5;U-144'), '30911;5;u144')
    assert.equal(normalizeTf2Sku('123;6;UNTRADEABLE;KT-2'), '123;6;untradable;kt-2')
  })

  for (const vector of vectors.toleratedLegacyPaths) {
    it(`canonicalizes legacy path ${vector.segment}`, () => {
      const sku = toApiSkuFromItemPathSegment(vector.segment)
      assert.equal(sku, vector.apiSku)
      assert.equal(toCanonicalItemPathSegment(sku), vector.canonicalSegment)
      assert.equal(isCanonicalItemPathSegment(vector.segment), false)
    })
  }

  for (const segment of vectors.invalidPathSegments) {
    it(`rejects ambiguous path ${JSON.stringify(segment)}`, () => {
      assert.equal(toApiSkuFromItemPathSegment(segment), '')
      assert.equal(isCanonicalItemPathSegment(segment), false)
    })
  }

  it('does not throw on malformed percent encoding', () => {
    assert.equal(toApiSkuFromItemPathSegment('%E0%A4%A'), '')
  })
})

describe('absolute URL generation', () => {
  it('uses the production origin by default', () => {
    assert.equal(CRATETF_ITEM_URL_BASE, 'https://crate.tf')
    assert.equal(
      toCrateTfItemUrl('5978;6;c151'),
      'https://crate.tf/item/5978-6-c151',
    )
  })

  it('supports an explicit HTTP(S) origin for preview validation', () => {
    assert.equal(
      toCrateTfItemUrl('5978;6;c151', 'http://localhost:3000/old?query=1#hash'),
      'http://localhost:3000/item/5978-6-c151',
    )
  })

  it('rejects empty SKUs and non-HTTP(S) base URLs', () => {
    assert.throws(() => toCrateTfItemUrl(''), TypeError)
    assert.throws(() => toCrateTfItemUrl('5978;6;c151', 'not-a-url'), TypeError)
    assert.throws(() => toCrateTfItemUrl('5978;6;c151', 'ftp://crate.tf'), TypeError)
  })
})
