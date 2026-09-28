import type {
  CommerceCreativeCtaIntentV1,
  CommerceCreativeDensityV1,
  CommerceCreativeEmphasisV1,
  CommerceCreativeMediaIntentV1,
  CommerceCreativeNarrativeIntentV1,
  CommerceCreativeRelationV1,
} from "@/lib/orvenix-ai/commerce/architecture-contract"
import type { FullSiteCreativeBlueprintV1, FullSiteCreativePageV1, FullSiteCreativeSectionV1 } from "./contract"

/**
 * COMMERCE-3C: the ONE place where Full-Site Blueprint creative fields
 * (including the two free-text ones, narrative/mediaIntent) are turned
 * into CLOSED enums. Downstream (commerce architecture -> SectionInstancePlan
 * -> composer) only ever sees these enums, never provider prose.
 *
 * Free text is interpreted deterministically: an exact vocabulary token
 * wins; otherwise a small, closed keyword table (es/en) classifies it;
 * otherwise the value is ADVISORY (undefined) and the structural default
 * applies. Nothing here can produce copy, CSS, routes or ids.
 */

export const COMMERCE_NARRATIVE_INTENTS_V1 = [
  "product-led",
  "category-discovery",
  "editorial-story",
  "benefit-led",
  "trust-led",
  "conversion-led",
  "minimal-introduction",
  "catalog-orientation",
] as const satisfies readonly CommerceCreativeNarrativeIntentV1[]

export const COMMERCE_MEDIA_INTENTS_V1 = ["none", "minimal", "supporting", "dominant", "product-focus", "gallery"] as const satisfies readonly CommerceCreativeMediaIntentV1[]

function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .trim()
}

function classify<T extends string>(text: string | undefined, tokens: readonly T[], keywords: ReadonlyArray<readonly [RegExp, T]>): T | undefined {
  if (!text) return undefined
  const token = normalizeToken(text)
  const exact = tokens.find((candidate) => candidate === token)
  if (exact) return exact
  const plain = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
  return keywords.find(([pattern]) => pattern.test(plain))?.[1]
}

const NARRATIVE_KEYWORDS: ReadonlyArray<readonly [RegExp, CommerceCreativeNarrativeIntentV1]> = [
  [/\b(minimal|minima|breve|sobri|simple|discret)/, "minimal-introduction"],
  [/\b(categor|coleccion|collection|explor|descubr|discover)/, "category-discovery"],
  [/\b(editorial|historia|story|relato|narra|inspira)/, "editorial-story"],
  [/\b(beneficio|benefit|ventaja|por que|why)/, "benefit-led"],
  [/\b(confianza|trust|segur|transparen|claridad)/, "trust-led"],
  [/\b(convers|conver|compra|comprar|buy|checkout|carrito|cart|decid)/, "conversion-led"],
  [/\b(catalog|todo el|todos los|recorr|browse|surtido|variedad)/, "catalog-orientation"],
  [/\b(producto|product|protagon|hero product|estrella)/, "product-led"],
]

const MEDIA_KEYWORDS: ReadonlyArray<readonly [RegExp, CommerceCreativeMediaIntentV1]> = [
  [/\b(sin imagen|no image|without image|solo texto|text only|ninguna)/, "none"],
  [/\b(minimal|minima|discret|sutil|subtle|texto domina|copy-led)/, "minimal"],
  [/\b(galer|gallery|mosaico|mosaic)/, "gallery"],
  [/\b(producto|product|packshot|detalle del producto)/, "product-focus"],
  [/\b(dominan|protagon|inmers|immersive|grande|large|full|editorial)/, "dominant"],
  [/\b(apoyo|support|acompan|secondary|secundari|fondo|background)/, "supporting"],
]

export function normalizeNarrativeIntentV1(text: string | undefined): CommerceCreativeNarrativeIntentV1 | undefined {
  return classify(text, COMMERCE_NARRATIVE_INTENTS_V1, NARRATIVE_KEYWORDS)
}

/** "background" media is not safely supported by the V1 renderer: it resolves to "supporting" (documented, tested). */
export function normalizeMediaIntentV1(text: string | undefined): CommerceCreativeMediaIntentV1 | undefined {
  return classify(text, COMMERCE_MEDIA_INTENTS_V1, MEDIA_KEYWORDS)
}

const SITE_NARRATIVE_DEFAULT: Record<FullSiteCreativeBlueprintV1["siteConcept"]["narrative"], CommerceCreativeNarrativeIntentV1> = {
  editorial: "editorial-story",
  catalog: "catalog-orientation",
  "product-led": "product-led",
  "conversion-led": "conversion-led",
  professional: "trust-led",
}

const SECTION_INTENT_NARRATIVE: Partial<Record<FullSiteCreativeSectionV1["intent"], CommerceCreativeNarrativeIntentV1>> = {
  navigation_discovery: "category-discovery",
  spotlight: "product-led",
  detail_surface: "product-led",
  related_items: "category-discovery",
  benefits: "benefit-led",
  trust: "trust-led",
  catalog_surface: "catalog-orientation",
}

const SECTION_INTENT_MEDIA: Partial<Record<FullSiteCreativeSectionV1["intent"], CommerceCreativeMediaIntentV1>> = {
  spotlight: "product-focus",
  detail_surface: "product-focus",
}

function densityFromPage(value: FullSiteCreativePageV1["density"]): CommerceCreativeDensityV1 | undefined {
  if (value === "compact") return "compact"
  if (value === "balanced") return "balanced"
  if (value === "immersive") return "spacious"
  return undefined
}

function densityFromSite(value: FullSiteCreativeBlueprintV1["siteConcept"]["density"]): CommerceCreativeDensityV1 {
  if (value === "rich") return "compact"
  if (value === "minimal") return "spacious"
  return "balanced"
}

export type ResolvedSectionCreativeIntentV1 = {
  narrative?: CommerceCreativeNarrativeIntentV1
  media?: CommerceCreativeMediaIntentV1
  cta?: CommerceCreativeCtaIntentV1
  emphasis?: CommerceCreativeEmphasisV1
  density: CommerceCreativeDensityV1
  relation?: CommerceCreativeRelationV1
}

/**
 * Deterministic precedence (site coherence):
 *   narrative: section.narrative > page.narrativeGoal > section-intent structural default > siteConcept.narrative
 *   density:   page.density > siteConcept.density
 *   emphasis:  section.emphasis > siteConcept.rhythm "immersive" (heroic openings)
 *   media:     section.mediaIntent > section-intent structural default
 */
export function resolveSectionCreativeIntentV1(params: {
  blueprint: FullSiteCreativeBlueprintV1
  page: FullSiteCreativePageV1
  section: FullSiteCreativeSectionV1
}): ResolvedSectionCreativeIntentV1 {
  const { blueprint, page, section } = params
  const narrative =
    normalizeNarrativeIntentV1(section.narrative) ??
    normalizeNarrativeIntentV1(page.narrativeGoal) ??
    SECTION_INTENT_NARRATIVE[section.intent] ??
    (section.emphasis === "conversion" ? "conversion-led" : undefined) ??
    SITE_NARRATIVE_DEFAULT[blueprint.siteConcept.narrative]
  const media = normalizeMediaIntentV1(section.mediaIntent) ?? SECTION_INTENT_MEDIA[section.intent]
  const emphasis: CommerceCreativeEmphasisV1 | undefined =
    section.emphasis ?? (blueprint.siteConcept.rhythm === "immersive" && section.intent === "opening" ? "heroic" : undefined)
  const cta = mapBlueprintCtaIntentV1(section)
  return {
    narrative,
    ...(media ? { media } : {}),
    ...(cta ? { cta } : {}),
    ...(emphasis ? { emphasis } : {}),
    density: densityFromPage(page.density) ?? densityFromSite(blueprint.siteConcept.density),
    ...(section.relationToPrevious ? { relation: section.relationToPrevious } : {}),
  }
}

/** Blueprint CTA vocabulary -> commerce action intent (destinations are resolved later, by Orvenix only). */
export function mapBlueprintCtaIntentV1(section: FullSiteCreativeSectionV1): CommerceCreativeCtaIntentV1 | undefined {
  const singleProduct = section.refs?.filter((ref) => ref.kind === "product").length === 1
  const hasCategory = Boolean(section.refs?.some((ref) => ref.kind === "category"))
  switch (section.ctaIntent) {
    case "browse":
      return hasCategory ? "view_category" : "browse_catalog"
    case "buy":
    case "learn":
      return singleProduct ? "view_product" : hasCategory ? "view_category" : "browse_catalog"
    case "contact":
      return "contact"
    case "none":
      return "none"
    default:
      return undefined
  }
}
