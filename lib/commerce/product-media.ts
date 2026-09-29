/**
 * PCE-2: the ONE rule for which authoritative product media URLs may
 * render (store Product.media -> facts -> ProductCard / ProductDetail).
 * Only https URLs or site-relative paths; no scheme tricks, no
 * protocol-relative hosts, no whitespace. Pure; never fetches or invents.
 */

export const MAX_PRODUCT_MEDIA_URLS_V1 = 8
const MAX_URL_LENGTH = 2048

export function isSafeProductMediaUrlV1(value: unknown): value is string {
  if (typeof value !== "string") return false
  const url = value.trim()
  if (!url || url.length > MAX_URL_LENGTH || /\s/.test(url)) return false
  return /^https:\/\/[^/\s]+\/\S*$/i.test(url) || /^\/(?!\/)\S+$/.test(url)
}

/** Product.media JSON (array of URL strings) -> ordered, de-duplicated, safe URLs. */
export function sanitizeProductMediaUrlsV1(media: unknown, max = MAX_PRODUCT_MEDIA_URLS_V1): string[] {
  if (!Array.isArray(media)) return []
  const out: string[] = []
  for (const entry of media) {
    if (!isSafeProductMediaUrlV1(entry)) continue
    const url = entry.trim()
    if (!out.includes(url)) out.push(url)
    if (out.length >= max) break
  }
  return out
}
