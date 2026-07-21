/** The public production origin used when an explicit base URL is not supplied. */
export const CRATETF_ITEM_URL_BASE = 'https://crate.tf'

const SIMPLE_SKU_ATTRIBUTES = new Set([
  'australium',
  'festive',
  'spelled',
  'strange',
  'uncraftable',
  'untradable',
])

const COMPACT_NUMERIC_ATTRIBUTE_RE = /^(?:c|n|oq|p|pk|u|w)\d+$/i
const COMPACT_NUMERIC_ATTRIBUTE_PREFIX_RE = /^(?:c|n|oq|p|pk|u|w)$/i
const HYPHEN_NUMERIC_ATTRIBUTE_PREFIX_RE = /^(?:kt|od|td)$/i
const LEGACY_SIMPLE_ATTRIBUTE_RE = /^k\d+$/i

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeSkuPart(part: string): string {
  const normalized = String(part || '').trim().toLowerCase()
  const compact = normalized.match(/^(c|n|oq|p|pk|u|w)-(\d+)$/i)
  if (compact) return `${compact[1]?.toLowerCase()}${compact[2]}`

  const hyphenated = normalized.match(/^(kt|od|td)-(\d+)$/i)
  if (hyphenated) return `${hyphenated[1]?.toLowerCase()}-${hyphenated[2]}`

  if (normalized === 'untradeable') return 'untradable'
  return normalized
}

/**
 * Normalize a semicolon-delimited TF2 SKU without changing its semantic parts.
 *
 * This helper is intentionally tolerant of common variants such as `u-144`
 * and `untradeable`, while preserving native hyphenated attributes such as
 * `td-31154`, `kt-2`, and `od-456`.
 */
export function normalizeTf2Sku(rawSku: string): string {
  return String(rawSku || '')
    .trim()
    .split(';')
    .map(normalizeSkuPart)
    .filter(Boolean)
    .join(';')
}

function parseReadableItemPathSegment(pathSegment: string): string {
  const tokens = String(pathSegment || '').trim().split('-')
  if (tokens.length < 2 || tokens.some((token) => !token)) return ''
  if (!/^\d+$/.test(tokens[0] || '') || !/^\d+$/.test(tokens[1] || '')) return ''

  const parts = [tokens[0] || '', tokens[1] || '']
  for (let index = 2; index < tokens.length; index += 1) {
    const token = String(tokens[index] || '').toLowerCase()

    if (token === 'untradeable') {
      parts.push('untradable')
      continue
    }

    if (
      SIMPLE_SKU_ATTRIBUTES.has(token)
      || COMPACT_NUMERIC_ATTRIBUTE_RE.test(token)
      || LEGACY_SIMPLE_ATTRIBUTE_RE.test(token)
    ) {
      parts.push(token)
      continue
    }

    const next = tokens[index + 1] || ''
    if (HYPHEN_NUMERIC_ATTRIBUTE_PREFIX_RE.test(token) && /^\d+$/.test(next)) {
      parts.push(`${token}-${next}`)
      index += 1
      continue
    }

    if (COMPACT_NUMERIC_ATTRIBUTE_PREFIX_RE.test(token) && /^\d+$/.test(next)) {
      parts.push(`${token}${next}`)
      index += 1
      continue
    }

    return ''
  }

  return parts.join(';')
}

/** Return whether a path segment is already in the canonical Crate.tf form. */
export function isCanonicalItemPathSegment(value: string): boolean {
  const normalized = safeDecodeURIComponent(String(value || '').trim())
  if (!normalized) return false

  const sku = parseReadableItemPathSegment(normalized)
  return Boolean(sku && toCanonicalItemPathSegment(sku) === normalized)
}

/** Convert a semicolon-delimited TF2 SKU to a canonical Crate.tf path segment. */
export function toCanonicalItemPathSegment(rawSku: string): string {
  return normalizeTf2Sku(rawSku).replaceAll(';', '-')
}

/**
 * Convert a canonical or supported legacy item path segment back to an API SKU.
 * Returns an empty string for ambiguous or unsupported path segments.
 */
export function toApiSkuFromItemPathSegment(pathSegment: string): string {
  const decoded = safeDecodeURIComponent(String(pathSegment || '').trim())
  if (!decoded) return ''
  if (decoded.includes(';')) return normalizeTf2Sku(decoded)
  return parseReadableItemPathSegment(decoded)
}

/** Convert a TF2 SKU to the canonical site-relative Crate.tf item path. */
export function toItemPathFromSku(rawSku: string): string {
  const segment = toCanonicalItemPathSegment(rawSku)
  return `/item/${encodeURIComponent(segment)}`
}

/**
 * Convert a TF2 SKU to an absolute Crate.tf item URL.
 *
 * @throws {TypeError} when the SKU is empty or the base URL is not HTTP(S).
 */
export function toCrateTfItemUrl(
  rawSku: string,
  baseUrl: string = CRATETF_ITEM_URL_BASE,
): string {
  const segment = toCanonicalItemPathSegment(rawSku)
  if (!segment) throw new TypeError('A non-empty TF2 SKU is required')

  let url: URL
  try {
    url = new URL(String(baseUrl || '').trim())
  } catch {
    throw new TypeError('baseUrl must be a valid absolute HTTP(S) URL')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TypeError('baseUrl must use HTTP or HTTPS')
  }

  url.pathname = toItemPathFromSku(rawSku)
  url.search = ''
  url.hash = ''
  return url.toString()
}
