import type { AssetProvider, ProviderCandidate } from "./types"

/**
 * Server-only Pexels REST adapter. No SDK installed -- plain fetch.
 * PEXELS_API_KEY must never reach a client bundle: this module is only
 * ever imported from resolve-tree-assets.ts, itself only imported from
 * lib/orvenix-ai/autonomous/site-builder.ts (server-side generation
 * code), never from components/editor/primitives/Image.tsx or any other
 * client-reachable path.
 */

const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"
const REQUEST_TIMEOUT_MS = 4000
const MAX_RETRIES = 1

function isHttpsUrlWithHostSuffix(value: unknown, hostSuffix: string): value is string {
  if (typeof value !== "string" || !value) return false
  try {
    const url = new URL(value)
    return url.protocol === "https:" && (url.hostname === hostSuffix || url.hostname.endsWith(`.${hostSuffix}`))
  } catch {
    return false
  }
}

function pickImageSrc(src: unknown): string | undefined {
  if (!src || typeof src !== "object") return undefined
  const candidate = (src as Record<string, unknown>).large2x ?? (src as Record<string, unknown>).large
  return isHttpsUrlWithHostSuffix(candidate, "pexels.com") ? candidate : undefined
}

function toCandidate(photo: unknown): ProviderCandidate | null {
  if (!photo || typeof photo !== "object") return null
  const p = photo as Record<string, unknown>

  const src = pickImageSrc(p.src)
  const width = typeof p.width === "number" ? p.width : undefined
  const height = typeof p.height === "number" ? p.height : undefined
  const providerAssetId = typeof p.id === "number" || typeof p.id === "string" ? String(p.id) : undefined

  if (!src || !width || !height || !providerAssetId) return null

  const attributionUrl = isHttpsUrlWithHostSuffix(p.url, "pexels.com") ? p.url : undefined
  const photographerUrl = isHttpsUrlWithHostSuffix(p.photographer_url, "pexels.com") ? p.photographer_url : undefined

  return {
    provider: "pexels",
    providerAssetId,
    src,
    width,
    height,
    photographer: typeof p.photographer === "string" ? p.photographer : undefined,
    photographerUrl,
    attributionUrl,
    dominantColor: typeof p.avg_color === "string" ? p.avg_color : undefined,
  }
}

function isTransientStatus(status: number): boolean {
  return status >= 500 || status === 408
}

async function fetchWithTimeout(url: string, apiKey: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      headers: { Authorization: apiKey },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function searchPexels(query: string, apiKey: string, perPage: number): Promise<ProviderCandidate[]> {
  const url = `${PEXELS_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=${Math.min(Math.max(perPage, 1), 80)}`

  let attempt = 0
  let lastStatus: number | null = null

  while (attempt <= MAX_RETRIES) {
    attempt += 1

    let response: Response
    try {
      response = await fetchWithTimeout(url, apiKey, REQUEST_TIMEOUT_MS)
    } catch {
      // Network error/timeout/abort: transient, eligible for one retry.
      if (attempt > MAX_RETRIES) return []
      continue
    }

    if (!response.ok) {
      lastStatus = response.status
      if (isTransientStatus(response.status) && attempt <= MAX_RETRIES) continue
      // Non-transient (401/403/429/4xx) or retries exhausted: never throw, never log the raw body.
      return []
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return []
    }

    if (!payload || typeof payload !== "object" || !Array.isArray((payload as Record<string, unknown>).photos)) {
      return []
    }

    return ((payload as Record<string, unknown>).photos as unknown[])
      .map(toCandidate)
      .filter((candidate): candidate is ProviderCandidate => candidate !== null)
  }

  void lastStatus
  return []
}

export function createPexelsProvider(): AssetProvider {
  return {
    name: "pexels",
    isAvailable() {
      return Boolean(process.env.PEXELS_API_KEY)
    },
    async search(query, options) {
      const apiKey = process.env.PEXELS_API_KEY
      if (!apiKey) return []
      if (!query.trim()) return []

      try {
        return await searchPexels(query, apiKey, options?.perPage ?? 6)
      } catch {
        // Defensive: search() must never throw, regardless of cause.
        return []
      }
    },
  }
}
