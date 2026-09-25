import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import {
  CREATIVE_DIRECTOR_PREMIUM_COMPOSITION_TREATMENTS_V1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorRequestV1,
  type CreativeSiteDirectionV1,
} from "../../lib/orvenix-ai/creative-director/contract"
import { requestCreativeDirectionV1 } from "../../lib/orvenix-ai/creative-director/gateway"
import { createDeterministicCreativeDirectorProviderV1 } from "../../lib/orvenix-ai/creative-director/testing/deterministic-provider"
import type { CreativeDesignReferenceV1 } from "../../lib/orvenix-ai/creative-director/reference-context"
import { PREMIUM_COMPOSITION_TREATMENTS, type PremiumCompositionTreatment } from "../../lib/orvenix-ai/composer/composition-context"
import { composeSection } from "../../lib/orvenix-ai/composer"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import type { ComposedSection } from "../../lib/orvenix-ai/composer/types"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect"

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; displayName?: string }
type Section = ComposedSection | null

const SERVICES = [
  { name: "Diagnostico", description: "Entiende prioridades y oportunidades reales." },
  { name: "Estrategia", description: "Ordena pasos claros para avanzar." },
  { name: "Implementacion", description: "Convierte decisiones en ejecucion concreta." },
  { name: "Seguimiento", description: "Mantiene el progreso visible y accionable." },
]

function nodes(section: Section): Record<string, Node> {
  return (section?.nodes ?? {}) as Record<string, Node>
}

function displayNames(section: Section): string[] {
  return Object.values(nodes(section)).map((node) => node.displayName ?? "")
}

function classNames(section: Section): string[] {
  return Object.values(nodes(section))
    .map((node) => node.props?.className)
    .filter((value): value is string => typeof value === "string")
}

function propsText(section: Section): string[] {
  return Object.values(nodes(section))
    .flatMap((node) => [node.props?.text, node.props?.content, node.props?.label])
    .filter((value): value is string => typeof value === "string")
}

function hasDisplay(section: Section, prefix: string): boolean {
  return displayNames(section).some((name) => name.startsWith(prefix))
}

function sectionSignature(section: Section): string {
  const displays = displayNames(section)
  if (displays.includes("Bento services")) return "services:bento"
  if (displays.includes("Media-led services")) return "services:media-led"
  if (displays.includes("Asimetrico services")) return "services:featured-asymmetric"
  if (displays.includes("Filas services")) return "services:editorial-alternating"
  if (displays.includes("Grid services")) return "services:standard-grid"
  return "services:unknown"
}

function normalizeSection(section: Section) {
  return Object.values(nodes(section)).map((node) => ({ type: node.type, displayName: node.displayName, props: node.props, childCount: node.children?.length ?? 0 }))
}

function servicesSection(treatment?: unknown, extra: Record<string, unknown> = {}) {
  return composeSection("services", {
    siteType: "professional",
    archetype: "catalog",
    services: SERVICES,
    ...(treatment ? { richComposition: true, aiPremiumCompositionTreatment: treatment as PremiumCompositionTreatment } : {}),
    ...extra,
  })
}

function gallerySection(treatment: PremiumCompositionTreatment) {
  return composeSection("gallery", { richComposition: true, aiPremiumCompositionTreatment: treatment })
}

function direction(overrides: Partial<CreativeSiteDirectionV1> = {}): CreativeSiteDirectionV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
    ...overrides,
  }
}

function reference(overrides: Partial<CreativeDesignReferenceV1> = {}): CreativeDesignReferenceV1 {
  return {
    id: "webs:fixture",
    relevance: { contributionRoles: ["section-rhythm"], diversityReason: "primary-relevance-anchor", relevanceScore: 0.9 },
    visualGrammar: { visualFamily: "saas-conversion", designPersonality: "warm-approachable", mode: "light", accent: "cool", radius: "soft", shadow: "soft", contrast: "medium" },
    heroGrammar: { backgroundTreatment: "solid-gradient", alignment: "center", mediaStrategy: "none", ctaArrangement: "single-cta" },
    sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "uniform" },
    assetGrammar: { strategy: "none", placement: "none" },
    conversionGrammar: { ctaStrategy: "single-action", contactPattern: "generic-form" },
    navGrammar: { surfaceTreatment: "light-glass", position: "sticky", shadowBehavior: "static", ctaPattern: "prominent-single", hasTwoTierBar: false },
    distinctiveTraits: [],
    ...overrides,
  }
}

function refs(overrides: Partial<CreativeDesignReferenceV1>, prefix: string): CreativeDesignReferenceV1[] {
  return [0, 1, 2].map((index) => reference({ ...overrides, id: `webs:${prefix}-${index}` as never }))
}

function request(referenceContext: CreativeDesignReferenceV1[]): CreativeDirectorRequestV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    business: { name: "Orvenix Demo", industry: "servicios", objective: "captar prospectos", services: SERVICES },
    pages: [{ slug: "home", purpose: "captar", archetype: "overview", availableRoles: ["hero", "services", "gallery"], requiredRoles: ["hero", "services", "gallery"], defaultOrder: ["hero", "services", "gallery"] }],
    referenceContext,
  }
}

async function premiumDecision(referenceContext: CreativeDesignReferenceV1[]) {
  const result = await requestCreativeDirectionV1({
    request: request(referenceContext),
    provider: createDeterministicCreativeDirectorProviderV1("reference_aware"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error("unreachable")
  return result.proposal.premiumCompositionTreatment
}

const ARCHITECTURE: OrvenixSiteArchitecture = {
  siteType: "professional",
  industry: "consultoria",
  objective: "captar prospectos",
  businessName: "Orvenix Demo",
  services: SERVICES,
  pages: [
    { name: "Inicio", slug: "home", purpose: "captar", archetype: "catalog", sections: [
      { role: "hero", blockType: null, purpose: "x" },
      { role: "services", blockType: null, purpose: "x" },
      { role: "gallery", blockType: null, purpose: "x" },
      { role: "content", blockType: null, purpose: "x" },
    ] },
  ],
}

function compiledSignature(treatment: PremiumCompositionTreatment): string {
  const site = compileSiteBlueprint(ARCHITECTURE, {
    preferPrimitiveComposition: true,
    creativeDirection: direction({ premiumCompositionTreatment: treatment }),
  })
  const names = Object.values(site.pages[0]?.tree.nodes ?? {}).map((node) => node.displayName).join("|")
  return [
    names.includes("Bento services") ? "services:bento" : names.includes("Media-led services") ? "services:media" : names.includes("Filas services") ? "services:editorial" : names.includes("Asimetrico services") ? "services:asym" : "services:grid",
    names.includes("Bento galería") ? "gallery:bento" : names.includes("Media-led galería") ? "gallery:media" : "gallery:grid",
    names.includes("Filas content") ? "content:editorial" : names.includes("Bento content") ? "content:bento" : names.includes("Media-led content") ? "content:media" : names.includes("Asimetrico content") ? "content:asym" : "content:grid",
  ].join(">");
}

test("V2-5E composition contract matches composer executable vocabulary and drops invalid values", () => {
  assert.deepEqual([...CREATIVE_DIRECTOR_PREMIUM_COMPOSITION_TREATMENTS_V1].sort(), [...PREMIUM_COMPOSITION_TREATMENTS].sort())
  const valid = validateCreativeSiteDirectionV1(direction({ premiumCompositionTreatment: "bento" }))
  assert.equal(valid.ok, true)
  assert.equal(valid.ok ? valid.value.premiumCompositionTreatment : undefined, "bento")

  const invalid = validateCreativeSiteDirectionV1({ ...direction(), premiumCompositionTreatment: "luxury-real-estate" })
  assert.equal(invalid.ok, true)
  assert.equal(invalid.ok ? invalid.value.premiumCompositionTreatment : "unexpected", undefined)
})

test("V2-5E reference grammar changes decisions while reference ids do not", async () => {
  const standardA = await premiumDecision(refs({ sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "uniform" } }, "standard-a"))
  const standardB = await premiumDecision(refs({ sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "uniform" } }, "standard-b"))
  const bento = await premiumDecision(refs({ sectionGrammar: { recurringTreatments: ["rated-card-grid"], density: "standard", backgroundRhythm: "uniform" }, distinctiveTraits: ["catalog-browsing"] }, "bento"))
  const media = await premiumDecision(refs({ assetGrammar: { strategy: "photography", placement: "card-thumbnails" }, heroGrammar: { backgroundTreatment: "full-bleed-photo", alignment: "mixed", mediaStrategy: "photography", ctaArrangement: "single-cta" } }, "media"))

  assert.equal(standardA, "standard-grid")
  assert.equal(standardB, "standard-grid")
  assert.equal(bento, "bento")
  assert.equal(media, "media-led")
  assert.notEqual(standardA, bento)
})

test("V2-5E executor produces materially different EditorTree signatures", () => {
  assert.equal(sectionSignature(servicesSection("standard-grid")), "services:standard-grid")
  assert.equal(sectionSignature(servicesSection("featured-asymmetric")), "services:featured-asymmetric")
  assert.equal(sectionSignature(servicesSection("editorial-alternating")), "services:editorial-alternating")
  assert.equal(sectionSignature(servicesSection("bento")), "services:bento")
  assert.equal(sectionSignature(servicesSection("media-led", { resolvedMediaAsset: { src: "https://cdn.orvenix.test/media.jpg", alt: "Media real" } })), "services:media-led")

  assert.ok(classNames(servicesSection("bento")).some((value) => value.includes("md:grid-cols-6") && value.includes("auto-rows-fr")))
  assert.ok(classNames(servicesSection("media-led", { resolvedMediaAsset: { src: "https://cdn.orvenix.test/media.jpg" } })).some((value) => value.includes("lg:grid-cols-[1.15fr_0.85fr]")))
  assert.ok(classNames(servicesSection("editorial-alternating")).some((value) => value.includes("sm:flex-row-reverse")))
})

test("V2-5E item-count and invalid-decision fallbacks are bounded and preserve items", () => {
  const twoItemBento = servicesSection("bento", { archetype: "overview", services: SERVICES.slice(0, 2) })
  assert.equal(sectionSignature(twoItemBento), "services:editorial-alternating")

  const invalid = servicesSection("freeform-masonry")
  assert.equal(hasDisplay(invalid, "Bento services"), false)
  assert.equal(hasDisplay(invalid, "Media-led services"), false)

  const texts = propsText(servicesSection("bento"))
  for (const service of SERVICES) {
    assert.equal(texts.filter((value) => value === service.name).length, 1)
  }
})

test("V2-5E media-led and gallery depth handle missing and real assets safely", () => {
  const missingMedia = servicesSection("media-led")
  assert.equal(sectionSignature(missingMedia), "services:editorial-alternating")
  assert.equal(Object.values(nodes(missingMedia)).filter((node) => node.type === "image").length, 0)
  assert.equal(classNames(missingMedia).some((value) => value.includes("min-h-72") || value.includes("lg:grid-cols-[1.15fr_0.85fr]")), false)

  const realMedia = servicesSection("media-led", { resolvedMediaAsset: { src: "https://cdn.orvenix.test/media.jpg", alt: "Media real" } })
  const images = Object.values(nodes(realMedia)).filter((node) => node.type === "image")
  assert.equal(sectionSignature(realMedia), "services:media-led")
  assert.equal(images.length, 1)
  assert.equal(images[0]?.props?.src, "https://cdn.orvenix.test/media.jpg")
  assert.equal(images[0]?.props?.positionMode, "free")

  const galleryWithoutAssets = gallerySection("bento")
  assert.ok(hasDisplay(galleryWithoutAssets, "Grid galería"))
  assert.equal(hasDisplay(galleryWithoutAssets, "Bento galería"), false)

  const galleryWithAssets = composeSection("gallery", {
    richComposition: true,
    aiPremiumCompositionTreatment: "bento",
    resolvedGalleryAssets: [{ src: "https://cdn.orvenix.test/gallery-1.jpg" }],
  })
  assert.ok(hasDisplay(galleryWithAssets, "Bento galería"))
  assert.equal(Object.values(nodes(galleryWithAssets)).filter((node) => node.type === "image").length, 6)
  assert.ok(classNames(galleryWithAssets).some((value) => value.includes("md:grid-cols-6")))
})

test("V2-5E renders no unsupported hierarchy claims and uses responsive bounded classes", () => {
  const sections = [servicesSection("featured-asymmetric"), servicesSection("bento"), servicesSection("media-led", { resolvedMediaAsset: { src: "https://cdn.orvenix.test/media.jpg" } }), gallerySection("bento")]
  const forbidden = /\b(Más popular|Recomendado|Mejor opción|Premium|Top|#1)\b/i
  for (const section of sections) {
    assert.equal(forbidden.test(propsText(section).join("\n")), false)
  }
  assert.ok(classNames(servicesSection("bento")).some((value) => value.includes("grid") && value.includes("md:")))
  assert.ok(classNames(servicesSection("media-led", { resolvedMediaAsset: { src: "https://cdn.orvenix.test/media.jpg" } })).some((value) => value.includes("grid") && value.includes("lg:")))
})

test("V2-5E compatibility: disabled/no decision stays unchanged, explicit decision changes, invalid falls back", () => {
  const baseline = normalizeSection(composeSection("services", { services: SERVICES }))
  const disabled = normalizeSection(composeSection("services", { services: SERVICES, aiPremiumCompositionTreatment: "bento" as PremiumCompositionTreatment }))
  const noDecision = composeSection("services", { services: SERVICES, richComposition: true })
  const invalid = composeSection("services", { services: SERVICES, richComposition: true, aiPremiumCompositionTreatment: "floating-orb" as PremiumCompositionTreatment })
  const bento = normalizeSection(servicesSection("bento"))

  assert.deepEqual(disabled, baseline)
  assert.equal(hasDisplay(noDecision, "Bento services"), false)
  assert.equal(hasDisplay(invalid, "Bento services"), false)
  assert.notDeepEqual(bento, baseline)
})

test("V2-5E multi-business diagnostics expose non-convergent composition signatures", () => {
  const signatures = {
    health: compiledSignature("standard-grid"),
    hospitality: compiledSignature("media-led"),
    creative: compiledSignature("featured-asymmetric"),
    ecommerce: compiledSignature("bento"),
    saas: compiledSignature("editorial-alternating"),
  }
  assert.equal(signatures.health.includes("services:grid"), true)
  assert.equal(signatures.ecommerce.includes("services:bento"), true)
  assert.equal(signatures.saas.includes("services:editorial"), true)
  assert.ok(new Set(Object.values(signatures)).size >= 4)
})
