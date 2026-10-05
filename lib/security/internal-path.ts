/**
 * SALES-2: a post-login / post-register destination taken from the query
 * string is only followed when it is a path on this site. Anything that a
 * browser could resolve to another origin ("//host", "/\\host", "https:",
 * control characters) is rejected, so there is no open redirect.
 */
const PROBE_ORIGIN = "https://orvenix.invalid"
const MAX_LENGTH = 512

export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null
  if (!value.startsWith("/") || value.length > MAX_LENGTH) return null
  if (value.startsWith("//") || value.includes("\\")) return null
  if (/[\u0000-\u001f\u007f]/.test(value)) return null

  try {
    const url = new URL(value, PROBE_ORIGIN)
    if (url.origin !== PROBE_ORIGIN) return null
    const path = `${url.pathname}${url.search}${url.hash}`
    // "/..//host" normalizes to "//host", which a browser treats as another origin.
    if (path.startsWith("//") || path.startsWith("/\\")) return null
    return path
  } catch {
    return null
  }
}
