import { createHash } from "crypto"
import type { SectionRole } from "@/lib/orvenix-ai/architect"
import { isValidSectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
  FULL_SITE_CART_PROMINENCE_V1,
  FULL_SITE_CTA_INTENTS_V1,
  FULL_SITE_EMPHASES_V1,
  FULL_SITE_NAVIGATION_CONCEPTS_V1,
  FULL_SITE_PAGE_DENSITIES_V1,
  FULL_SITE_PRODUCT_CARD_TREATMENTS_V1,
  FULL_SITE_MERCHANDISING_COMPOSITIONS_V1,
  FULL_SITE_REF_KINDS_V1,
  FULL_SITE_RELATIONS_V1,
  FULL_SITE_RHYTHMS_V1,
  FULL_SITE_SITE_DENSITIES_V1,
  FULL_SITE_SITE_NARRATIVES_V1,
  FULL_SITE_PAGE_PURPOSES_V1,
  FULL_SITE_SECTION_INTENTS_V1,
  type FullSiteContentRefV1,
  type FullSiteCreativeBlueprintV1,
  type FullSiteCreativeSectionV1,
} from "./contract"
import { FULL_SITE_BLUEPRINT_LIMITS_V1 } from "./capability-manifest"

export interface FullSiteCreativeGroundingContextV1 {
  productCount?: number
  categoryKeys?: readonly string[]
  serviceCount?: number
  evidenceCount?: number
  maxPages?: number
}

export type FullSiteCreativeValidationResultV1 =
  | { ok: true; blueprint: FullSiteCreativeBlueprintV1; warnings: string[]; fingerprint: string }
  | { ok: false; errors: string[]; warnings: string[] }

const PAGE_PURPOSES = new Set<string>(FULL_SITE_PAGE_PURPOSES_V1)
const SECTION_INTENTS = new Set<string>(FULL_SITE_SECTION_INTENTS_V1)
const NAV_CONCEPTS = new Set<string>(FULL_SITE_NAVIGATION_CONCEPTS_V1)
const SITE_NARRATIVES = new Set<string>(FULL_SITE_SITE_NARRATIVES_V1)
const RHYTHMS = new Set<string>(FULL_SITE_RHYTHMS_V1)
const SITE_DENSITIES = new Set<string>(FULL_SITE_SITE_DENSITIES_V1)
const PAGE_DENSITIES = new Set<string>(FULL_SITE_PAGE_DENSITIES_V1)
const CTA_INTENTS = new Set<string>(FULL_SITE_CTA_INTENTS_V1)
const EMPHASES = new Set<string>(FULL_SITE_EMPHASES_V1)
const RELATIONS = new Set<string>(FULL_SITE_RELATIONS_V1)
const PRODUCT_CARD_TREATMENTS = new Set<string>(FULL_SITE_PRODUCT_CARD_TREATMENTS_V1)
const MERCHANDISING_COMPOSITIONS = new Set<string>(FULL_SITE_MERCHANDISING_COMPOSITIONS_V1)
const CART_PROMINENCE = new Set<string>(FULL_SITE_CART_PROMINENCE_V1)
const REF_KINDS = new Set<string>(FULL_SITE_REF_KINDS_V1)
const ROLE_VALUES = new Set<SectionRole>([
  "navigation",
  "hero",
  "trust",
  "services",
  "features",
  "gallery",
  "products",
  "pricing",
  "testimonials",
  "process",
  "faq",
  "contact",
  "cta",
  "footer",
  "content",
])
const UNSAFE_KEY_PATTERN = /(?:className|style|css|html|jsx|react|script|component|productId|variantId|siteId|sku|price|stock|url|href|route|path)/i
const UNSAFE_TEXT_PATTERN = new RegExp("javascript:|<script|<[^>]+>|class=|style=|https?://|/api/|\\.tsx|React\\.", "i")

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function onlyKeys(value: Record<string, unknown>, keys: readonly string[], path: string, errors: string[]) {
  const allowed = new Set(keys)
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) || UNSAFE_KEY_PATTERN.test(key)) errors.push(`${path}.${key} no permitido.`)
  }
}

function cleanText(value: unknown, max: number, path: string, errors: string[]): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== "string") {
    errors.push(`${path} debe ser texto.`)
    return undefined
  }
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, max)
  if (UNSAFE_TEXT_PATTERN.test(normalized)) {
    errors.push(`${path} contiene contenido no permitido.`)
    return undefined
  }
  return normalized || undefined
}

function validateRef(value: unknown, context: FullSiteCreativeGroundingContextV1, path: string, errors: string[]): FullSiteContentRefV1 | null {
  if (!isRecord(value)) {
    errors.push(`${path} debe ser referencia.`)
    return null
  }
  onlyKeys(value, ["kind", "index", "key"], path, errors)
  if (typeof value.kind !== "string" || !REF_KINDS.has(value.kind)) {
    errors.push(`${path}.kind invalido.`)
    return null
  }
  if (value.kind === "category") {
    const key = cleanText(value.key, 80, `${path}.key`, errors)
    if (!key || !(context.categoryKeys ?? []).includes(key)) {
      errors.push(`${path}.key no existe.`)
      return null
    }
    return { kind: "category", key }
  }
  if (typeof value.index !== "number" || !Number.isInteger(value.index) || value.index < 0) {
    errors.push(`${path}.index invalido.`)
    return null
  }
  const limit = value.kind === "product"
    ? context.productCount ?? 0
    : value.kind === "service"
      ? context.serviceCount ?? 0
      : context.evidenceCount ?? 0
  if (value.index >= limit) {
    errors.push(`${path}.index fuera de rango.`)
    return null
  }
  return { kind: value.kind, index: value.index } as FullSiteContentRefV1
}

function validateSection(value: unknown, context: FullSiteCreativeGroundingContextV1, path: string, errors: string[]): FullSiteCreativeSectionV1 | null {
  if (!isRecord(value)) {
    errors.push(`${path} debe ser seccion.`)
    return null
  }
  onlyKeys(value, ["intent", "role", "refs", "narrative", "mediaIntent", "ctaIntent", "layout", "emphasis", "relationToPrevious", "productCardTreatment", "merchandisingComposition"], path, errors)
  if (typeof value.intent !== "string" || !SECTION_INTENTS.has(value.intent)) errors.push(`${path}.intent invalido.`)
  if (typeof value.role !== "string" || !ROLE_VALUES.has(value.role as SectionRole)) errors.push(`${path}.role invalido.`)
  const refs = Array.isArray(value.refs)
    ? value.refs.slice(0, FULL_SITE_BLUEPRINT_LIMITS_V1.maxRefsPerSection).map((ref, index) => validateRef(ref, context, `${path}.refs[${index}]`, errors)).filter((ref): ref is FullSiteContentRefV1 => Boolean(ref))
    : undefined
  if (value.layout !== undefined && !isValidSectionVisualLayoutPlan(value.layout, value.role as SectionRole)) errors.push(`${path}.layout invalido.`)
  if (value.ctaIntent !== undefined && (typeof value.ctaIntent !== "string" || !CTA_INTENTS.has(value.ctaIntent))) errors.push(`${path}.ctaIntent invalido.`)
  if (value.emphasis !== undefined && (typeof value.emphasis !== "string" || !EMPHASES.has(value.emphasis))) errors.push(`${path}.emphasis invalido.`)
  if (value.relationToPrevious !== undefined && (typeof value.relationToPrevious !== "string" || !RELATIONS.has(value.relationToPrevious))) errors.push(`${path}.relationToPrevious invalido.`)
  if (value.productCardTreatment !== undefined && (typeof value.productCardTreatment !== "string" || !PRODUCT_CARD_TREATMENTS.has(value.productCardTreatment))) errors.push(`${path}.productCardTreatment invalido.`)
  if (value.merchandisingComposition !== undefined && (typeof value.merchandisingComposition !== "string" || !MERCHANDISING_COMPOSITIONS.has(value.merchandisingComposition))) errors.push(`${path}.merchandisingComposition invalido.`)
  const narrative = cleanText(value.narrative, FULL_SITE_BLUEPRINT_LIMITS_V1.maxNarrativeLength, `${path}.narrative`, errors)
  const mediaIntent = cleanText(value.mediaIntent, FULL_SITE_BLUEPRINT_LIMITS_V1.maxMediaIntentLength, `${path}.mediaIntent`, errors)
  if (typeof value.intent !== "string" || typeof value.role !== "string" || !SECTION_INTENTS.has(value.intent) || !ROLE_VALUES.has(value.role as SectionRole)) return null
  return {
    intent: value.intent as FullSiteCreativeSectionV1["intent"],
    role: value.role as SectionRole,
    ...(refs?.length ? { refs } : {}),
    ...(narrative ? { narrative } : {}),
    ...(mediaIntent ? { mediaIntent } : {}),
    ...(typeof value.ctaIntent === "string" && CTA_INTENTS.has(value.ctaIntent) ? { ctaIntent: value.ctaIntent as FullSiteCreativeSectionV1["ctaIntent"] } : {}),
    ...(isValidSectionVisualLayoutPlan(value.layout, value.role as SectionRole) ? { layout: value.layout } : {}),
    ...(typeof value.emphasis === "string" && EMPHASES.has(value.emphasis) ? { emphasis: value.emphasis as FullSiteCreativeSectionV1["emphasis"] } : {}),
    ...(typeof value.relationToPrevious === "string" && RELATIONS.has(value.relationToPrevious) ? { relationToPrevious: value.relationToPrevious as FullSiteCreativeSectionV1["relationToPrevious"] } : {}),
    ...(typeof value.productCardTreatment === "string" && PRODUCT_CARD_TREATMENTS.has(value.productCardTreatment) ? { productCardTreatment: value.productCardTreatment as FullSiteCreativeSectionV1["productCardTreatment"] } : {}),
    ...(typeof value.merchandisingComposition === "string" && MERCHANDISING_COMPOSITIONS.has(value.merchandisingComposition) ? { merchandisingComposition: value.merchandisingComposition as FullSiteCreativeSectionV1["merchandisingComposition"] } : {}),
  }
}

export function validateFullSiteCreativeBlueprintV1(value: unknown, context: FullSiteCreativeGroundingContextV1 = {}): FullSiteCreativeValidationResultV1 {
  const errors: string[] = []
  const warnings: string[] = []
  if (!isRecord(value)) return { ok: false, errors: ["blueprint debe ser objeto."], warnings }
  onlyKeys(value, ["version", "roleKey", "strategyKey", "siteConcept", "navigation", "pages"], "blueprint", errors)
  if (value.version !== FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1) errors.push("version invalida.")
  if (value.roleKey !== FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1) errors.push("roleKey invalido.")
  if (value.strategyKey !== FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1) errors.push("strategyKey invalido.")
  if (!isRecord(value.siteConcept)) errors.push("siteConcept invalido.")
  if (!isRecord(value.navigation)) errors.push("navigation invalida.")
  if (!Array.isArray(value.pages)) errors.push("pages invalido.")
  if (errors.length) return { ok: false, errors, warnings }

  const siteConcept = value.siteConcept as Record<string, unknown>
  onlyKeys(siteConcept, ["narrative", "rhythm", "density"], "siteConcept", errors)
  if (typeof siteConcept.narrative !== "string" || !SITE_NARRATIVES.has(siteConcept.narrative)) errors.push("siteConcept.narrative invalido.")
  if (typeof siteConcept.rhythm !== "string" || !RHYTHMS.has(siteConcept.rhythm)) errors.push("siteConcept.rhythm invalido.")
  if (typeof siteConcept.density !== "string" || !SITE_DENSITIES.has(siteConcept.density)) errors.push("siteConcept.density invalido.")

  const navigation = value.navigation as Record<string, unknown>
  onlyKeys(navigation, ["concept", "primaryPurposes", "cartProminence"], "navigation", errors)
  if (typeof navigation.concept !== "string" || !NAV_CONCEPTS.has(navigation.concept)) errors.push("navigation.concept invalido.")
  if (navigation.cartProminence !== undefined && (typeof navigation.cartProminence !== "string" || !CART_PROMINENCE.has(navigation.cartProminence))) errors.push("navigation.cartProminence invalido.")
  const primaryPurposes = Array.isArray(navigation.primaryPurposes)
    ? navigation.primaryPurposes.filter((purpose): purpose is FullSiteCreativeBlueprintV1["navigation"]["primaryPurposes"][number] => typeof purpose === "string" && PAGE_PURPOSES.has(purpose))
    : undefined

  const pages = []
  const semanticKeys = new Set<string>()
  for (const [pageIndex, page] of (value.pages as unknown[]).slice(0, context.maxPages ?? FULL_SITE_BLUEPRINT_LIMITS_V1.maxPages).entries()) {
    if (!isRecord(page)) {
      warnings.push(`pages[${pageIndex}] no es objeto.`)
      continue
    }
    onlyKeys(page, ["purpose", "target", "narrativeGoal", "density", "sections"], `pages[${pageIndex}]`, errors)
    if (typeof page.purpose !== "string" || !PAGE_PURPOSES.has(page.purpose)) {
      warnings.push(`pages[${pageIndex}].purpose invalido.`)
      continue
    }
    const target = page.target === undefined ? undefined : validateRef(page.target, context, `pages[${pageIndex}].target`, errors)
    const semanticKey = `${page.purpose}:${target?.kind ?? "site"}:${"index" in (target ?? {}) ? String((target as { index: number }).index) : "key" in (target ?? {}) ? String((target as { key: string }).key) : "all"}`
    if (semanticKeys.has(semanticKey)) {
      warnings.push(`pages[${pageIndex}] duplicada semanticamente.`)
      continue
    }
    semanticKeys.add(semanticKey)
    const sections = Array.isArray(page.sections)
      ? page.sections.slice(0, FULL_SITE_BLUEPRINT_LIMITS_V1.maxSectionsPerPage).map((section, sectionIndex) => validateSection(section, context, `pages[${pageIndex}].sections[${sectionIndex}]`, errors)).filter((section): section is FullSiteCreativeSectionV1 => Boolean(section))
      : []
    if (!sections.length) {
      warnings.push(`pages[${pageIndex}] sin secciones validas.`)
      continue
    }
    pages.push({
      purpose: page.purpose as FullSiteCreativeBlueprintV1["pages"][number]["purpose"],
      ...(target ? { target } : {}),
      ...(cleanText(page.narrativeGoal, 220, `pages[${pageIndex}].narrativeGoal`, errors) ? { narrativeGoal: cleanText(page.narrativeGoal, 220, `pages[${pageIndex}].narrativeGoal`, errors) } : {}),
      ...(typeof page.density === "string" && PAGE_DENSITIES.has(page.density) ? { density: page.density as FullSiteCreativeBlueprintV1["pages"][number]["density"] } : {}),
      sections,
    })
  }

  if (errors.length) return { ok: false, errors, warnings }
  if (!pages.some((page) => page.purpose === "home")) return { ok: false, errors: ["blueprint requiere home."], warnings }
  if (pages.length < 1) return { ok: false, errors: ["blueprint sin paginas aplicables."], warnings }

  const blueprint: FullSiteCreativeBlueprintV1 = {
    version: FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
    roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
    strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
    siteConcept: {
      narrative: siteConcept.narrative as FullSiteCreativeBlueprintV1["siteConcept"]["narrative"],
      rhythm: siteConcept.rhythm as FullSiteCreativeBlueprintV1["siteConcept"]["rhythm"],
      density: siteConcept.density as FullSiteCreativeBlueprintV1["siteConcept"]["density"],
    },
    navigation: {
      concept: navigation.concept as FullSiteCreativeBlueprintV1["navigation"]["concept"],
      ...(primaryPurposes?.length ? { primaryPurposes } : {}),
      ...(typeof navigation.cartProminence === "string" && CART_PROMINENCE.has(navigation.cartProminence) ? { cartProminence: navigation.cartProminence as FullSiteCreativeBlueprintV1["navigation"]["cartProminence"] } : {}),
    },
    pages,
  }

  return {
    ok: true,
    blueprint,
    warnings,
    fingerprint: createHash("sha256").update(JSON.stringify(blueprint)).digest("hex"),
  }
}
