import type { AssetRole, AssetSearchContext } from "./types"

/**
 * Deterministic stock-photo search intent, never the raw user prompt.
 * Allowed inputs: VisualFamily, role, normalized industry, service
 * names/descriptions -- never business name, location, email, phone,
 * address, or freeform description text (see resolve-tree-assets.ts).
 *
 * Pure, dependency-free: no network, no React/DOM -- safe for the
 * plain-Node unit test suite, same constraint as theme/visual-direction.ts.
 */

function normalize(value?: string): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

/** Word-boundary-safe match, same discipline as inferSiteType/inferVisualFamily -- never a raw substring check. */
function startsWordIn(text: string, keyword: string): boolean {
  return new RegExp(`\\b${keyword}`).test(text)
}

const MAX_QUERY_LENGTH = 60

function boundQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH)
}

/**
 * Small, general industry-keyword -> English stock-photo phrase table.
 * Reviewed for relevance as SEARCH terms specifically (not classification
 * terms) -- eg. "identidad" is a great VisualFamily classification
 * keyword but a useless photo-search term, so it is deliberately absent
 * here even though it exists in visual-direction.ts's keyword lists.
 */
const INDUSTRY_INTENT_KEYWORDS: Array<{ keyword: string; intent: string }> = [
  { keyword: "fisioterap", intent: "physical therapy clinic" },
  { keyword: "rehabilitac", intent: "rehabilitation clinic" },
  { keyword: "dent", intent: "dental clinic" },
  { keyword: "clinica", intent: "medical clinic" },
  { keyword: "restaurante", intent: "restaurant dining" },
  { keyword: "cafeteria", intent: "cafe coffee shop" },
  { keyword: "gastronom", intent: "restaurant kitchen" },
  { keyword: "diseno", intent: "graphic designer workspace" },
  { keyword: "branding", intent: "branding design workspace" },
  { keyword: "marketing", intent: "creative agency office" },
  { keyword: "tienda", intent: "retail store" },
  { keyword: "ecommerce", intent: "online store packaging" },
]

/**
 * V2-2.1: "graphic design studio" (the original creative family fallback)
 * returned a weak/unprofessional hero in the real-provider E2E. Replaced
 * with "creative design studio" -- still a small, general, role-agnostic
 * phrase, not tuned to any one fixture -- per the reviewed direction in
 * V2-2.1 Section 4. Restaurant/health intents were explicitly accepted
 * as-is in that review; left untouched here.
 */
const FAMILY_INTENT: Record<string, string> = {
  health: "healthcare clinic professional",
  hospitality: "restaurant dining experience",
  creative: "creative design studio",
  commerce: "retail store products",
  professional: "modern office business",
}

const ROLE_GENERIC_INTENT: Record<AssetRole, string> = {
  hero: "professional team business",
  gallery: "modern workspace interior",
}

/**
 * Ordered, deduplicated fallback hierarchy: industry-specific intent (if a
 * keyword matched) -> visual-family intent -> role-safe generic intent.
 * Always returns at least one entry. Callers try each in order until a
 * provider search returns candidates.
 */
export function buildSearchIntentHierarchy(context: AssetSearchContext & { role: AssetRole }): string[] {
  const serviceText = (context.services ?? [])
    .map((service) => `${service?.name ?? ""} ${service?.description ?? ""}`)
    .join(" ")
  const text = normalize([context.industry, serviceText].join(" "))

  const specific = INDUSTRY_INTENT_KEYWORDS.find((entry) => startsWordIn(text, entry.keyword))?.intent
  const familyIntent = FAMILY_INTENT[context.visualFamily] ?? FAMILY_INTENT.professional
  const genericIntent = ROLE_GENERIC_INTENT[context.role]

  const hierarchy = [specific, familyIntent, genericIntent].filter((value): value is string => Boolean(value))

  return [...new Set(hierarchy)].map(boundQuery)
}
