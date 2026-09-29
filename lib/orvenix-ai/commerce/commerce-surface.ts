import { contrastRatio, hasSafeContrast, lightAccentTint, readableTextOn } from "@/lib/orvenix-ai/theme/visual-direction"

/**
 * PCE-2: the ONE resolver for theme-aware commerce surfaces (store product
 * sections, ProductCard, ProductDetail, commerce closing/footer).
 *
 * Creative intent may only choose a bounded semantic RELATION (continuous
 * with the page, a soft tint, or a contrast band) and TONE (light, dark or
 * auto). Every actual color is derived here from the site's own theme
 * tokens and checked with the existing contrast helpers
 * (theme/visual-direction.ts) -- no provider-supplied color ever renders.
 */

export const COMMERCE_SURFACE_RELATIONS_V1 = ["continuous", "soft", "contrast"] as const
export type CommerceSurfaceRelationV1 = (typeof COMMERCE_SURFACE_RELATIONS_V1)[number]

export const COMMERCE_SURFACE_TONES_V1 = ["light", "dark", "auto"] as const
export type CommerceSurfaceToneV1 = (typeof COMMERCE_SURFACE_TONES_V1)[number]

export interface CommerceThemePaletteV1 {
  primary: string
  secondary: string
  background: string
  text: string
  accent: string
}

/** Every value is a 6-digit hex computed by Orvenix. */
export interface CommerceSurfaceV1 {
  tone: "light" | "dark"
  /** Section background. */
  background: string
  /** Card / panel background placed on `background`. */
  card: string
  border: string
  heading: string
  body: string
  muted: string
  /** Price + primary action color, safe on `card`. */
  accent: string
  /** Text color on `accent`. */
  onAccent: string
}

const HEX = /^#[0-9a-f]{6}$/i
const DARK_TEXT = "#0f172a"
const LIGHT_TEXT = "#ffffff"
const MIN_BODY_CONTRAST = 4.5

function hex(value: unknown): string | null {
  return typeof value === "string" && HEX.test(value.trim()) ? value.trim().toLowerCase() : null
}

function toRgb(value: string): [number, number, number] {
  return [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16)) as [number, number, number]
}

/** Linear mix of two hex colors (t = weight of `b`). */
export function mixHexV1(a: string, b: string, t: number): string {
  const ra = toRgb(a)
  const rb = toRgb(b)
  return `#${ra.map((channel, index) => Math.round(channel * (1 - t) + rb[index] * t).toString(16).padStart(2, "0")).join("")}`
}

function isLight(background: string): boolean {
  return readableTextOn(background) === DARK_TEXT
}

/** First candidate with at least `min` contrast on `background`, else the fallback. */
function firstReadable(candidates: ReadonlyArray<string | null>, background: string, min: number, fallback: string): string {
  for (const candidate of candidates) {
    if (!candidate) continue
    const ratio = contrastRatio(candidate, background)
    if (ratio !== null && ratio >= min) return candidate
  }
  return fallback
}

function darkBrandSurface(palette: CommerceThemePaletteV1): string {
  for (const candidate of [hex(palette.text), hex(palette.secondary), hex(palette.primary)]) {
    if (candidate && !isLight(candidate) && (contrastRatio(candidate, LIGHT_TEXT) ?? 0) >= 7) return candidate
  }
  return mixHexV1(hex(palette.primary) ?? "#1e293b", "#000000", 0.72)
}

function lightBrandSurface(palette: CommerceThemePaletteV1): string {
  return lightAccentTint(hex(palette.primary) ?? "#64748b", 0.95) ?? "#f8fafc"
}

export function resolveCommerceSurfaceV1(
  palette: CommerceThemePaletteV1,
  options: { relation?: CommerceSurfaceRelationV1; tone?: CommerceSurfaceToneV1 } = {},
): CommerceSurfaceV1 {
  const base = hex(palette.background) ?? "#ffffff"
  const baseLight = isLight(base)
  const relation = options.relation ?? "continuous"
  const tone: "light" | "dark" =
    options.tone === "light" || options.tone === "dark"
      ? options.tone
      : relation === "contrast"
        ? (baseLight ? "dark" : "light")
        : (baseLight ? "light" : "dark")

  let background: string
  if (relation === "contrast" || tone !== (baseLight ? "light" : "dark")) {
    background = tone === "dark" ? darkBrandSurface(palette) : lightBrandSurface(palette)
  } else if (relation === "soft") {
    background = tone === "light" ? (lightAccentTint(hex(palette.primary) ?? base, 0.94) ?? base) : mixHexV1(base, LIGHT_TEXT, 0.06)
  } else {
    background = base
  }

  const card = tone === "light"
    ? (background === "#ffffff" ? mixHexV1(background, hex(palette.primary) ?? DARK_TEXT, 0.025) : "#ffffff")
    : mixHexV1(background, LIGHT_TEXT, 0.07)

  const heading = tone === "light"
    ? firstReadable([hex(palette.text)], card, MIN_BODY_CONTRAST, DARK_TEXT)
    : LIGHT_TEXT
  const bodyCandidate = mixHexV1(heading, card, 0.25)
  const body = (contrastRatio(bodyCandidate, card) ?? 0) >= MIN_BODY_CONTRAST ? bodyCandidate : heading
  const mutedCandidate = mixHexV1(heading, card, 0.42)
  const muted = hasSafeContrast(mutedCandidate, card) ? mutedCandidate : body
  const border = mixHexV1(heading, card, 0.86)

  const accent = firstReadable([hex(palette.primary), hex(palette.accent), hex(palette.secondary)], card, 3, heading)
  return { tone, background, card, border, heading, body, muted, accent, onAccent: readableTextOn(accent) }
}

/** Accepts only a complete Orvenix-computed surface (every field a 6-digit hex); anything else -> null. */
export function sanitizeCommerceSurfaceV1(value: unknown): CommerceSurfaceV1 | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  if (record.tone !== "light" && record.tone !== "dark") return null
  const keys = ["background", "card", "border", "heading", "body", "muted", "accent", "onAccent"] as const
  const out: Partial<CommerceSurfaceV1> = { tone: record.tone }
  for (const key of keys) {
    const color = hex(record[key])
    if (!color) return null
    out[key] = color
  }
  return out as CommerceSurfaceV1
}

/**
 * Pre-PCE-2 look for trees saved without a surface (existing sites keep
 * rendering exactly as before on their dark store sections).
 */
export const LEGACY_DARK_COMMERCE_SURFACE_V1: CommerceSurfaceV1 = {
  tone: "dark",
  background: "#0f172a",
  card: "#131c2e",
  border: "#232c3d",
  heading: "#ffffff",
  body: "#94a3b8",
  muted: "#475569",
  accent: "#00b5f6",
  onAccent: "#ffffff",
}

/** Honest, non-photographic stand-in for a product without authoritative media. */
export function productMonogramV1(name: string | undefined): string {
  const words = String(name ?? "").normalize("NFC").split(/\s+/).filter((word) => /\p{L}|\p{N}/u.test(word))
  const letters = words.slice(0, 2).map((word) => Array.from(word.replace(/[^\p{L}\p{N}]/gu, ""))[0] ?? "")
  return letters.join("").toLocaleUpperCase("es-MX") || "•"
}
