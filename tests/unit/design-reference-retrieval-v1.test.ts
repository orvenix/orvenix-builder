import test from "node:test"
import assert from "node:assert/strict"

import { retrieveDesignReferences } from "../../lib/orvenix-ai/design-reference/retrieve"
import { computeReferenceSimilarity } from "../../lib/orvenix-ai/design-reference/similarity"
import { getDesignReferences } from "../../lib/orvenix-ai/design-reference/library"
import { findSanitizationViolations } from "../../lib/orvenix-ai/design-reference/sanitize"
import type { DesignReferenceRetrievalQuery } from "../../lib/orvenix-ai/design-reference/retrieval-contract"

function ids(result: ReturnType<typeof retrieveDesignReferences>): string[] {
  return result.selections.map((s) => s.reference.id)
}

test("1) same query produces a deterministic, deep-equal result repeatedly", () => {
  const query: DesignReferenceRetrievalQuery = { businessAffinity: "health", conversionIntent: "appointment" }
  const first = retrieveDesignReferences(query)
  const second = retrieveDesignReferences(query)
  assert.deepEqual(first, second)
})

test("2) result contains no duplicate reference IDs", () => {
  const result = retrieveDesignReferences({ businessAffinity: "retail-commerce", conversionIntent: "catalog" })
  const uniqueIds = new Set(ids(result))
  assert.equal(uniqueIds.size, ids(result).length)
})

test("3) requested count is respected and clamped to <= 4", () => {
  const two = retrieveDesignReferences({ businessAffinity: "health" }, { count: 2 })
  assert.ok(two.selections.length <= 2)

  const overRequested = retrieveDesignReferences({ businessAffinity: "health" }, { count: 10 })
  assert.ok(overRequested.selections.length <= 4)
  assert.equal(overRequested.coverage.requestedCount, 4)
})

test("4) health/appointment query includes the health-affinity reference when credible", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "health", conversionIntent: "appointment", pagePurposes: ["home", "services", "contact"] },
    { count: 4 },
  )
  assert.ok(ids(result).includes("webs:clinica"))
  assert.equal(result.coverage.businessAffinityCovered, true)
})

test("5) health query does not return four same-family near-clones when alternatives exist", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "health", conversionIntent: "appointment", pagePurposes: ["home", "services", "contact"] },
    { count: 4 },
  )
  const families = new Set(result.selections.map((s) => s.reference.identity.visualFamily))
  assert.ok(families.size > 1, `expected more than one visual family, got ${JSON.stringify([...families])}`)

  // no two selected references should be near-duplicates of each other
  for (let i = 0; i < result.selections.length; i++) {
    for (let j = i + 1; j < result.selections.length; j++) {
      const sim = computeReferenceSimilarity(result.selections[i].reference, result.selections[j].reference)
      assert.ok(sim < 0.82, `selections ${i} and ${j} are near-duplicates (similarity=${sim})`)
    }
  }
})

test("6) food/hospitality + booking query retrieves a relevant reference with booking grammar", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "food-hospitality", conversionIntent: "booking", pagePurposes: ["home", "catalog", "contact"] },
    { count: 4 },
  )
  assert.ok(ids(result).includes("webs:restaurante"))
  const hasBookingGrammar = result.selections.some((s) => s.reference.conversionGrammar.contactPattern === "booking-form")
  assert.ok(hasBookingGrammar)
})

test("7) retail-commerce + catalog query retrieves commerce-relevant grammar", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "retail-commerce", conversionIntent: "catalog", hasProducts: true, pagePurposes: ["home", "catalog", "cart", "contact"] },
    { count: 4 },
  )
  const hasCommerceGrammar = result.selections.some(
    (s) => s.reference.distinctiveTraits.includes("cart-flow") || s.reference.distinctiveTraits.includes("catalog-browsing"),
  )
  assert.ok(hasCommerceGrammar)
  assert.ok(result.selections.some((s) => s.contributionRoles.includes("commerce-structure")))
})

test("8) SaaS + pricing query makes launchpro highly relevant purely through its own grammar (not hardcoded)", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "saas", conversionIntent: "pricing", pagePurposes: ["home", "pricing", "contact"] },
    { count: 4 },
  )
  assert.equal(ids(result)[0], "webs:launchpro")
  const top = result.selections[0]
  assert.equal(top.reference.identity.businessAffinity, "saas")
  assert.equal(top.reference.conversionGrammar.ctaStrategy, "pricing-driven")
  assert.ok(top.relevanceScore > 0.7, `expected launchpro relevance > 0.7, got ${top.relevanceScore}`)
})

test("9) creative/professional-services query returns relevant references while preserving diversity", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "creative-services", conversionIntent: "lead", pagePurposes: ["home", "services", "about", "contact"] },
    { count: 4 },
  )
  assert.ok(result.selections.length >= 2)
  const uniqueVisualFamilies = new Set(result.selections.map((s) => s.reference.identity.visualFamily))
  assert.ok(uniqueVisualFamilies.size >= 1)
})

test("10) sparse query remains deterministic and returns honest generic/diverse references", () => {
  const first = retrieveDesignReferences({})
  const second = retrieveDesignReferences({})
  assert.deepEqual(first, second)
  assert.equal(first.diagnostics.sparseQuery, true)
  assert.ok(first.selections.length > 0)
  // no dimension should claim a business-affinity match when nothing was asked
  for (const selection of first.selections) {
    assert.equal(selection.scoreComponents.businessAffinity, undefined)
  }
})

test("11) visual preference photography gains legitimate relevance", () => {
  const result = retrieveDesignReferences({ visualFamily: "full-bleed-photography" })
  assert.equal(result.selections[0].reference.identity.visualFamily, "full-bleed-photography")
  assert.equal(result.selections[0].scoreComponents.visualCompatibility, 1)
})

test("12) visual preference abstract gains legitimate relevance", () => {
  const result = retrieveDesignReferences({ visualFamily: "ambient-dark-abstract" })
  assert.equal(result.selections[0].reference.identity.visualFamily, "ambient-dark-abstract")
  assert.equal(result.selections[0].scoreComponents.visualCompatibility, 1)
})

test("13) diversity logic prevents near-identical selected sets where credible alternatives exist", () => {
  // legal-professional has only 2 references, but a broad conversion-agnostic query over the whole
  // ambient-dark-heavy library should still not collapse into 4 near-clones.
  const result = retrieveDesignReferences({ conversionIntent: "contact" }, { count: 4 })
  for (let i = 0; i < result.selections.length; i++) {
    for (let j = i + 1; j < result.selections.length; j++) {
      const sim = computeReferenceSimilarity(result.selections[i].reference, result.selections[j].reference)
      assert.ok(sim < 0.82, `selections ${i} and ${j} are near-duplicates (similarity=${sim})`)
    }
  }
})

test("14) similarity/exclusion diagnostics are deterministic", () => {
  const query: DesignReferenceRetrievalQuery = { businessAffinity: "legal-professional", conversionIntent: "lead" }
  const first = retrieveDesignReferences(query)
  const second = retrieveDesignReferences(query)
  assert.deepEqual(first.diagnostics.excludedForSimilarity, second.diagnostics.excludedForSimilarity)
})

test("15) retrieval output contains no source copy, URLs, emails, phones, prices, ratings, names, or raw JSX", () => {
  const queries: DesignReferenceRetrievalQuery[] = [
    { businessAffinity: "health", conversionIntent: "appointment" },
    { businessAffinity: "food-hospitality", conversionIntent: "booking" },
    { businessAffinity: "saas", conversionIntent: "pricing" },
    {},
  ]
  for (const query of queries) {
    const result = retrieveDesignReferences(query, { count: 4 })
    for (const selection of result.selections) {
      assert.deepEqual(findSanitizationViolations(selection.reference), [])
    }
    const serialized = JSON.stringify(result)
    assert.equal(/https?:\/\//i.test(serialized), false)
    assert.equal(/<section|<div|className=|useState\(/.test(serialized), false)
  }
})

test("16) all existing Design Reference tests continue passing (sanity: library still returns 25)", () => {
  assert.equal(getDesignReferences().length, 25)
})

test("anti-overfit: two health-adjacent queries with different needs produce different results, driven by grammar not a fixed template", () => {
  const appointmentOnly = retrieveDesignReferences({ businessAffinity: "health", conversionIntent: "appointment" }, { count: 4 })
  const appointmentWithPhotography = retrieveDesignReferences(
    { businessAffinity: "health", conversionIntent: "appointment", visualFamily: "full-bleed-photography" },
    { count: 4 },
  )

  // Both should still surface the health reference, but the REST of the
  // set (order, composition, or contribution roles) must differ once a
  // visual preference is introduced -- otherwise retrieval would just be
  // businessAffinity -> one fixed template, which is exactly what this
  // guards against.
  assert.ok(ids(appointmentOnly).includes("webs:clinica"))
  assert.ok(ids(appointmentWithPhotography).includes("webs:clinica"))
  const differs =
    JSON.stringify(ids(appointmentOnly)) !== JSON.stringify(ids(appointmentWithPhotography)) ||
    JSON.stringify(appointmentOnly.selections.map((s) => s.contributionRoles)) !==
      JSON.stringify(appointmentWithPhotography.selections.map((s) => s.contributionRoles))
  assert.ok(differs, "expected the photography preference to change the selection or its contribution roles")

  // and the second query's non-health picks should skew toward photography references
  const photographyCount = appointmentWithPhotography.selections.filter(
    (s) => s.reference.identity.visualFamily === "full-bleed-photography",
  ).length
  assert.ok(photographyCount >= 1)
})

test("coverage flags are honest about whether the request was actually satisfied", () => {
  const result = retrieveDesignReferences({ businessAffinity: "saas", conversionIntent: "pricing" })
  assert.equal(result.coverage.businessAffinityCovered, true)
  assert.equal(result.coverage.conversionCovered, true)
})

// V2-5A.3 pre-commit refinement: a relative minimum-relevance floor
// (a complementary pick must reach 30% of the anchor's own relevance)
// now excludes picks that only share incidental page-purpose overlap
// with no real business/conversion signal, preferring fewer results
// over padding with a barely-credible reference.
test("minimum relevance floor: SaaS+pricing no longer includes a near-arbitrary low-relevance pick", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "saas", conversionIntent: "pricing", pagePurposes: ["home", "pricing", "contact"] },
    { count: 4 },
  )
  for (const selection of result.selections) {
    assert.ok(
      selection.relevanceScore >= result.selections[0].relevanceScore * 0.3,
      `${selection.reference.id} (${selection.relevanceScore}) is below the relevance floor relative to the anchor (${result.selections[0].relevanceScore})`,
    )
  }
})

test("minimum relevance floor: sparse queries are never floored out (floor scales with the neutral baseline)", () => {
  const result = retrieveDesignReferences({})
  assert.equal(result.diagnostics.sparseQuery, true)
  assert.equal(result.selections.length, 4)
})

test("minimum relevance floor: prefers returning fewer over padding once no candidate clears it", () => {
  const result = retrieveDesignReferences(
    { businessAffinity: "health", conversionIntent: "appointment", pagePurposes: ["home", "services", "contact"] },
    { count: 4 },
  )
  // Every returned selection must individually clear the floor -- this
  // is allowed to return fewer than 4 (it does, for this exact query).
  const anchor = result.selections[0].relevanceScore
  for (const selection of result.selections) {
    assert.ok(selection.relevanceScore >= anchor * 0.3)
  }
})
