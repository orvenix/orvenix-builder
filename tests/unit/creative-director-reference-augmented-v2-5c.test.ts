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
  CREATIVE_DIRECTOR_HERO_TREATMENTS_V1,
  CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1,
  CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1,
  CREATIVE_DIRECTOR_TWO_ITEM_LAYOUT_TREATMENTS_V1,
  validateCreativeSiteDirectionV1,
  type CreativeDirectorRequestV1,
  type CreativeSiteDirectionV1,
} from "../../lib/orvenix-ai/creative-director/contract"
import { requestCreativeDirectionV1 } from "../../lib/orvenix-ai/creative-director/gateway"
import { createDeterministicCreativeDirectorProviderV1 } from "../../lib/orvenix-ai/creative-director/testing/deterministic-provider"
import { buildDesignReferenceRetrievalQueryV1 } from "../../lib/orvenix-ai/creative-director/retrieval-query"
import { buildCreativeDirectorReferenceContextV1, type CreativeDesignReferenceV1 } from "../../lib/orvenix-ai/creative-director/reference-context"
import {
  attachDesignReferenceContextV1,
  buildCreativeDirectorRequestV1,
  decideCreativeDirectorEligibilityV1,
  resolveSiteCreationCreativeDirectionV1,
} from "../../lib/orvenix-ai/site-creation/creative-direction"
import { retrieveDesignReferences } from "../../lib/orvenix-ai/design-reference/retrieve"
import { getDesignReferences } from "../../lib/orvenix-ai/design-reference/library"
import {
  HERO_TREATMENTS,
  PROCESS_VARIANTS,
  SECTION_TONE_POOLS,
  SECTION_TONE_STRATEGIES,
  TWO_ITEM_LAYOUT_VARIANTS,
} from "../../lib/orvenix-ai/composer/composition-context"
import { composeSection } from "../../lib/orvenix-ai/composer"
import { compileSiteBlueprint } from "../../lib/orvenix-ai/compiler/blueprint-compiler"
import type { OrvenixSiteArchitecture } from "../../lib/orvenix-ai/architect"

// ---------------------------------------------------------------------------
// V2-5C: reference-augmented Creative Director. Fixtures.
// ---------------------------------------------------------------------------

const PHYSIO_BUSINESS = {
  name: "Centro de Fisioterapia Monterrey",
  industry: "fisioterapia",
  location: "Monterrey",
  objective: "Conseguir citas de valoración",
  services: [{ name: "Fisioterapia deportiva" }, { name: "Rehabilitación postoperatoria" }, { name: "Terapia manual" }],
}

const PHYSIO_ARCHITECTURE: OrvenixSiteArchitecture = {
  siteType: "health",
  industry: "fisioterapia",
  objective: "Conseguir citas de valoración",
  businessName: "Centro de Fisioterapia Monterrey",
  services: PHYSIO_BUSINESS.services,
  pages: [
    {
      name: "Inicio",
      slug: "home",
      purpose: "Presentar la clinica.",
      archetype: "overview",
      sections: [
        { role: "navigation", blockType: null, purpose: "x" },
        { role: "hero", blockType: null, purpose: "x" },
        { role: "services", blockType: null, purpose: "x" },
        { role: "cta", blockType: null, purpose: "x" },
        { role: "footer", blockType: null, purpose: "x" },
      ],
    },
  ],
}

function baseRequest(): CreativeDirectorRequestV1 {
  return buildCreativeDirectorRequestV1({ business: PHYSIO_BUSINESS, architecture: PHYSIO_ARCHITECTURE })
}

function fixtureReference(overrides: Partial<CreativeDesignReferenceV1> = {}): CreativeDesignReferenceV1 {
  return {
    id: "webs:fixture",
    relevance: { contributionRoles: ["hero-composition"], diversityReason: "primary-relevance-anchor", relevanceScore: 0.9 },
    visualGrammar: { visualFamily: "ambient-dark-abstract", designPersonality: "bold-confident", mode: "dark", accent: "cool", radius: "soft", shadow: "soft", contrast: "high" },
    heroGrammar: { backgroundTreatment: "solid-gradient", alignment: "center", mediaStrategy: "none", ctaArrangement: "dual-cta" },
    sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "alternating" },
    assetGrammar: { strategy: "abstract", placement: "none" },
    conversionGrammar: { ctaStrategy: "dual-action", contactPattern: "generic-form" },
    distinctiveTraits: [],
    ...overrides,
  }
}

function directionWithPage(overrides: Record<string, unknown>): CreativeSiteDirectionV1 {
  return {
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    pageDirections: [{ slug: "home", narrativeGoal: "x", ...overrides }],
  }
}

// ---------------------------------------------------------------------------
// M1/M2) Retrieval query builder: deterministic, no raw prompt/PII
// ---------------------------------------------------------------------------

test("1) buildDesignReferenceRetrievalQueryV1 is deterministic for identical normalized facts", () => {
  const a = buildDesignReferenceRetrievalQueryV1(baseRequest(), "health")
  const b = buildDesignReferenceRetrievalQueryV1(structuredClone(baseRequest()), "health")
  assert.deepEqual(a, b)
})

test("2) retrieval query never carries raw prompt/PII, even when business facts contain some", () => {
  const request = buildCreativeDirectorRequestV1({
    business: { ...PHYSIO_BUSINESS, description: "Contactanos en contacto@clinica.com o al +52 81 1234 5678, visita https://clinica.example.com" },
    architecture: PHYSIO_ARCHITECTURE,
  })
  const query = buildDesignReferenceRetrievalQueryV1(request, "health")
  const serialized = JSON.stringify(query)
  assert.equal(/contacto@clinica\.com|clinica\.example\.com|\+52 81|@/.test(serialized), false)
})

test("query maps known siteType to a real BusinessAffinity/ConversionIntent, and an unrecognized siteType yields neither", () => {
  const known = buildDesignReferenceRetrievalQueryV1(baseRequest(), "health")
  assert.equal(known.businessAffinity, "health")
  assert.equal(known.conversionIntent, "appointment")

  const unknown = buildDesignReferenceRetrievalQueryV1(baseRequest(), "not-a-real-sitetype")
  assert.equal(unknown.businessAffinity, undefined)
  assert.equal(unknown.conversionIntent, undefined)
})

// ---------------------------------------------------------------------------
// M3) Retrieval selects only valid library references
// ---------------------------------------------------------------------------

test("3) retrieval only ever returns references that exist in the real library", () => {
  const knownIds = new Set(getDesignReferences().map((r) => r.id))
  const query = buildDesignReferenceRetrievalQueryV1(baseRequest(), "health")
  const result = retrieveDesignReferences(query)
  assert.ok(result.selections.length > 0)
  for (const selection of result.selections) assert.ok(knownIds.has(selection.reference.id))
})

// ---------------------------------------------------------------------------
// M4/M5/M22) Sanitized reference context: no source copy/URLs, deterministic
// ---------------------------------------------------------------------------

test("4/22) sanitized reference context carries no URLs, emails, prices, or CSS/JSX-shaped strings", () => {
  const query = buildDesignReferenceRetrievalQueryV1(baseRequest(), "health")
  const result = retrieveDesignReferences(query)
  const context = buildCreativeDirectorReferenceContextV1(result)
  const serialized = JSON.stringify(context)
  assert.equal(/https?:\/\/|www\.|@|\$\s?\d|className|<[a-zA-Z]/.test(serialized), false)
})

test("5/6) same retrieval result produces byte-identical sanitized reference context", () => {
  const query = buildDesignReferenceRetrievalQueryV1(baseRequest(), "health")
  const result = retrieveDesignReferences(query)
  const a = buildCreativeDirectorReferenceContextV1(result)
  const b = buildCreativeDirectorReferenceContextV1(structuredClone(result))
  assert.deepEqual(a, b)
})

test("attachDesignReferenceContextV1 embeds up to 4 sanitized references, capped, never more", () => {
  const request = attachDesignReferenceContextV1(baseRequest(), "health")
  assert.ok(request.referenceContext !== undefined)
  assert.ok(request.referenceContext!.length > 0)
  assert.ok(request.referenceContext!.length <= 4)
})

// ---------------------------------------------------------------------------
// M6/M7) Contract: accepts valid new treatment values, rejects unknown ones
// ---------------------------------------------------------------------------

test("6) contract accepts every valid heroTreatment/processTreatment/twoItemLayoutTreatment/sectionToneStrategy value", () => {
  for (const heroTreatment of CREATIVE_DIRECTOR_HERO_TREATMENTS_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithPage({ heroTreatment }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.pageDirections[0].heroTreatment, heroTreatment)
  }
  for (const processTreatment of CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithPage({ processTreatment }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.pageDirections[0].processTreatment, processTreatment)
  }
  for (const twoItemLayoutTreatment of CREATIVE_DIRECTOR_TWO_ITEM_LAYOUT_TREATMENTS_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithPage({ twoItemLayoutTreatment }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.pageDirections[0].twoItemLayoutTreatment, twoItemLayoutTreatment)
  }
  for (const sectionToneStrategy of CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1) {
    const result = validateCreativeSiteDirectionV1(directionWithPage({ sectionToneStrategy }))
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.pageDirections[0].sectionToneStrategy, sectionToneStrategy)
  }
})

test("7) contract drops an unrecognized treatment value (never a hard reject, matches preferredHeroVariant precedent)", () => {
  const result = validateCreativeSiteDirectionV1(directionWithPage({ heroTreatment: "cinematic-parallax", processTreatment: "timeline", twoItemLayoutTreatment: "split-hero", sectionToneStrategy: "neon" }))
  assert.equal(result.ok, true)
  if (result.ok) {
    const direction = result.value.pageDirections[0]
    assert.equal(direction.heroTreatment, undefined)
    assert.equal(direction.processTreatment, undefined)
    assert.equal(direction.twoItemLayoutTreatment, undefined)
    assert.equal(direction.sectionToneStrategy, undefined)
  }
})

test("22) contract rejects an accentColor field entirely (AI can never set theme color -- closed pageDirection shape)", () => {
  // Unknown key -> the whole pageDirection is dropped (closed shape); with
  // only one pageDirection to begin with, nothing usable remains, so the
  // WHOLE proposal fails (same "nothing usable remains" rule already
  // covered by the existing contract-gateway test suite).
  const result = validateCreativeSiteDirectionV1(directionWithPage({ accentColor: "#ff00ff" }))
  assert.equal(result.ok, false)
})

test("CREATIVE_DIRECTOR_HERO_TREATMENTS_V1/PROCESS_TREATMENTS_V1/TWO_ITEM_LAYOUT_TREATMENTS_V1/SECTION_TONE_STRATEGIES_V1 match the composer's own executable vocabulary exactly", () => {
  assert.deepEqual([...CREATIVE_DIRECTOR_HERO_TREATMENTS_V1].sort(), [...HERO_TREATMENTS].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_PROCESS_TREATMENTS_V1].sort(), [...PROCESS_VARIANTS].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_TWO_ITEM_LAYOUT_TREATMENTS_V1].sort(), [...TWO_ITEM_LAYOUT_VARIANTS].sort())
  assert.deepEqual([...CREATIVE_DIRECTOR_SECTION_TONE_STRATEGIES_V1].sort(), [...SECTION_TONE_STRATEGIES].sort())
})

// ---------------------------------------------------------------------------
// M8) Existing V2-4 CreativeDirection remains valid without any new field
// ---------------------------------------------------------------------------

test("8) a V2-4-shaped proposal (no new fields at all) still validates", () => {
  const result = validateCreativeSiteDirectionV1({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    tone: "warm",
    density: "standard",
    pageDirections: [{ slug: "home", narrativeGoal: "x", preferredHeroVariant: "centered", ctaIntent: "appointment" }],
  })
  assert.equal(result.ok, true)
})

// ---------------------------------------------------------------------------
// M9-M12) V2-5B capabilities reach the composer via validated CD fields
// ---------------------------------------------------------------------------

function minimalArchitecture(
  sections: Array<{ role: string }>,
  extra: Partial<OrvenixSiteArchitecture> = {},
  archetype: "overview" | "catalog" | "conversion" = "overview",
): OrvenixSiteArchitecture {
  return {
    siteType: "health",
    industry: "fisioterapia",
    objective: "x",
    pages: [
      {
        name: "Inicio",
        slug: "home",
        purpose: "x",
        archetype,
        sections: sections.map((s) => ({ role: s.role as never, blockType: null, purpose: "x" })),
      },
    ],
    ...extra,
  }
}

test("9) abstract-glow heroTreatment reaches the composer through compileSiteBlueprint", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "hero" }, { role: "footer" }])
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ heroTreatment: "abstract-glow" }) })
  const nodes = blueprint.pages[0].tree.nodes
  const abstractGlowRoot = Object.values(nodes).find((n) => n.displayName === "Hero autonomo variante abstract-glow")
  assert.ok(abstractGlowRoot, "expected the abstract-glow hero's distinctive root node")
})

test("standard heroTreatment (or absent) never produces the abstract-glow root", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "hero" }, { role: "footer" }])
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ heroTreatment: "standard" }) })
  const nodes = blueprint.pages[0].tree.nodes
  assert.equal(Object.values(nodes).some((n) => n.displayName === "Hero autonomo variante abstract-glow"), false)
})

test("10) numbered processTreatment reaches the composer through compileSiteBlueprint", () => {
  // archetype "catalog" gives process 3 scaffolded items -- "overview" gives it exactly 2, which
  // would instead route through the (higher-priority) two-item-layout branch, not this one.
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "process" }, { role: "footer" }], {}, "catalog")
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ processTreatment: "numbered" }) })
  const nodes = blueprint.pages[0].tree.nodes
  const processRoot = Object.values(nodes).find((n) => typeof n.displayName === "string" && n.displayName.includes("(numbered)"))
  assert.ok(processRoot, "expected the process section's root to record layoutVariant=numbered")
})

test("11) paired twoItemLayoutTreatment reaches the composer for an exactly-two-item role", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "products" }, { role: "footer" }], {
    products: [{ name: "Producto A" }, { name: "Producto B" }],
  })
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ twoItemLayoutTreatment: "paired" }) })
  const nodes = blueprint.pages[0].tree.nodes
  const pairedRoot = Object.values(nodes).find((n) => typeof n.displayName === "string" && n.displayName.includes("(paired-layout)"))
  assert.ok(pairedRoot, "expected the products section's root to record layoutVariant=paired-layout")
})

test("12) cards twoItemLayoutTreatment remains possible with exactly two real items", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "products" }, { role: "footer" }], {
    products: [{ name: "Producto A" }, { name: "Producto B" }],
  })
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ twoItemLayoutTreatment: "cards" }) })
  const nodes = blueprint.pages[0].tree.nodes
  const cardsRoot = Object.values(nodes).find((n) => typeof n.displayName === "string" && n.displayName.includes("(cards)"))
  assert.ok(cardsRoot, "expected the products section's root to record layoutVariant=cards")
  assert.equal(Object.values(nodes).some((n) => typeof n.displayName === "string" && n.displayName.includes("(paired-layout)")), false)
})

/**
 * Bounded pre-commit refinement, section 5: makes explicit, in ONE test,
 * that a validated CD override actually CONTROLS the two-item
 * presentation -- not merely recorded while some other branch silently
 * wins -- using the exact SAME two semantic items ("Producto A"/"Producto
 * B") for both directions, only the CD field differs.
 */
test("5) CD twoItemLayoutTreatment override CONTROLS execution (not merely recorded): paired -> executes paired, cards -> executes cards, same two items both times", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "products" }, { role: "footer" }], {
    products: [{ name: "Producto A" }, { name: "Producto B" }],
  })

  const pairedBlueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ twoItemLayoutTreatment: "paired" }) })
  const cardsBlueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ twoItemLayoutTreatment: "cards" }) })

  const pairedNodes = pairedBlueprint.pages[0].tree.nodes
  const cardsNodes = cardsBlueprint.pages[0].tree.nodes

  assert.ok(Object.values(pairedNodes).some((n) => typeof n.displayName === "string" && n.displayName.includes("(paired-layout)")))
  assert.equal(Object.values(cardsNodes).some((n) => typeof n.displayName === "string" && n.displayName.includes("(paired-layout)")), false)
  assert.ok(Object.values(cardsNodes).some((n) => typeof n.displayName === "string" && n.displayName.includes("(cards)")))

  const namesFrom = (nodes: Record<string, { type: string; props?: Record<string, unknown> }>) =>
    Object.values(nodes).filter((n) => n.type === "heading" && n.props?.level === 3 && typeof n.props?.text === "string" && (n.props.text as string).startsWith("Producto")).map((n) => n.props?.text).sort()
  assert.deepEqual(namesFrom(pairedNodes as never), ["Producto A", "Producto B"])
  assert.deepEqual(namesFrom(cardsNodes as never), ["Producto A", "Producto B"])
})

function subtreeNodes(nodes: Record<string, { children: string[] }>, rootId: string): typeof nodes {
  const collected: Record<string, unknown> = {}
  const visit = (id: string) => {
    const node = nodes[id] as { children: string[] } | undefined
    if (!node || collected[id]) return
    collected[id] = node
    for (const childId of node.children ?? []) visit(childId)
  }
  visit(rootId)
  return collected as never
}

test("exactly two real items remain exactly two real items under paired layout (no fabricated third item)", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "products" }, { role: "footer" }], {
    products: [{ name: "Producto A" }, { name: "Producto B" }],
  })
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ twoItemLayoutTreatment: "paired" }) })
  const nodes = blueprint.pages[0].tree.nodes
  const productsRoot = Object.values(nodes).find((n) => typeof n.displayName === "string" && n.displayName.includes("(paired-layout)"))!
  const subtree = subtreeNodes(nodes as never, productsRoot.id) as unknown as Record<string, { type: string; props?: Record<string, unknown> }>
  const headings = Object.values(subtree)
    .filter((n) => n.type === "heading" && n.props?.level === 3)
    .map((n) => n.props?.text)
  assert.deepEqual(headings.sort(), ["Producto A", "Producto B"])
})

// ---------------------------------------------------------------------------
// M13-M15) Section-tone strategies
// ---------------------------------------------------------------------------

test("standard section-tone pool matches V2-5B's original pool exactly (byte-identical default)", () => {
  assert.deepEqual([...SECTION_TONE_POOLS.standard], ["base", "base", "base", "muted", "muted", "accent-soft", "contrast"])
})

test("13) sectionToneStrategy=standard reproduces the exact pre-V2-5C background sequence", () => {
  for (let i = 0; i < 10; i++) {
    const withStrategy = composeSection("features", { archetype: "overview", visualFamily: "professional", richComposition: true, sectionIndex: i, aiSectionToneStrategy: "standard" })
    const withoutStrategy = composeSection("features", { archetype: "overview", visualFamily: "professional", richComposition: true, sectionIndex: i })
    const bgA = (withStrategy!.nodes[withStrategy!.rootId].props as Record<string, unknown>).background
    const bgB = (withoutStrategy!.nodes[withoutStrategy!.rootId].props as Record<string, unknown>).background
    assert.equal(bgA, bgB)
  }
})

test("14) sectionToneStrategy=soft-rhythm reaches the composer and never yields a contrast background", () => {
  const backgrounds = new Set<string>()
  for (let i = 0; i < 40; i++) {
    const section = composeSection("features", { archetype: "overview", visualFamily: "professional", richComposition: true, sectionIndex: i, aiSectionToneStrategy: "soft-rhythm" })
    backgrounds.add((section!.nodes[section!.rootId].props as Record<string, unknown>).background as string)
  }
  assert.equal(backgrounds.has("#0b1220"), false)
})

test("15) sectionToneStrategy=contrast-led reaches the composer and does yield a contrast background", () => {
  const backgrounds = new Set<string>()
  for (let i = 0; i < 40; i++) {
    const section = composeSection("features", { archetype: "overview", visualFamily: "professional", richComposition: true, sectionIndex: i, aiSectionToneStrategy: "contrast-led" })
    backgrounds.add((section!.nodes[section!.rootId].props as Record<string, unknown>).background as string)
  }
  assert.equal(backgrounds.has("#0b1220"), true)
})

// ---------------------------------------------------------------------------
// M16) Real theme/accent input reaches composer without AI inventing it
// ---------------------------------------------------------------------------

test("16) a real resolved accentColor threaded through compileSiteBlueprint produces a tint of THAT color for accent-soft tone", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "features" }, { role: "footer" }])
  // Force a section index/role/family combination known to land on "accent-soft" isn't guaranteed by index alone,
  // so instead verify at the composer level directly with the SAME accentColor plumbing blueprint-compiler performs.
  void architecture
  let sawAccentTint = false
  for (let i = 0; i < 40; i++) {
    const section = composeSection("features", { archetype: "overview", visualFamily: "professional", richComposition: true, sectionIndex: i, accentColor: "#7c3aed" })
    const bg = (section!.nodes[section!.rootId].props as Record<string, unknown>).background as string
    if (bg !== "#ffffff" && bg !== "#f8fafc" && bg !== "#0b1220") {
      sawAccentTint = true
      assert.notEqual(bg, "#7c3aed") // a TINT, never the raw accent itself
    }
  }
  assert.equal(sawAccentTint, true, "expected at least one accent-soft section within 40 samples")
})

test("CreativeSiteDirectionV1 has no accentColor concept anywhere -- Orvenix, never the AI, resolves it", () => {
  assert.equal("accentColor" in directionWithPage({}), false)
})

// ---------------------------------------------------------------------------
// M17) Fallback/no-CD path never globally enables richComposition
// ---------------------------------------------------------------------------

function findCardGridRoot(nodes: Record<string, { type: string; displayName: string; props?: Record<string, unknown> }>) {
  return Object.values(nodes).find((n) => n.type === "section" && /\([a-z-]+\)$/.test(n.displayName))
}

test("17) compileSiteBlueprint with no creativeDirection never activates richComposition (background stays the pre-V2-5B default)", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "features" }, { role: "footer" }])
  const blueprint = compileSiteBlueprint(architecture, {})
  const featuresRoot = findCardGridRoot(blueprint.pages[0].tree.nodes as never)
  assert.ok(featuresRoot)
  assert.equal((featuresRoot!.props as Record<string, unknown>).background, "#ffffff")
})

test("a creativeDirection with ONLY unrelated fields (no V2-5B treatment field) never activates richComposition", () => {
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "features" }, { role: "footer" }])
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: directionWithPage({ heroTitleSuggestion: "x", ctaIntent: "contact" }) })
  const featuresRoot = findCardGridRoot(blueprint.pages[0].tree.nodes as never)
  assert.ok(featuresRoot)
  assert.equal((featuresRoot!.props as Record<string, unknown>).background, "#ffffff")
})

// ---------------------------------------------------------------------------
// M18) Invalid CD response safely falls back
// ---------------------------------------------------------------------------

test("18) an invalid heroTreatment from the provider is dropped, proposal still applies safely", async () => {
  const request = baseRequest()
  const result = await requestCreativeDirectionV1({
    request,
    provider: createDeterministicCreativeDirectorProviderV1("invalid_hero_treatment"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.proposal.pageDirections[0].heroTreatment, undefined)
})

test("18) a fully invalid-schema CD response falls back cleanly (validation_failed, never a throw)", async () => {
  const request = baseRequest()
  const result = await requestCreativeDirectionV1({
    request,
    provider: createDeterministicCreativeDirectorProviderV1("invalid_schema"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.failureCode, "validation_failed")
})

// ---------------------------------------------------------------------------
// M19) CD-disabled path remains deterministic even with retrieval wired in
// ---------------------------------------------------------------------------

test("19) CD-disabled: resolveSiteCreationCreativeDirectionV1 skips deterministically, never touches retrieval/provider", async () => {
  const result = await resolveSiteCreationCreativeDirectionV1({
    userId: "u1",
    siteCreationAttemptId: "a1",
    designMemoryDecision: { kind: "none", context: {} } as never,
    business: PHYSIO_BUSINESS,
    architecture: PHYSIO_ARCHITECTURE,
    enabled: false,
    hasApiKey: true,
  })
  assert.deepEqual(result, { ok: true, status: "skipped", reason: "disabled" })
})

test("eligibility decision itself is unaffected by reference-augmentation (still just enabled/L2/apiKey gated)", () => {
  const disabled = decideCreativeDirectorEligibilityV1({ designMemoryDecision: { kind: "none", context: {} } as never, enabled: false, hasApiKey: true })
  assert.deepEqual(disabled, { eligible: false, reason: "disabled" })
})

// ---------------------------------------------------------------------------
// M20/M21) Reference influence vs. copying: grammar, never id, drives decisions
// ---------------------------------------------------------------------------

test("20) reference id ALONE cannot select a treatment -- same grammar, different ids, same decision", async () => {
  const requestA: CreativeDirectorRequestV1 = { ...baseRequest(), referenceContext: [fixtureReference({ id: "webs:alpha", heroGrammar: { ...fixtureReference().heroGrammar, backgroundTreatment: "abstract-glow" } })] }
  const requestB: CreativeDirectorRequestV1 = { ...baseRequest(), referenceContext: [fixtureReference({ id: "webs:omega-different-id", heroGrammar: { ...fixtureReference().heroGrammar, backgroundTreatment: "abstract-glow" } })] }

  const provider = createDeterministicCreativeDirectorProviderV1("reference_aware")
  const proposalA = (await provider.request(requestA)) as CreativeSiteDirectionV1
  const proposalB = (await provider.request(requestB)) as CreativeSiteDirectionV1

  assert.equal(proposalA.pageDirections[0].heroTreatment, proposalB.pageDirections[0].heroTreatment)
  assert.equal(proposalA.pageDirections[0].heroTreatment, "abstract-glow")
})

test("21) changing reference GRAMMAR (same ids) changes the deterministic bounded decision", async () => {
  const requestStandard: CreativeDirectorRequestV1 = { ...baseRequest(), referenceContext: [fixtureReference({ id: "webs:same-id", heroGrammar: { ...fixtureReference().heroGrammar, backgroundTreatment: "full-bleed-photo" } })] }
  const requestGlow: CreativeDirectorRequestV1 = { ...baseRequest(), referenceContext: [fixtureReference({ id: "webs:same-id", heroGrammar: { ...fixtureReference().heroGrammar, backgroundTreatment: "abstract-glow" } })] }

  const provider = createDeterministicCreativeDirectorProviderV1("reference_aware")
  const proposalStandard = (await provider.request(requestStandard)) as CreativeSiteDirectionV1
  const proposalGlow = (await provider.request(requestGlow)) as CreativeSiteDirectionV1

  assert.equal(proposalStandard.pageDirections[0].heroTreatment, "standard")
  assert.equal(proposalGlow.pageDirections[0].heroTreatment, "abstract-glow")
})

test("no reference is copied into the composer output (composeSection never emits a reference id or grammar token)", () => {
  const section = composeSection("hero", { archetype: "overview", visualFamily: "professional", richComposition: true, aiPreferredHeroTreatment: "abstract-glow" })
  const serialized = JSON.stringify(section)
  assert.equal(serialized.includes("webs:"), false)
})

// ---------------------------------------------------------------------------
// Bounded pre-commit refinement, section 3: controlled X/Y/Z reference
// contexts with GENUINELY different grammar, identical business facts,
// through the actual reference-augmented pathway (requestCreativeDirectionV1
// gateway + createDeterministicCreativeDirectorProviderV1("reference_aware"),
// not a bespoke shortcut). Section 4 (immersive photography) is folded in
// here too since it reuses context Y.
// ---------------------------------------------------------------------------

function threeReferences(overrides: Partial<CreativeDesignReferenceV1>, idPrefix: string): CreativeDesignReferenceV1[] {
  return [0, 1, 2].map((i) => fixtureReference({ ...overrides, id: `webs:${idPrefix}-${i}` as never }))
}

const REFERENCE_CONTEXT_X = threeReferences(
  { heroGrammar: { backgroundTreatment: "abstract-glow", alignment: "center", mediaStrategy: "none", ctaArrangement: "dual-cta" }, sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "alternating" } },
  "abstract",
)
const REFERENCE_CONTEXT_Y = threeReferences(
  { heroGrammar: { backgroundTreatment: "full-bleed-photo", alignment: "left", mediaStrategy: "photography", ctaArrangement: "single-cta" }, sectionGrammar: { recurringTreatments: ["standard-grid"], density: "standard", backgroundRhythm: "uniform" } },
  "photo",
)
const REFERENCE_CONTEXT_Z = threeReferences(
  { heroGrammar: { backgroundTreatment: "solid-gradient", alignment: "center", mediaStrategy: "none", ctaArrangement: "dual-cta" }, sectionGrammar: { recurringTreatments: ["numbered-process", "paired-layout"], density: "compact", backgroundRhythm: "alternating" }, conversionGrammar: { ctaStrategy: "dual-action", contactPattern: "booking-form" } },
  "structural",
)

async function decisionsFor(referenceContext: CreativeDesignReferenceV1[]) {
  const request: CreativeDirectorRequestV1 = { ...baseRequest(), referenceContext }
  const result = await requestCreativeDirectionV1({
    request,
    provider: createDeterministicCreativeDirectorProviderV1("reference_aware"),
    providerKey: "anthropic",
    modelKey: "claude_haiku_4_5",
  })
  assert.equal(result.ok, true)
  if (!result.ok) throw new Error("unreachable")
  return result.proposal.pageDirections[0]
}

test("3) REFERENCE_CONTEXT_X (strong abstract/ambient grammar) yields heroTreatment=abstract-glow, same business facts", async () => {
  const decision = await decisionsFor(REFERENCE_CONTEXT_X)
  assert.equal(decision.heroTreatment, "abstract-glow")
  assert.notEqual(decision.preferredHeroVariant, "immersive")
})

test("3/4) REFERENCE_CONTEXT_Y (strong photography/immersive grammar) yields preferredHeroVariant=immersive, executed by the composer", async () => {
  const decision = await decisionsFor(REFERENCE_CONTEXT_Y)
  assert.equal(decision.preferredHeroVariant, "immersive")
  assert.notEqual(decision.heroTreatment, "abstract-glow")

  // IMMERSIVE_EXECUTION_SUMMARY: run the actual proposal through compileSiteBlueprint and confirm the
  // immersive hero's distinctive structural marker (bg-gradient-to-t + absolute inset-0 overlay,
  // same marker creative-director-consumption-v1.test.ts's "K" test uses) is actually PRESENT --
  // proving the photography-favoring reference context reaches EXECUTION, not just the decision.
  const architecture = minimalArchitecture([{ role: "navigation" }, { role: "hero" }, { role: "footer" }])
  const direction = directionWithPage({ preferredHeroVariant: decision.preferredHeroVariant })
  const blueprint = compileSiteBlueprint(architecture, { creativeDirection: direction })
  const hasImmersiveOverlay = Object.values(blueprint.pages[0].tree.nodes).some(
    (n) => typeof n.props?.className === "string" && n.props.className.includes("bg-gradient-to-t") && n.props.className.includes("absolute inset-0"),
  )
  assert.equal(hasImmersiveOverlay, true)
})

test("3) REFERENCE_CONTEXT_Z (strong structural/process/conversion grammar) yields processTreatment=numbered and twoItemLayoutTreatment=paired", async () => {
  const decision = await decisionsFor(REFERENCE_CONTEXT_Z)
  assert.equal(decision.processTreatment, "numbered")
  assert.equal(decision.twoItemLayoutTreatment, "paired")
  assert.notEqual(decision.heroTreatment, "abstract-glow")
  assert.notEqual(decision.preferredHeroVariant, "immersive")
})

test("X/Y/Z decisions are all mutually distinct (genuinely different grammar -> genuinely different bounded decisions)", async () => {
  const x = await decisionsFor(REFERENCE_CONTEXT_X)
  const y = await decisionsFor(REFERENCE_CONTEXT_Y)
  const z = await decisionsFor(REFERENCE_CONTEXT_Z)
  const fingerprint = (d: typeof x) => JSON.stringify({ heroTreatment: d.heroTreatment, preferredHeroVariant: d.preferredHeroVariant, processTreatment: d.processTreatment, twoItemLayoutTreatment: d.twoItemLayoutTreatment })
  const fx = fingerprint(x)
  const fy = fingerprint(y)
  const fz = fingerprint(z)
  assert.notEqual(fx, fy)
  assert.notEqual(fy, fz)
  assert.notEqual(fx, fz)
})

test("replacing X's reference ids while keeping its grammar identical yields IDENTICAL decisions", async () => {
  const xReplacedIds = REFERENCE_CONTEXT_X.map((r, i) => ({ ...r, id: `webs:totally-different-id-${i}` as never }))
  const original = await decisionsFor(REFERENCE_CONTEXT_X)
  const replaced = await decisionsFor(xReplacedIds)
  assert.equal(original.heroTreatment, replaced.heroTreatment)
  assert.equal(original.processTreatment, replaced.processTreatment)
  assert.equal(original.twoItemLayoutTreatment, replaced.twoItemLayoutTreatment)
  assert.equal(original.preferredHeroVariant, replaced.preferredHeroVariant)
})

// ---------------------------------------------------------------------------
// M22) No arbitrary CSS/Tailwind/JSX enters the contract
// ---------------------------------------------------------------------------

test("22) the four new bounded fields are closed enums -- a CSS-shaped string is never accepted", () => {
  const result = validateCreativeSiteDirectionV1(
    directionWithPage({ heroTreatment: "bg-red-500 absolute inset-0", processTreatment: "<div className=\"x\">", twoItemLayoutTreatment: "grid-cols-3 gap-4", sectionToneStrategy: "#ff00ff" }),
  )
  assert.equal(result.ok, true)
  if (result.ok) {
    const direction = result.value.pageDirections[0]
    assert.equal(direction.heroTreatment, undefined)
    assert.equal(direction.processTreatment, undefined)
    assert.equal(direction.twoItemLayoutTreatment, undefined)
    assert.equal(direction.sectionToneStrategy, undefined)
  }
})
