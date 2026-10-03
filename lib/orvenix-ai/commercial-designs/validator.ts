import {
  CREATIVE_DIRECTOR_DENSITY_V1,
  CREATIVE_DIRECTOR_HERO_TREATMENTS_V1,
  CREATIVE_DIRECTOR_HERO_VARIANTS_V1,
  CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1,
  CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1,
  CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1,
  CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1,
  CREATIVE_DIRECTOR_PRICING_TREATMENTS_V1,
  CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1,
  CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1,
  CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1,
} from "@/lib/orvenix-ai/creative-director/contract"
import {
  COMMERCIAL_ASSET_ROLES_V1,
  COMMERCIAL_CONVERSION_INTENTS_V1,
  COMMERCIAL_DESIGN_CONTRACT_VERSION_V1,
  COMMERCIAL_DESIGN_FAMILIES_V1,
  COMMERCIAL_FACT_KEYS_V1,
  COMMERCIAL_FONTS_V1,
  COMMERCIAL_FOOTER_PRESETS_V1,
  COMMERCIAL_IMPLEMENTED_ASSET_ROLES_V1,
  COMMERCIAL_MOTIFS_V1,
  COMMERCIAL_PAGE_ARCHETYPES_V1,
  COMMERCIAL_RADIUS_PRESETS_V1,
  COMMERCIAL_SECTION_ROLES_V1,
  COMMERCIAL_SEO_TITLE_PATTERNS_V1,
  COMMERCIAL_SHADOW_PRESETS_V1,
  COMMERCIAL_SITE_TYPES_V1,
  COMMERCIAL_THEME_MODES_V1,
  type CommercialDesignV1,
} from "./contract"

/**
 * CSC-1B: strict CommercialDesignV1 validator. The registry is trusted
 * code today, but definitions may later be AI-assisted, so EVERY level
 * rejects unknown keys (which is what keeps HTML/JSX/CSS/class/component
 * fields out), every enum is closed, and free text is short plain text.
 */

export type CommercialDesignDiagnosticV1 = { path: string; code: string }
export type CommercialDesignValidationV1 =
  | { ok: true; design: CommercialDesignV1 }
  | { ok: false; diagnostics: CommercialDesignDiagnosticV1[] }

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_RE = /^#[0-9a-fA-F]{6}$/
/** Code-like / markup-like content is never valid design text. */
const CODE_LIKE_RE = /[<>{}`\\]|javascript:|data:|=\s*["']|class(?:Name)?\s*=|style\s*=|\bimport\b|\brequire\(|=>|function\s*\(/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

class Collector {
  readonly diagnostics: CommercialDesignDiagnosticV1[] = []
  add(path: string, code: string) {
    this.diagnostics.push({ path, code })
  }
}

function checkKeys(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[], path: string, out: Collector) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) out.add(`${path}.${key}`, "unknown_key")
  for (const key of required) if (!(key in value)) out.add(`${path}.${key}`, "missing_key")
}

function checkEnum(value: unknown, allowed: readonly string[], path: string, out: Collector) {
  if (typeof value !== "string" || !allowed.includes(value)) out.add(path, "enum_invalid")
}

function checkOptionalEnum(record: Record<string, unknown>, key: string, allowed: readonly string[], path: string, out: Collector) {
  if (key in record) checkEnum(record[key], allowed, `${path}.${key}`, out)
}

function checkText(value: unknown, maxLength: number, path: string, out: Collector) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    out.add(path, "text_invalid")
    return
  }
  if (CODE_LIKE_RE.test(value)) out.add(path, "code_like_text")
}

function checkTextList(value: unknown, maxItems: number, maxLength: number, path: string, out: Collector) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxItems) {
    out.add(path, "list_invalid")
    return
  }
  value.forEach((entry, index) => checkText(entry, maxLength, `${path}[${index}]`, out))
}

function checkEnumList(value: unknown, allowed: readonly string[], path: string, out: Collector, options: { allowEmpty?: boolean } = {}) {
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0) || value.length > 16) {
    out.add(path, "list_invalid")
    return
  }
  const seen = new Set<string>()
  value.forEach((entry, index) => {
    checkEnum(entry, allowed, `${path}[${index}]`, out)
    if (typeof entry === "string") {
      if (seen.has(entry)) out.add(`${path}[${index}]`, "duplicate")
      seen.add(entry)
    }
  })
}

const PIN_KEYS = ["heroVariant", "heroTreatment", "processTreatment", "sectionToneStrategy"] as const

function checkPins(value: unknown, path: string, out: Collector) {
  if (!isRecord(value)) return out.add(path, "not_object")
  checkKeys(value, PIN_KEYS, [], path, out)
  checkOptionalEnum(value, "heroVariant", CREATIVE_DIRECTOR_HERO_VARIANTS_V1, path, out)
  checkOptionalEnum(value, "heroTreatment", CREATIVE_DIRECTOR_HERO_TREATMENTS_V1, path, out)
  checkOptionalEnum(value, "processTreatment", CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1, path, out)
  checkOptionalEnum(value, "sectionToneStrategy", CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1, path, out)
}

function checkAssetRoles(value: unknown, path: string, out: Collector) {
  checkEnumList(value, COMMERCIAL_ASSET_ROLES_V1, path, out)
  if (!Array.isArray(value)) return
  value.forEach((role, index) => {
    if (typeof role === "string" && (COMMERCIAL_ASSET_ROLES_V1 as readonly string[]).includes(role) && !(COMMERCIAL_IMPLEMENTED_ASSET_ROLES_V1 as readonly string[]).includes(role)) {
      out.add(`${path}[${index}]`, "asset_role_not_implemented")
    }
  })
}

function checkSection(value: unknown, path: string, out: Collector) {
  if (!isRecord(value)) return out.add(path, "not_object")
  checkKeys(value, ["role", "requiresFacts", "requiresAssets", "assetRoles"], ["role"], path, out)
  checkEnum(value.role, COMMERCIAL_SECTION_ROLES_V1, `${path}.role`, out)
  if ("requiresFacts" in value) checkEnumList(value.requiresFacts, COMMERCIAL_FACT_KEYS_V1, `${path}.requiresFacts`, out)
  if ("requiresAssets" in value) checkAssetRoles(value.requiresAssets, `${path}.requiresAssets`, out)
  if ("assetRoles" in value) checkAssetRoles(value.assetRoles, `${path}.assetRoles`, out)
}

function checkPage(value: unknown, path: string, out: Collector) {
  if (!isRecord(value)) return out.add(path, "not_object")
  checkKeys(value, ["slug", "name", "archetype", "requiresFacts", "pins", "pinFallbacks", "sections"], ["slug", "name", "archetype", "sections"], path, out)
  if (typeof value.slug !== "string" || value.slug.length > 40 || !SLUG_RE.test(value.slug)) out.add(`${path}.slug`, "slug_invalid")
  checkText(value.name, 40, `${path}.name`, out)
  checkEnum(value.archetype, COMMERCIAL_PAGE_ARCHETYPES_V1, `${path}.archetype`, out)
  if ("requiresFacts" in value) checkEnumList(value.requiresFacts, COMMERCIAL_FACT_KEYS_V1, `${path}.requiresFacts`, out)
  if ("pins" in value) checkPins(value.pins, `${path}.pins`, out)
  if ("pinFallbacks" in value) {
    if (!Array.isArray(value.pinFallbacks) || value.pinFallbacks.length > 8) out.add(`${path}.pinFallbacks`, "list_invalid")
    else value.pinFallbacks.forEach((fallback, index) => {
      const fallbackPath = `${path}.pinFallbacks[${index}]`
      if (!isRecord(fallback)) return out.add(fallbackPath, "not_object")
      checkKeys(fallback, ["whenMissing", "pins"], ["whenMissing", "pins"], fallbackPath, out)
      const whenMissing = fallback.whenMissing
      const valid = typeof whenMissing === "string" && (
        (COMMERCIAL_FACT_KEYS_V1 as readonly string[]).includes(whenMissing) ||
        (whenMissing.startsWith("asset:") && (COMMERCIAL_IMPLEMENTED_ASSET_ROLES_V1 as readonly string[]).includes(whenMissing.slice(6)))
      )
      if (!valid) out.add(`${fallbackPath}.whenMissing`, "enum_invalid")
      checkPins(fallback.pins, `${fallbackPath}.pins`, out)
    })
  }
  if (!Array.isArray(value.sections) || value.sections.length === 0 || value.sections.length > 14) {
    out.add(`${path}.sections`, "list_invalid")
    return
  }
  value.sections.forEach((section, index) => checkSection(section, `${path}.sections[${index}]`, out))
  const roles = value.sections.map((section) => (isRecord(section) ? section.role : undefined))
  if (roles.includes("navigation") && roles[0] !== "navigation") out.add(`${path}.sections`, "navigation_not_first")
  if (roles.includes("footer") && roles[roles.length - 1] !== "footer") out.add(`${path}.sections`, "footer_not_last")
}

export function validateCommercialDesignV1(value: unknown): CommercialDesignValidationV1 {
  const out = new Collector()
  if (!isRecord(value)) return { ok: false, diagnostics: [{ path: "$", code: "not_object" }] }

  checkKeys(
    value,
    ["contract", "id", "version", "family", "siteType", "catalog", "theme", "chrome", "conversion", "motif", "seo", "pages", "internalReference"],
    ["contract", "id", "version", "family", "siteType", "catalog", "theme", "chrome", "conversion", "motif", "seo", "pages", "internalReference"],
    "$",
    out,
  )
  if (value.contract !== COMMERCIAL_DESIGN_CONTRACT_VERSION_V1) out.add("$.contract", "version_invalid")
  if (typeof value.id !== "string" || value.id.length > 64 || !SLUG_RE.test(value.id)) out.add("$.id", "slug_invalid")
  if (typeof value.version !== "number" || !Number.isSafeInteger(value.version) || value.version < 1 || value.version > 9999) out.add("$.version", "version_invalid")
  checkEnum(value.family, COMMERCIAL_DESIGN_FAMILIES_V1, "$.family", out)
  checkEnum(value.siteType, COMMERCIAL_SITE_TYPES_V1, "$.siteType", out)
  checkEnum(value.motif, COMMERCIAL_MOTIFS_V1, "$.motif", out)
  checkText(value.internalReference, 120, "$.internalReference", out)

  if (!isRecord(value.catalog)) out.add("$.catalog", "not_object")
  else {
    checkKeys(value.catalog, ["name", "summary", "businessFit", "styleLabels"], ["name", "summary", "businessFit", "styleLabels"], "$.catalog", out)
    checkText(value.catalog.name, 60, "$.catalog.name", out)
    checkText(value.catalog.summary, 280, "$.catalog.summary", out)
    checkTextList(value.catalog.businessFit, 12, 40, "$.catalog.businessFit", out)
    checkTextList(value.catalog.styleLabels, 6, 40, "$.catalog.styleLabels", out)
  }

  if (!isRecord(value.theme)) out.add("$.theme", "not_object")
  else {
    checkKeys(value.theme, ["mode", "colors", "fontHeading", "fontBody", "radius", "shadow"], ["mode", "colors", "fontHeading", "fontBody", "radius", "shadow"], "$.theme", out)
    checkEnum(value.theme.mode, COMMERCIAL_THEME_MODES_V1, "$.theme.mode", out)
    checkEnum(value.theme.fontHeading, COMMERCIAL_FONTS_V1, "$.theme.fontHeading", out)
    checkEnum(value.theme.fontBody, COMMERCIAL_FONTS_V1, "$.theme.fontBody", out)
    checkEnum(value.theme.radius, COMMERCIAL_RADIUS_PRESETS_V1, "$.theme.radius", out)
    checkEnum(value.theme.shadow, COMMERCIAL_SHADOW_PRESETS_V1, "$.theme.shadow", out)
    const colors = value.theme.colors
    if (!isRecord(colors)) out.add("$.theme.colors", "not_object")
    else {
      const colorKeys = ["primary", "secondary", "background", "text", "accent"]
      checkKeys(colors, colorKeys, colorKeys, "$.theme.colors", out)
      for (const key of colorKeys) if (typeof colors[key] !== "string" || !HEX_RE.test(colors[key] as string)) out.add(`$.theme.colors.${key}`, "color_invalid")
    }
  }

  if (!isRecord(value.chrome)) out.add("$.chrome", "not_object")
  else {
    const chromeKeys = ["density", "navigationSurfaceStyle", "navigationContainment", "navigationLinkStyle", "navigationCtaEmphasis", "trustTreatment", "pricingTreatment", "footerPreset", "showLogo"]
    checkKeys(value.chrome, chromeKeys, ["footerPreset", "showLogo"], "$.chrome", out)
    checkOptionalEnum(value.chrome, "density", CREATIVE_DIRECTOR_DENSITY_V1, "$.chrome", out)
    checkOptionalEnum(value.chrome, "navigationSurfaceStyle", CREATIVE_DIRECTOR_NAVIGATION_SURFACE_STYLES_V1, "$.chrome", out)
    checkOptionalEnum(value.chrome, "navigationContainment", CREATIVE_DIRECTOR_NAVIGATION_CONTAINMENTS_V1, "$.chrome", out)
    checkOptionalEnum(value.chrome, "navigationLinkStyle", CREATIVE_DIRECTOR_NAVIGATION_LINK_STYLES_V1, "$.chrome", out)
    checkOptionalEnum(value.chrome, "navigationCtaEmphasis", CREATIVE_DIRECTOR_NAVIGATION_CTA_EMPHASES_V1, "$.chrome", out)
    checkOptionalEnum(value.chrome, "trustTreatment", CREATIVE_DIRECTOR_TRUST_TREATMENTS_V1, "$.chrome", out)
    checkOptionalEnum(value.chrome, "pricingTreatment", CREATIVE_DIRECTOR_PRICING_TREATMENTS_V1, "$.chrome", out)
    checkEnum(value.chrome.footerPreset, COMMERCIAL_FOOTER_PRESETS_V1, "$.chrome.footerPreset", out)
    if (typeof value.chrome.showLogo !== "boolean") out.add("$.chrome.showLogo", "boolean_invalid")
  }

  if (!isRecord(value.conversion)) out.add("$.conversion", "not_object")
  else {
    checkKeys(value.conversion, ["primary"], ["primary"], "$.conversion", out)
    checkEnumList(value.conversion.primary, COMMERCIAL_CONVERSION_INTENTS_V1, "$.conversion.primary", out)
  }

  if (!isRecord(value.seo)) out.add("$.seo", "not_object")
  else {
    checkKeys(value.seo, ["titlePattern"], ["titlePattern"], "$.seo", out)
    checkEnum(value.seo.titlePattern, COMMERCIAL_SEO_TITLE_PATTERNS_V1, "$.seo.titlePattern", out)
  }

  if (!Array.isArray(value.pages) || value.pages.length === 0 || value.pages.length > 8) out.add("$.pages", "list_invalid")
  else {
    value.pages.forEach((page, index) => checkPage(page, `$.pages[${index}]`, out))
    const slugs = value.pages.map((page) => (isRecord(page) ? page.slug : undefined))
    if (slugs[0] !== "home") out.add("$.pages[0].slug", "home_must_be_first")
    if (new Set(slugs).size !== slugs.length) out.add("$.pages", "duplicate_slug")
    const home = value.pages[0]
    if (isRecord(home) && "requiresFacts" in home) out.add("$.pages[0].requiresFacts", "home_cannot_be_conditional")
  }

  return out.diagnostics.length ? { ok: false, diagnostics: out.diagnostics } : { ok: true, design: value as unknown as CommercialDesignV1 }
}
