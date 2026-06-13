export function buildPublicFunnelActionHref(
  pathname: string,
  currentSearchParams: Record<string, string | string[] | undefined> | undefined,
  updates: Record<string, string | null | undefined>
) {
  const params = new URLSearchParams()

  for (const [key, rawValue] of Object.entries(currentSearchParams ?? {})) {
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue
    if (typeof value === "string" && value) {
      params.set(key, value)
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === "string" && value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
