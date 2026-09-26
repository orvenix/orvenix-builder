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
  createAssistedGenerationInputFingerprintV1,
  createAssistedGenerationProposalFingerprintV1,
  createDeterministicAssistedSiteGenerationProviderV1,
  groundAssistedSiteGenerationProposalV1,
  validateAssistedSiteGenerationProposalV1,
  type AssistedGenerationGroundingContextV1,
  type AssistedSiteGenerationProposalV1,
} from "../../lib/orvenix-ai/assisted-generation"

const context: AssistedGenerationGroundingContextV1 = {
  pages: [
    { slug: "home", roles: ["navigation", "hero", "services", "cta", "footer"] },
    { slug: "servicios", roles: ["navigation", "services", "features", "cta", "footer"] },
    { slug: "productos", roles: ["navigation", "products", "pricing", "cta", "footer"] },
    { slug: "portfolio", roles: ["navigation", "gallery", "cta", "footer"] },
  ],
  servicesCount: 3,
  productsCount: 2,
}

function validProposal(overrides: Partial<AssistedSiteGenerationProposalV1> = {}): AssistedSiteGenerationProposalV1 {
  return {
    version: 1,
    roleKey: "assisted_site_generation_v1",
    strategyKey: "composition_layout_advisory_v1",
    siteNarrative: "Diseno editorial premium con ritmo comercial. La palabra style aqui es prosa, no una clave ejecutable.",
    pages: [
      {
        slug: "home",
        sectionOrder: ["navigation", "hero", "services", "cta", "footer"],
        instances: [
          { role: "navigation", composition: { layout: { kind: "navigation-split" } } },
          { role: "hero", composition: { layout: { kind: "oversized-typography", rhythm: "spacious" } } },
          { role: "services", selection: { mode: "single-item", itemIndex: 0 }, composition: { treatment: "featured-asymmetric", layout: { kind: "editorial-split" }, alignment: "left" } },
          { role: "services", selection: { mode: "single-item", itemIndex: 1 }, composition: { layout: { kind: "mirror-split" }, alignment: "right" } },
          { role: "cta", composition: { layout: { kind: "dramatic-closing" }, backgroundStrategy: "contrast-led" } },
        ],
      },
    ],
    ...overrides,
  }
}

function expectValid(candidate: unknown) {
  const result = validateAssistedSiteGenerationProposalV1(candidate)
  assert.equal(result.ok, true, "errors" in result ? result.errors.join("\n") : "")
  return result
}

function expectInvalid(candidate: unknown, includes: string) {
  const result = validateAssistedSiteGenerationProposalV1(candidate)
  assert.equal(result.ok, false)
  assert.ok("errors" in result)
  assert.ok(result.errors.some((error) => error.includes(includes)), result.errors.join("\n"))
  return result
}

function expectRejected(candidate: unknown, includes: string) {
  const result = groundAssistedSiteGenerationProposalV1({ proposal: candidate, context })
  assert.equal(result.accepted, false)
  assert.ok(result.rejectedReasons.some((reason) => reason.includes(includes)), result.rejectedReasons.join("\n"))
  return result
}

test("1) valid proposal accepted", () => {
  const result = expectValid(validProposal())
  assert.equal(result.value.roleKey, "assisted_site_generation_v1")
})

test("2) multiple valid pages are accepted", () => {
  const result = expectValid(validProposal({
    pages: [
      validProposal().pages[0],
      { slug: "servicios", instances: [{ role: "services", selection: { mode: "subset", indexes: [0, 2] }, composition: { layout: { kind: "card-grid" } } }] },
    ],
  }))
  assert.equal(result.value.pages.length, 2)
})

test("3) valid CompositionPlan instances survive grounding", () => {
  const result = groundAssistedSiteGenerationProposalV1({ proposal: validProposal(), context })
  assert.equal(result.accepted, true)
  assert.equal(result.compositionPlan.pages[0].instances[2].role, "services")
  assert.deepEqual(result.compositionPlan.pages[0].instances[2].selection, { mode: "single-item", itemIndex: 0 })
})

test("4) valid VisualLayoutPlan survives validation", () => {
  const result = expectValid(validProposal())
  assert.deepEqual(result.value.pages[0].instances?.[2].composition?.layout, { kind: "editorial-split" })
})

test("5) valid navigation layout survives and remains bounded", () => {
  const result = groundAssistedSiteGenerationProposalV1({ proposal: validProposal(), context })
  assert.equal(result.accepted, true)
  assert.deepEqual(result.compositionPlan.pages[0].instances[0].composition?.layout, { kind: "navigation-split" })
})

test("6) deterministic fingerprint is stable for key order changes", () => {
  const a = createAssistedGenerationProposalFingerprintV1({ b: 2, a: { y: true, x: "ok" } })
  const b = createAssistedGenerationProposalFingerprintV1({ a: { x: "ok", y: true }, b: 2 })
  assert.equal(a, b)
  assert.match(createAssistedGenerationInputFingerprintV1(validProposal()), /^[a-f0-9]{64}$/)
})

test("7) wrong version rejected", () => {
  expectInvalid({ ...validProposal(), version: 2 }, "version")
})

test("8) wrong roleKey rejected", () => {
  expectInvalid({ ...validProposal(), roleKey: "creative_director_v1" }, "roleKey")
})

test("9) wrong strategyKey rejected", () => {
  expectInvalid({ ...validProposal(), strategyKey: "freeform_site_v1" }, "strategyKey")
})

test("10) duplicate slug rejected", () => {
  const page = validProposal().pages[0]
  expectInvalid(validProposal({ pages: [page, page] }), "duplicado")
})

test("11) unknown role rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "sidebar" as never }] }] }), "role")
})

test("12) invalid selection mode rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "everything" } as never }] }] }), "mode")
})

test("13) negative index rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "single-item", itemIndex: -1 } }] }] }), "itemIndex")
})

test("14) duplicate indexes rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "subset", indexes: [0, 0] } }] }] }), "duplicados")
})

test("15) oversized subset rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "subset", indexes: Array.from({ length: 13 }, (_, index) => index) } }] }] }), "limite")
})

test("16) invalid VisualLayoutPlan rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "navigation", composition: { layout: { kind: "full-bleed-media" } as never } }] }] }), "layout")
})

test("17) arbitrary className rejected", () => {
  expectInvalid(validProposal({ className: "fixed" } as never), "className")
})

test("18) CSS key rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "hero", composition: { css: "body{}" } as never }] }] }), "css")
})

test("19) JSX/component key rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "hero", componentName: "Unsafe" } as never] }] }), "componentName")
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "hero", composition: { jsx: "<div />" } as never }] }] }), "jsx")
})

test("20) URL/src/href keys rejected", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", href: "/checkout", instances: [] } as never] }), "href")
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "hero", composition: { src: "https://example.test/a.jpg" } as never }] }] }), "src")
})

test("21) unknown page slug rejected by grounding", () => {
  expectRejected(validProposal({ pages: [{ slug: "landing", instances: [{ role: "hero" }] }] }), "no existe")
})

test("22) nonexistent role rejected by grounding", () => {
  expectRejected(validProposal({ pages: [{ slug: "servicios", instances: [{ role: "hero" }] }] }), "no existe en esta pagina")
})

test("23) nonexistent service index rejected", () => {
  expectRejected(validProposal({ pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "single-item", itemIndex: 99 } }] }] }), "itemIndex")
})

test("24) nonexistent product index rejected", () => {
  expectRejected(validProposal({ pages: [{ slug: "productos", instances: [{ role: "products", selection: { mode: "subset", indexes: [0, 4] } }] }] }), "subset")
})

test("25) provider cannot create new service", () => {
  const result = groundAssistedSiteGenerationProposalV1({ proposal: validProposal({ pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "single-item", itemIndex: 3 } }] }] }), context })
  assert.equal(result.accepted, false)
})

test("26) provider cannot create new product", () => {
  const result = groundAssistedSiteGenerationProposalV1({ proposal: validProposal({ pages: [{ slug: "productos", instances: [{ role: "products", selection: { mode: "single-item", itemIndex: 2 } }] }] }), context })
  assert.equal(result.accepted, false)
})

test("27) provider cannot create new page", () => {
  expectRejected(validProposal({ pages: [{ slug: "blog", sectionOrder: ["navigation", "content", "footer"] }] }), "no existe")
})

test("28) provider cannot create route", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", url: "/blog", instances: [] } as never] }), "url")
})

test("29) section order cannot remove required navigation/footer", () => {
  expectRejected(validProposal({ pages: [{ slug: "home", sectionOrder: ["hero", "services", "cta"], instances: [{ role: "hero" }] }] }), "sectionOrder")
})

test("30) section order cannot introduce forbidden role", () => {
  expectRejected(validProposal({ pages: [{ slug: "home", sectionOrder: ["navigation", "hero", "products", "cta", "footer"], instances: [{ role: "hero" }] }] }), "sectionOrder")
})

test("31) valid repeated service instances preserve grounded indexes", () => {
  const result = groundAssistedSiteGenerationProposalV1({ proposal: validProposal(), context })
  assert.equal(result.accepted, true)
  assert.deepEqual(
    result.compositionPlan.pages[0].instances.filter((instance) => instance.role === "services").map((instance) => instance.selection),
    [{ mode: "single-item", itemIndex: 0 }, { mode: "single-item", itemIndex: 1 }],
  )
})

test("32) mirror/editorial/full-bleed layouts survive adapter", () => {
  const result = groundAssistedSiteGenerationProposalV1({
    proposal: validProposal({
      pages: [
        { slug: "home", instances: [{ role: "services", selection: { mode: "single-item", itemIndex: 0 }, composition: { layout: { kind: "mirror-split" } } }] },
        { slug: "servicios", instances: [{ role: "services", selection: { mode: "single-item", itemIndex: 1 }, composition: { layout: { kind: "editorial-passage" } } }] },
        { slug: "portfolio", instances: [{ role: "gallery", composition: { layout: { kind: "full-bleed-media" } } }] },
      ],
    }),
    context,
  })
  assert.equal(result.accepted, true)
  assert.deepEqual(result.compositionPlan.pages.flatMap((page) => page.instances.map((instance) => instance.composition?.layout?.kind)), ["mirror-split", "editorial-passage", "full-bleed-media"])
})

test("33) navigation layout survives but actual links are untouched", () => {
  const result = groundAssistedSiteGenerationProposalV1({ proposal: validProposal(), context })
  assert.equal(result.accepted, true)
  assert.equal(JSON.stringify(result.compositionPlan).includes("href"), false)
  assert.equal(JSON.stringify(result.compositionPlan).includes("page:"), false)
})

test("34) malformed proposal rejected", () => {
  expectInvalid(null, "objeto")
})

test("35) empty pages rejected", () => {
  expectInvalid(validProposal({ pages: [] }), "vacio")
})

test("36) partial page invalidity keeps safe valid pages and reports reason", () => {
  const result = groundAssistedSiteGenerationProposalV1({
    proposal: validProposal({ pages: [validProposal().pages[0], { slug: "landing", instances: [{ role: "hero" }] }] }),
    context,
  })
  assert.equal(result.accepted, true)
  assert.equal(result.compositionPlan.pages.length, 1)
  assert.ok(result.rejectedReasons.some((reason) => reason.includes("landing")))
})

test("37) all pages invalid rejects proposal", () => {
  expectRejected(validProposal({ pages: [{ slug: "landing", instances: [{ role: "hero" }] }] }), "landing")
})

test("38) invalid layout for otherwise valid role rejects before grounding", () => {
  expectInvalid(validProposal({ pages: [{ slug: "home", instances: [{ role: "hero", composition: { layout: { kind: "navigation-overlay" } as never } }] }] }), "layout")
})

test("39) oversized proposal rejected", () => {
  expectInvalid(validProposal({ pages: Array.from({ length: 13 }, (_, index) => ({ slug: `page-${index}`, instances: [{ role: "hero" as const }] })) }), "limite")
})

test("40) adapter rejection returns enough reason for future DesignAssistance attribution", () => {
  const result = expectRejected(validProposal({ pages: [{ slug: "home", instances: [{ role: "services", selection: { mode: "single-item", itemIndex: 99 } }] }] }), "itemIndex")
  assert.ok(result.rejectedReasons[0].includes("pages[0].instances[0]"))
})

test("deterministic test provider returns configured proposals without network", async () => {
  const provider = createDeterministicAssistedSiteGenerationProviderV1(validProposal())
  const first = await provider.request({ requestId: "a" })
  const second = await provider.request({ requestId: "b" })
  assert.deepEqual(first, second)
  assert.notEqual(first, validProposal())
})
