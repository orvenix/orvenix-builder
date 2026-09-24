/**
 * V2-1 / V2-1.1: deterministic visual-direction baseline.
 *
 * V2-1 originally keyed this purely off the coarse, architectural
 * `siteType` (health/restaurant/agency/ecommerce/business). V2-1.1
 * decouples visual styling from site architecture: `siteType` remains the
 * sole authority for PAGE/SECTION structure (see
 * lib/orvenix-ai/architect/site-architect.ts, untouched by this file), but
 * visual styling is now driven by a separate `VisualFamily`, inferred
 * directly from already-normalized business facts (industry, description,
 * service names, preferred style) -- so two businesses that legitimately
 * share `siteType: "business"` (eg. a physiotherapy clinic and a graphic
 * design studio) can still resolve to materially different visual
 * families, instead of collapsing to the same theme.
 *
 * Every value below is selected from tokens/branches that already exist
 * and are already exercised elsewhere (MEMORY_HUE_TOKENS, the
 * typographyBucket branches, the radiusBucket branches, all in
 * autonomous/site-builder.ts). This file only decides WHICH of those
 * already-safe options a given visual family gets, deterministically.
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
 * Visual families are a STYLING concept, independent of `siteType`
 * (an ARCHITECTURE concept). "professional" is the safe, conservative
 * default for any business Orvenix can't confidently place in a more
 * specific visual family.
 */
export type VisualFamily = "health" | "hospitality" | "creative" | "commerce" | "professional"

/**
 * One direction per recognized visual family, plus a safe "professional"
 * fallback -- deliberately the most conservative entry (neutral hue,
 * "sans" typography, no radius override), so a business Orvenix can't
 * classify still gets the same safe baseline it always has, just
 * explicitly named rather than implicit.
 */
const VISUAL_FAMILY_DIRECTION: Record<VisualFamily, ThemeDirection> = {
  health: {
    accentHue: "blue",
    typographyBucket: "sans",
    radiusBucket: "soft",
  },
  hospitality: {
    accentHue: "orange",
    typographyBucket: "serif",
    radiusBucket: "pill",
  },
  creative: {
    accentHue: "purple",
    typographyBucket: "display",
    radiusBucket: "sharp",
  },
  commerce: {
    accentHue: "green",
    typographyBucket: "sans",
    radiusBucket: "pill",
  },
  professional: {
    accentHue: "neutral",
    typographyBucket: "sans",
  },
}

const DEFAULT_DIRECTION: ThemeDirection = VISUAL_FAMILY_DIRECTION.professional

/**
 * Deterministic, pure: same visual family always returns the same
 * direction object (by value). No randomness, no business-name/fixture-
 * specific branches -- keyed only on the resolved VisualFamily.
 */
export function getVisualDirectionForFamily(family: VisualFamily | undefined): ThemeDirection {
  if (!family) return DEFAULT_DIRECTION
  return VISUAL_FAMILY_DIRECTION[family] ?? DEFAULT_DIRECTION
}

/* ------------------------------------------------------------------ */
/* Visual-family classification (industry/description/services-aware). */
/* ------------------------------------------------------------------ */

function normalize(value?: string): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

/**
 * True when `keyword` starts a word inside `text` -- the same
 * word-boundary discipline used by inferSiteType (site-architect.ts),
 * reimplemented locally so this module has no dependency on the
 * architecture layer. Plain String.includes() would match "dent" inside
 * "identidad", or "salud" inside "saludo" -- ordinary words with no
 * relation to the intended industry -- silently misrouting an unrelated
 * business into the wrong visual family. This is the exact bug class V1
 * hit (and fixed) for inferSiteType; this classifier must not repeat it.
 */
function startsWordIn(text: string, keyword: string): boolean {
  return new RegExp(`\\b${keyword}`).test(text)
}

/**
 * Keyword lists are deliberately small and reviewed individually for
 * substring-collision risk against ordinary, unrelated Spanish words
 * (eg. "venta" was excluded because it also starts "ventana"; "marca"
 * was excluded because it also starts "marcapasos"; "logo" was excluded
 * because it also starts "logopeda"; "grafic"/"menu"/"campana" were
 * excluded as not required once "diseno"/"restaurante" already carry the
 * required signal). Checked in FAMILY_ORDER, first match wins -- this is
 * the explicit precedence the classifier commits to.
 */
const FAMILY_KEYWORDS: Record<Exclude<VisualFamily, "professional">, string[]> = {
  health: ["salud", "clinica", "dent", "doctor", "fisioterap", "rehabilitac", "terapia", "bienestar", "wellness"],
  hospitality: ["restaurante", "comida", "cafeteria", "gastronom", "reservacion", "cocina", "chef"],
  creative: ["diseno", "identidad", "branding", "creativ", "ilustrac", "agencia", "marketing", "publicidad"],
  commerce: ["tienda", "ecommerce", "producto", "comercio", "catalogo", "compra"],
}

const FAMILY_ORDER: Array<Exclude<VisualFamily, "professional">> = ["health", "hospitality", "creative", "commerce"]

/**
 * Coarse fallback only: used exclusively when NO business-facts keyword
 * matched, to still land a business on a plausible family instead of
 * unconditionally defaulting to "professional". siteType is never the
 * primary signal -- see inferVisualFamily below.
 */
const SITE_TYPE_FAMILY_HINT: Record<string, VisualFamily> = {
  health: "health",
  restaurant: "hospitality",
  agency: "creative",
  ecommerce: "commerce",
  business: "professional",
}

export type VisualFamilyInput = {
  industry?: string
  description?: string
  services?: Array<{ name?: string; description?: string }>
  preferredStyle?: string
  /** Coarse fallback hint only -- see SITE_TYPE_FAMILY_HINT. */
  siteTypeHint?: string
}

/**
 * Resolves a VisualFamily from already-normalized business facts.
 * PRIMARY signal: industry + description + service names/descriptions +
 * preferredStyle, matched with word-boundary-safe keywords. Business NAME
 * is intentionally never scanned (a business's chosen name says nothing
 * reliable about its industry -- eg. "Estudio Norte" reveals nothing on
 * its own). SECONDARY, fallback-only signal: siteTypeHint (the existing
 * architecture siteType), consulted only when no keyword matched.
 * Deterministic: identical input always returns the identical family.
 */
export function inferVisualFamily(input: VisualFamilyInput): VisualFamily {
  const serviceText = (input.services ?? [])
    .map((service) => `${service?.name ?? ""} ${service?.description ?? ""}`)
    .join(" ")

  const text = normalize(
    [input.industry, input.description, serviceText, input.preferredStyle].join(" "),
  )

  for (const family of FAMILY_ORDER) {
    if (FAMILY_KEYWORDS[family].some((keyword) => startsWordIn(text, keyword))) {
      return family
    }
  }

  if (input.siteTypeHint) {
    const hint = SITE_TYPE_FAMILY_HINT[input.siteTypeHint]
    if (hint) return hint
  }

  return "professional"
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

/**
 * V2-5B refinement: a light, theme-CONSISTENT tint of a real accent
 * color (mixed toward white) -- no external color library, reuses the
 * same hexToRgb this file already has for contrast checking. `mix` is
 * deliberately high (default 0.92) so the result stays a genuinely
 * LIGHT background regardless of how light/dark/saturated the input
 * hue itself is -- callers that pair this with dark-on-light text
 * (e.g. composer "accent-soft" section tone) can rely on that. Returns
 * null for an unparseable hex, same fail-safe convention as
 * contrastRatio/hasSafeContrast above -- callers decide the fallback.
 */
export function lightAccentTint(hex: string, mix = 0.92): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const blended = rgb.map((channel) => Math.round(channel * (1 - mix) + 255 * mix))
  return `#${blended.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}
