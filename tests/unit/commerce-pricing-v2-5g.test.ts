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
  CREATIVE_DIRECTOR_PRICING_TREATMENTS_V1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorRequestV1,
  type CreativeSiteDirectionV1,
} from "../../lib/orvenix-ai/creative-director/contract"
import { requestCreativeDirectionV1 } from "../../lib/orvenix-ai/creative-director/gateway"
import { createDeterministicCreativeDirectorProviderV1 } from "../../lib/orvenix-ai/creative-director/testing/deterministic-provider"
import type { CreativeDesignReferenceV1 } from "../../lib/orvenix-ai/creative-director/reference-context"
import { buildCreativeDirectorRequestV1 } from "../../lib/orvenix-ai/site-creation/creative-direction"
import { PRICING_TREATMENTS } from "../../lib/orvenix-ai/composer/composition-context"
import { composeSection } from "../../lib/orvenix-ai/composer"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import { buildSiteArchitecture } from "../../lib/orvenix-ai/architect/site-architect"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect"

type Node = { type: string; props?: Record<string, unknown>; children?: string[]; displayName?: string }
type Section = { role: string; rootId: string; nodes: Record<string, Node> } | null

function allText(section: Section): string {
  return Object.values(section?.nodes ?? {})
    .flatMap((node) => [node.displayName, node.props?.text, node.props?.content, node.props?.label, node.props?.href, node.props?.className])
    .filter((value): value is string => typeof value === "string")
    .join("\n")
}

const NUMERIC_PRICE_PATTERN = /\$\s?\d|\d+\s?(mxn|usd|eur|pesos|dolares|d[oó]lares)|\b\d+\s?%/i
const FORBIDDEN_POPULARITY_CLAIMS = ["mas popular", "más popular", "recomendado por clientes", "mejor opcion", "mejor opción", "mas vendido", "más vendido"]
const FORBIDDEN_CART_CHECKOUT_CTA = ["comprar ahora", "agregar al carrito", "finalizar compra"]

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
    sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "alternating" },
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

const ARCHITECTURE: OrvenixSiteArchitecture = {
  siteType: "agency",
  industry: "agencia creativa",
  objective: "conseguir prospectos",
  businessName: "Estudio Horizonte",
  services: [{ name: "Identidad de marca" }],
  pages: [
    { name: "Servicios", slug: "servicios", purpose: "x", archetype: "catalog", sections: [
      { role: "pricing", blockType: null, purpose: "x" },
    ] },
  ],
}

function baseRequest(referenceContext: CreativeDesignReferenceV1[]): CreativeDirectorRequestV1 {
  return {
    ...buildCreativeDirectorRequestV1({ business: { name: "Estudio Horizonte", industry: "agencia creativa", objective: "conseguir prospectos", services: [{ name: "Identidad de marca" }] }, architecture: ARCHITECTURE }),
    referenceContext,
  }
}

async function pricingDecision(referenceContext: CreativeDesignReferenceV1[]) {
  const result = await requestCreativeDirectionV1({
    request: baseRequest(referenceContext),
    provider: createDeterministicCreativeDirectorProviderV1("reference_aware"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error("unreachable")
  return result.proposal.pricingTreatment
}

// ---------------------------------------------------------------------------
// A/B: products present/absent -- no fabricated product identity.
// ---------------------------------------------------------------------------

test("V2-5G (A): real products preserve exact submitted names", () => {
  const section = composeSection("products", { products: [{ name: "Silla Ergonomica" }, { name: "Escritorio Ajustable" }, { name: "Lampara LED" }] })
  const text = allText(section)
  assert.match(text, /Silla Ergonomica/)
  assert.match(text, /Escritorio Ajustable/)
  assert.match(text, /Lampara LED/)
})

test("V2-5G (B): no products never fabricates a real-looking product identity", () => {
  const section = composeSection("products", {})
  const text = allText(section)
  assert.match(text, /Producto estrella|Variedad disponible/)
  assert.ok(!/Silla Ergonomica|Escritorio Ajustable/.test(text))
})

// ---------------------------------------------------------------------------
// C/D/E: premiumCompositionTreatment already reaches "products" (no new
// code path -- this proves the existing V2-5E machinery, reused as-is).
// ---------------------------------------------------------------------------

test("V2-5G (C): featured-asymmetric products uses only real product data", () => {
  const section = composeSection("products", {
    richComposition: true,
    aiPremiumCompositionTreatment: "featured-asymmetric",
    products: [{ name: "Silla Ergonomica" }, { name: "Escritorio Ajustable" }, { name: "Lampara LED" }],
  })
  const text = allText(section)
  assert.match(text, /Silla Ergonomica/)
  assert.match(text, /featured-asymmetric/)
})

test("V2-5G (D): media-led products with a real usable asset executes media composition", () => {
  const section = composeSection("products", {
    richComposition: true,
    aiPremiumCompositionTreatment: "media-led",
    products: [{ name: "Silla Ergonomica" }, { name: "Escritorio Ajustable" }],
    resolvedMediaAsset: { src: "/img/silla.png", alt: "Silla Ergonomica" },
  })
  const text = allText(section)
  assert.match(text, /media-led/)
  assert.match(text, /Silla Ergonomica/)
})

test("V2-5G (E): media-led products without a usable asset falls back safely", () => {
  const section = composeSection("products", {
    richComposition: true,
    aiPremiumCompositionTreatment: "media-led",
    products: [{ name: "Silla Ergonomica" }, { name: "Escritorio Ajustable" }],
  })
  const text = allText(section)
  assert.ok(!text.includes("media-led"))
  assert.match(text, /Silla Ergonomica/)
})

// ---------------------------------------------------------------------------
// F: restaurant -- menu-oriented presentation, no invented price/category.
// ---------------------------------------------------------------------------

test("V2-5G (F): restaurant products get menu-grounded CTA wording, never a price or category", () => {
  const cta = composeSection("cta", { archetype: "catalog", siteType: "restaurant", products: [{ name: "Tacos al pastor" }, { name: "Agua de horchata" }] })
  const text = allText(cta)
  assert.match(text, /Ver men[uú]/)
  assert.ok(!NUMERIC_PRICE_PATTERN.test(text))
  assert.ok(!/categor[ií]a/i.test(text))

  const products = composeSection("products", { siteType: "restaurant", products: [{ name: "Tacos al pastor" }, { name: "Agua de horchata" }] })
  const productsText = allText(products)
  assert.match(productsText, /Tacos al pastor/)
  assert.ok(!NUMERIC_PRICE_PATTERN.test(productsText))
})

// ---------------------------------------------------------------------------
// G: ecommerce -- product hierarchy, zero commerce-fact fabrication.
// ---------------------------------------------------------------------------

test("V2-5G (G): ecommerce products get real hierarchy with zero price/discount/stock/rating/cart fabrication", () => {
  const section = composeSection("products", {
    siteType: "ecommerce",
    richComposition: true,
    aiPremiumCompositionTreatment: "bento",
    products: [{ name: "Playera basica" }, { name: "Pantalon deportivo" }, { name: "Chamarra impermeable" }],
  })
  const text = allText(section)
  assert.match(text, /Playera basica/)
  assert.ok(!NUMERIC_PRICE_PATTERN.test(text))
  for (const forbidden of ["descuento", "en stock", "agotado", "estrellas", "carrito", "envio gratis"]) {
    assert.ok(!text.toLowerCase().includes(forbidden), `must not fabricate: ${forbidden}`)
  }

  const cta = composeSection("cta", { archetype: "catalog", siteType: "ecommerce", products: [{ name: "Playera basica" }] })
  assert.match(allText(cta), /Ver cat[aá]logo/)
})

// ---------------------------------------------------------------------------
// H/T: PRICING MUST REQUIRE A POSITIVE SEMANTIC SIGNAL. "agency" (or any
// other siteType) is never sufficient by itself -- verified against the
// six realistic requests from the pre-commit review, plus word-safe traps
// proving the gate cannot be tripped by an unrelated word merely sharing a
// prefix/substring with a real signal token.
// ---------------------------------------------------------------------------

function pageRoles(request: string) {
  const architecture = buildSiteArchitecture({ request, business: { name: "Negocio X" } })
  return {
    siteType: architecture.siteType,
    hasPricing: architecture.pages.some((page) => page.sections.some((section) => section.role === "pricing")),
  }
}

test("V2-5G (H, case B): ordinary marketing agency with NO pricing/plan/package/subscription signal never gets pricing", () => {
  const result = pageRoles("Agencia de marketing digital en Monterrey")
  assert.equal(result.siteType, "agency")
  assert.equal(result.hasPricing, false)
})

test("V2-5G (case A): creative/branding studio (no agency keyword, no pricing signal) never gets pricing", () => {
  const result = pageRoles("Somos un estudio creativo de branding y diseño web")
  assert.equal(result.siteType, "business")
  assert.equal(result.hasPricing, false)
})

test("V2-5G (case C): generic professional consultancy (no signal) never gets pricing", () => {
  const result = pageRoles("Consultoría empresarial")
  assert.equal(result.siteType, "business")
  assert.equal(result.hasPricing, false)
})

test("V2-5G (case D): SaaS request with a real 'planes' signal gets pricing, even though it does not classify as agency", () => {
  const result = pageRoles("Software SaaS para gestionar proyectos con planes para equipos")
  assert.equal(result.siteType, "business")
  assert.equal(result.hasPricing, true)
})

test("V2-5G (case E): packages request gets pricing (and also legitimately classifies as agency via 'marketing')", () => {
  const result = pageRoles("Ofrecemos tres paquetes de marketing para empresas")
  assert.equal(result.siteType, "agency")
  assert.equal(result.hasPricing, true)
})

test("V2-5G (case F): subscription-platform request gets pricing without classifying as agency/ecommerce", () => {
  const result = pageRoles("Plataforma por suscripción para pequeños negocios")
  assert.equal(result.siteType, "business")
  assert.equal(result.hasPricing, true)
})

test("V2-5G (H, positive control): agency WITH a real pricing signal does get pricing", () => {
  const result = pageRoles("Agencia de marketing con planes mensuales para empresas")
  assert.equal(result.siteType, "agency")
  assert.equal(result.hasPricing, true)
})

test("V2-5G: word-safe -- 'planta'/'planificacion'/'precioso' never trip the pricing gate (no bare 'plan'/'precio' stem match)", () => {
  assert.equal(pageRoles("Tenemos una gran planta de produccion y hacemos planificacion anual").hasPricing, false)
  assert.equal(pageRoles("Ofrecemos un servicio precioso y atencion personalizada").hasPricing, false)
})

test("V2-5G (T): health/physiotherapy never receives pricing, even with a real pricing signal present, and siteType classification is unaffected", () => {
  const architecture = buildSiteArchitecture({ request: "x", business: { industry: "fisioterapia", name: "Clinica Aurora" } })
  assert.equal(architecture.siteType, "health")
  for (const page of architecture.pages) {
    assert.ok(!page.sections.some((section) => section.role === "pricing"), `page ${page.slug} must not include pricing`)
  }

  // Regression fixture for the fisioterapia_not_health follow-up: adding
  // the pricing gate must not disturb this existing classification.
  const signalArchitecture = buildSiteArchitecture({ request: "x", business: { industry: "fisioterapia", description: "Planes de tratamiento con precios accesibles", name: "Clinica Aurora" } })
  assert.equal(signalArchitecture.siteType, "health")
  for (const page of signalArchitecture.pages) {
    assert.ok(!page.sections.some((section) => section.role === "pricing"), `page ${page.slug} must not include pricing even with a pricing signal`)
  }

  for (const siteType of ["restaurant", "ecommerce"] as const) {
    const industry = siteType === "restaurant" ? "restaurante familiar con planes de membresia" : "tienda de ropa con paquetes y suscripciones"
    const arch = buildSiteArchitecture({ request: "x", business: { industry, name: "Negocio X" } })
    assert.equal(arch.siteType, siteType)
    for (const page of arch.pages) {
      assert.ok(!page.sections.some((section) => section.role === "pricing"), `${siteType} page ${page.slug} must not include pricing even with a pricing signal`)
    }
  }
})

// ---------------------------------------------------------------------------
// I/J/K: pricing tier-highlight is visually distinct, zero numeric
// fabrication, and never a popularity/performance claim.
// ---------------------------------------------------------------------------

test("V2-5G (I): pricing tier-highlight is visually distinct from standard", () => {
  const standard = composeSection("pricing", { richComposition: true, aiPreferredPricingTreatment: "standard" })
  const highlighted = composeSection("pricing", { richComposition: true, aiPreferredPricingTreatment: "tier-highlight" })
  const standardText = allText(standard)
  const highlightedText = allText(highlighted)

  assert.ok(!standardText.includes("tier-highlight"))
  assert.match(highlightedText, /tier-highlight/)
  assert.match(highlightedText, /border-2/)
  assert.match(highlightedText, /Solicitar informaci[oó]n/)
})

test("V2-5G (J): pricing renders zero numeric price/currency, standard and tier-highlight alike", () => {
  for (const treatment of ["standard", "tier-highlight"] as const) {
    const section = composeSection("pricing", { richComposition: true, aiPreferredPricingTreatment: treatment })
    assert.ok(!NUMERIC_PRICE_PATTERN.test(allText(section)), `treatment=${treatment} must render zero numeric price`)
  }
  // Absent entirely (pre-V2-5G default path) must also stay price-free.
  assert.ok(!NUMERIC_PRICE_PATTERN.test(allText(composeSection("pricing", {}))))
})

test("V2-5G (K): tier-highlight never renders a 'most popular'/performance claim", () => {
  const section = composeSection("pricing", { richComposition: true, aiPreferredPricingTreatment: "tier-highlight" })
  const text = allText(section).toLowerCase()
  for (const claim of FORBIDDEN_POPULARITY_CLAIMS) {
    assert.ok(!text.includes(claim), `must not render popularity/performance claim: ${claim}`)
  }
})

// ---------------------------------------------------------------------------
// L/M/N: commerce CTA grounding, no cart/checkout fabrication anywhere.
// ---------------------------------------------------------------------------

test("V2-5G (L): ecommerce commerce CTA uses grounded catalog wording", () => {
  const cta = composeSection("cta", { archetype: "catalog", siteType: "ecommerce", products: [{ name: "Playera basica" }] })
  assert.match(allText(cta), /Ver cat[aá]logo/)
})

test("V2-5G (M): restaurant commerce CTA uses grounded menu wording", () => {
  const cta = composeSection("cta", { archetype: "catalog", siteType: "restaurant", products: [{ name: "Tacos al pastor" }] })
  assert.match(allText(cta), /Ver men[uú]/)
})

test("V2-5G (N): no cart/checkout CTA is ever fabricated, in commerce CTAs or pricing tiers", () => {
  const sections = [
    composeSection("cta", { archetype: "catalog", siteType: "ecommerce", products: [{ name: "Playera basica" }] }),
    composeSection("cta", { archetype: "catalog", siteType: "restaurant", products: [{ name: "Tacos al pastor" }] }),
    composeSection("pricing", { richComposition: true, aiPreferredPricingTreatment: "tier-highlight" }),
    composeSection("products", { siteType: "ecommerce", products: [{ name: "Playera basica" }] }),
  ]
  const text = sections.map(allText).join("\n").toLowerCase()
  for (const forbidden of FORBIDDEN_CART_CHECKOUT_CTA) {
    assert.ok(!text.includes(forbidden), `must not fabricate cart/checkout CTA: ${forbidden}`)
  }
})

// ---------------------------------------------------------------------------
// V (integration): (L)/(M) prove resolveCtaCopy's own wording in isolation,
// but the 1300-test suite passing while the ecommerce Productos page's
// architecture recipe omitted "cta" entirely proved that isolation was not
// enough -- the catalog CTA was never reachable in a real ecommerce site.
// This proves reachability through the real buildSiteArchitecture ->
// compileSiteBlueprint path, exactly as production executes it, for both
// ecommerce (the fix) and restaurant (regression guard: must still route
// "cta" and reach "Ver menú" the same way).
// ---------------------------------------------------------------------------

function allPageText(page: { tree: { nodes: Record<string, { displayName?: string; props?: Record<string, unknown> }> } }): string {
  return Object.values(page.tree.nodes)
    .flatMap((node) => [node.displayName, node.props?.text, node.props?.content, node.props?.label, node.props?.href])
    .filter((value): value is string => typeof value === "string")
    .join("\n")
}

test("V2-5G (V): ecommerce Productos architecture routes role \"cta\" and the real compiled pipeline reaches 'Ver catálogo'; restaurant Menú keeps reaching 'Ver menú' the same way", () => {
  const ecommerceArchitecture = buildSiteArchitecture({
    request: "x",
    business: { industry: "tienda de decoracion", name: "Linea Norte", products: [{ name: "Lampara Nube" }] },
  })
  assert.equal(ecommerceArchitecture.siteType, "ecommerce")
  const productos = ecommerceArchitecture.pages.find((page) => page.slug === "productos")
  assert.ok(productos, "ecommerce architecture must include a productos page")
  assert.ok(productos!.sections.some((section) => section.role === "cta"), "productos page must route a cta section")

  const restaurantArchitecture = buildSiteArchitecture({
    request: "x",
    business: { industry: "restaurante", name: "Casa Brasa", products: [{ name: "Tacos al pastor" }] },
  })
  const menu = restaurantArchitecture.pages.find((page) => page.slug === "menu")
  assert.ok(menu, "restaurant architecture must include a menu page")
  assert.ok(menu!.sections.some((section) => section.role === "cta"), "menu page must route a cta section")

  const ecommerceProductosText = allPageText(compileSiteBlueprint(ecommerceArchitecture, { preferPrimitiveComposition: true }).pages.find((page) => page.slug === "productos")!)
  assert.match(ecommerceProductosText, /Ver cat[aá]logo/)

  const restaurantMenuText = allPageText(compileSiteBlueprint(restaurantArchitecture, { preferPrimitiveComposition: true }).pages.find((page) => page.slug === "menu")!)
  assert.match(restaurantMenuText, /Ver men[uú]/)

  const combinedText = `${ecommerceProductosText}\n${restaurantMenuText}`.toLowerCase()
  for (const forbidden of FORBIDDEN_CART_CHECKOUT_CTA) {
    assert.ok(!combinedText.includes(forbidden), `must not fabricate cart/checkout CTA: ${forbidden}`)
  }
  assert.ok(!NUMERIC_PRICE_PATTERN.test(combinedText))
})

// ---------------------------------------------------------------------------
// O/P: Creative Director receives only the bounded hasProducts/productCount
// summary; V2-5G adds no NEW raw commercial field beyond the pre-existing,
// unchanged-since-V2-S1 product name/description offering-grounding array.
// ---------------------------------------------------------------------------

test("V2-5G (O/P): CD payload carries only hasProducts/productCount as new data; no new raw commercial field is added", () => {
  const request = buildCreativeDirectorRequestV1({
    business: {
      name: "Estudio Horizonte",
      industry: "agencia creativa",
      products: [{ name: "Silla Ergonomica", description: "Producto real" }, { name: "Escritorio Ajustable" }],
    },
    architecture: ARCHITECTURE,
  })

  assert.equal(request.business.hasProducts, true)
  assert.equal(request.business.productCount, 2)

  // V2-5G itself must never introduce a NEW raw commercial fact type --
  // no price/discount/stock/rating field anywhere in the outgoing payload.
  const serialized = JSON.stringify(request)
  for (const forbiddenKey of ["\"price\"", "\"discount\"", "\"stock\"", "\"rating\"", "\"reviewCount\""]) {
    assert.ok(!serialized.includes(forbiddenKey), `CD payload must not contain a new commercial field: ${forbiddenKey}`)
  }
})

// ---------------------------------------------------------------------------
// Q/R: reference pricing grammar affects the bounded decision; reference
// ids alone never do.
// ---------------------------------------------------------------------------

const PRICING_GRAMMAR_CONTEXT = refs({ sectionGrammar: { recurringTreatments: ["pricing-tiers"], density: "standard", backgroundRhythm: "alternating" }, distinctiveTraits: ["pricing-tier-highlight"] }, "pricing")
const NON_PRICING_CONTEXT = refs({ sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "alternating" }, distinctiveTraits: [] }, "generic")

test("V2-5G (Q): reference pricing/catalog grammar changes the bounded pricingTreatment decision", async () => {
  assert.equal(await pricingDecision(PRICING_GRAMMAR_CONTEXT), "tier-highlight")
  assert.equal(await pricingDecision(NON_PRICING_CONTEXT), "standard")
})

test("V2-5G (R): reference IDs alone cannot change the pricing decision; grammar does", async () => {
  const original = await pricingDecision(PRICING_GRAMMAR_CONTEXT)
  const renamed = await pricingDecision(PRICING_GRAMMAR_CONTEXT.map((entry, index) => ({ ...entry, id: `webs:different-${index}` as never })))
  assert.equal(original, renamed)
  assert.notEqual(original, await pricingDecision(NON_PRICING_CONTEXT))
})

// ---------------------------------------------------------------------------
// S: old no-commerce/no-product behavior is unchanged (regression guard).
// ---------------------------------------------------------------------------

test("V2-5G (S): old non-commerce/no-product behavior is byte-identical when no V2-5G signal is present", () => {
  const pricing = composeSection("pricing", {})
  assert.match(allText(pricing), /Inicial/)
  assert.ok(!allText(pricing).includes("tier-highlight"))

  const blueprint = compileSiteBlueprint(ARCHITECTURE, {})
  const text = Object.values(blueprint.pages[0].tree.nodes)
    .flatMap((node) => [node.displayName, node.props?.text, node.props?.content])
    .filter((value): value is string => typeof value === "string")
    .join("\n")
  // ARCHITECTURE's "servicios" page is archetype "catalog", so this is the
  // pre-existing, unchanged CARD_GRID_ARCHETYPE_COPY.pricing.catalog copy.
  assert.match(text, /Basico|Estandar|Avanzado/)
  assert.ok(!text.includes("tier-highlight"))
})

// ---------------------------------------------------------------------------
// U: V2-5F people/testimonials/contact remain unaffected by V2-5G.
// ---------------------------------------------------------------------------

test("V2-5G (U): V2-5F trustPeople/testimonials/contact composition is unaffected", () => {
  const people = composeSection("trust", { richComposition: true, aiPreferredTrustTreatment: "person-cards", trustPeople: [{ name: "Ana Torres", role: "Directora" }] })
  assert.match(allText(people), /Ana Torres/)

  const contact = composeSection("contact", { businessEvidence: { contact: { whatsapp: "528112345678" } } })
  assert.match(allText(contact), /wa\.me\/528112345678/)
})

// ---------------------------------------------------------------------------
// V: mobile structural safety -- highlight geometry only escalates at the
// md breakpoint; the base (mobile) class list stays a plain stacked card.
// ---------------------------------------------------------------------------

test("V2-5G (V): tier-highlight geometry is gated behind a responsive breakpoint, mobile stays a plain stacked card", () => {
  const section = composeSection("pricing", { richComposition: true, aiPreferredPricingTreatment: "tier-highlight" })
  const classNames = Object.values(section?.nodes ?? {})
    .map((node) => node.props?.className)
    .filter((value): value is string => typeof value === "string")

  const highlightedCard = classNames.find((className) => className.includes("bg-sky-50"))
  assert.ok(highlightedCard, "expected a highlighted card className")
  assert.match(highlightedCard!, /md:-translate-y-2|md:scale-/)
  assert.ok(!/^-translate-y|(?:^|\s)scale-\[/.test(highlightedCard!.replace(/md:\S+/g, "")), "scale/translate must be md-gated, not applied unconditionally")

  const grid = classNames.find((className) => className.includes("grid") && className.includes("md:grid-cols-3"))
  assert.ok(grid, "expected a responsive pricing grid className")
})

// ---------------------------------------------------------------------------
// Contract-level sanity: PricingTreatment vocabulary matches between the
// composer and the Creative Director contract (same convention V2-5D uses).
// ---------------------------------------------------------------------------

test("V2-5G contract vocabularies match composer executable vocabularies", () => {
  assert.deepEqual([...CREATIVE_DIRECTOR_PRICING_TREATMENTS_V1].sort(), [...PRICING_TREATMENTS].sort())
})

test("V2-5G contract accepts a valid pricingTreatment and drops an invalid one", () => {
  const valid = validateCreativeSiteDirectionV1(direction({ pricingTreatment: "tier-highlight" }))
  assert.equal(valid.ok, true)
  if (valid.ok) assert.equal(valid.value.pricingTreatment, "tier-highlight")

  const invalid = validateCreativeSiteDirectionV1(direction({
    // @ts-expect-error deliberately invalid
    pricingTreatment: "best-seller-badge",
  }))
  assert.equal(invalid.ok, true)
  if (invalid.ok) assert.equal(invalid.value.pricingTreatment, undefined)
})

test("V2-5G backward compatibility: existing proposal shape without pricingTreatment remains valid", () => {
  const result = validateCreativeSiteDirectionV1({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  })
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.value.pricingTreatment, undefined)
})
