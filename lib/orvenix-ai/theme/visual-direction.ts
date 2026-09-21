/**
 * V2-1: deterministic visual-direction baseline.
 *
 * Maps the already-computed, coarse `siteType` (health/restaurant/agency/
 * ecommerce/business) to a theme "direction" object in the exact shape
 * `applyThemeDirection` (autonomous/site-builder.ts) already understands --
 * accentHue/typographyBucket/radiusBucket. This introduces NO new color
 * values, font names, or radius values: every value below is selected from
 * tokens/branches that already exist and are already exercised elsewhere
 * (MEMORY_HUE_TOKENS, the typographyBucket branches, the radiusBucket
 * branches). This file only decides WHICH of those already-safe options a
 * given business family gets, deterministically.
 *
 * This is intentionally NOT a new site-architecture authority: it never
 * touches pages, sections, roles, or archetypes -- only GlobalTheme fields
 * (colors/fonts/radius), which is exactly what applyThemeDirection already
 * scopes itself to.
 *
 * Pure, dependency-free, framework-agnostic on purpose: this module is
 * imported by lib/orvenix-ai/autonomous/site-builder.ts, which is exercised
 * extensively by the plain-Node unit test suite (not the Next.js build
 * pipeline) -- it must never import next/font or any React/DOM code.
 */

export type ThemeDirection = {
  accentHue?: string
  typographyBucket?: string
  radiusBucket?: string
}

/**
 * One direction per recognized siteType family, plus a safe "business"
 * fallback for every business that doesn't match a named industry --
 * deliberately the most conservative entry (neutral hue, "sans"
 * typography, no radius override), so a business Orvenix can't classify
 * still gets the same safe baseline it always has, just explicitly named
 * rather than implicit.
 */
const SITE_TYPE_VISUAL_DIRECTION: Record<string, ThemeDirection> = {
  health: {
    accentHue: "blue",
    typographyBucket: "sans",
    radiusBucket: "soft",
  },
  restaurant: {
    accentHue: "orange",
    typographyBucket: "serif",
    radiusBucket: "pill",
  },
  agency: {
    accentHue: "purple",
    typographyBucket: "display",
    radiusBucket: "sharp",
  },
  ecommerce: {
    accentHue: "green",
    typographyBucket: "sans",
    radiusBucket: "pill",
  },
  business: {
    accentHue: "neutral",
    typographyBucket: "sans",
  },
}

const DEFAULT_DIRECTION: ThemeDirection = SITE_TYPE_VISUAL_DIRECTION.business

/**
 * Deterministic, pure: same siteType always returns the same direction
 * object (by value). No randomness, no business-name/fixture-specific
 * branches -- keyed only on the already-computed, generic siteType.
 */
export function getDeterministicVisualDirection(siteType: string | undefined): ThemeDirection {
  if (!siteType) return DEFAULT_DIRECTION
  return SITE_TYPE_VISUAL_DIRECTION[siteType] ?? DEFAULT_DIRECTION
}

/* ------------------------------------------------------------------ */
/* Minimal WCAG contrast-ratio safety net (no dependency).             */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, "")
  const expanded =
    normalized.length === 3
      ? normalized.split("").map((c) => c + c).join("")
      : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null

  const value = Number.parseInt(expanded, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const srgb = c / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }

  const [rl, gl, bl] = [channel(r), channel(g), channel(b)]
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/**
 * Standard WCAG contrast ratio (1..21) between two hex colors. Returns
 * null (fail-safe: treated as "unknown/unsafe" by callers) if either
 * value isn't a parseable hex color.
 */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const rgbA = hexToRgb(hexA)
  const rgbB = hexToRgb(hexB)
  if (!rgbA || !rgbB) return null

  const lumA = relativeLuminance(rgbA)
  const lumB = relativeLuminance(rgbB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)

  return (lighter + 0.05) / (darker + 0.05)
}

/** WCAG "large text"/UI-component minimum. Deliberately not the stricter
 * 4.5:1 body-text threshold -- these checks guard heading/accent colors
 * against a background, not paragraph body text. */
export const MIN_SAFE_CONTRAST = 3

export function hasSafeContrast(foregroundHex: string, backgroundHex: string): boolean {
  const ratio = contrastRatio(foregroundHex, backgroundHex)
  return ratio !== null && ratio >= MIN_SAFE_CONTRAST
}
