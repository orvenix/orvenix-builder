import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  discoverDesignReferences,
  discoverWebsCandidates,
  defaultWebsRoot,
  extractDesignReference,
} from "../../lib/orvenix-ai/design-reference/extract"
import {
  getDesignReferenceById,
  getDesignReferences,
  resetDesignReferenceCacheForTests,
} from "../../lib/orvenix-ai/design-reference/library"
import { findSanitizationViolations } from "../../lib/orvenix-ai/design-reference/sanitize"
import type { DesignReference } from "../../lib/orvenix-ai/design-reference/contract"

const DEAD_STUB_SLUGS = ["landing", "ai-dashboard", "crm", "devops", "ecommerce", "finance", "hr", "project-manager"]

test("1) discovers exactly the 25 strong app/webs references", () => {
  const references = discoverDesignReferences()
  assert.equal(references.length, 25)
})

test("2) excludes the 8 redirect-only dead stubs", () => {
  const references = discoverDesignReferences()
  const ids = references.map((r) => r.id)
  for (const stub of DEAD_STUB_SLUGS) {
    assert.equal(ids.includes(`webs:${stub}`), false, `${stub} should not be a reference`)
  }
})

test("3) reference IDs are stable, deterministic, and namespaced", () => {
  const candidates = discoverWebsCandidates()
  const clinica = candidates.find((c) => c.slug === "clinica")
  assert.ok(clinica)
  const references = discoverDesignReferences()
  assert.ok(references.some((r) => r.id === "webs:clinica"))
  for (const r of references) {
    assert.match(r.id, /^webs:[a-z0-9-]+$/)
  }
})

test("4) repeated extraction returns identical normalized records (determinism)", () => {
  const first = discoverDesignReferences()
  const second = discoverDesignReferences()
  assert.deepEqual(first, second)
})

test("5) clinica is classified as a valid reference", () => {
  const clinica = getDesignReferenceById("webs:clinica")
  assert.ok(clinica)
  assert.equal(clinica!.identity.businessAffinity, "health")
  assert.notEqual(clinica!.sectionGrammar.roleSequence.length, 0)
})

test("6) restaurante is classified as a valid reference", () => {
  const restaurante = getDesignReferenceById("webs:restaurante")
  assert.ok(restaurante)
  assert.equal(restaurante!.identity.businessAffinity, "food-hospitality")
})

test("7) vistamoda is classified as a valid reference", () => {
  const vistamoda = getDesignReferenceById("webs:vistamoda")
  assert.ok(vistamoda)
  assert.equal(vistamoda!.identity.businessAffinity, "retail-commerce")
  assert.equal(vistamoda!.distinctiveTraits.includes("cart-flow"), true)
})

test("8) launchpro remains distinguishable as the SaaS/pricing outlier", () => {
  const launchpro = getDesignReferenceById("webs:launchpro")
  assert.ok(launchpro)
  assert.equal(launchpro!.identity.businessAffinity, "saas")
  assert.equal(launchpro!.identity.visualFamily, "saas-conversion")
  assert.equal(launchpro!.sectionGrammar.roleSequence.includes("pricing"), true)
})

test("8b) launchpro roleSequence is scoped to its own home page: no duplicates, no cross-page leakage", () => {
  const launchpro = getDesignReferenceById("webs:launchpro")!
  const seq = launchpro.sectionGrammar.roleSequence

  // The real launchpro home page (page.tsx) renders exactly one of each:
  // Hero, Features, Pricing, Testimonials, FAQ, CTA -- plus footer from
  // its layout. Its separate /precios and /contacto route files are
  // NEVER read for role-sequence purposes, and a nested "Social proof"
  // comment inside the hero's own body must not appear as a phantom
  // extra "testimonials" entry.
  assert.deepEqual(seq, ["hero", "features", "pricing", "testimonials", "faq", "cta", "footer"])

  const counts = new Map<string, number>()
  for (const role of seq) counts.set(role, (counts.get(role) ?? 0) + 1)
  for (const [role, count] of counts) {
    assert.ok(count <= 1, `webs:launchpro role "${role}" appeared ${count} times; expected at most once`)
  }
})

test("8c) launchpro theme mode remains 'unknown' rather than a guess (custom gradient class, no literal dark/light token)", () => {
  const launchpro = getDesignReferenceById("webs:launchpro")!
  assert.equal(launchpro.themeGrammar.mode, "unknown")
})

test("a comment nested INSIDE one section's body is never mistaken for a separate section (generic, not launchpro-specific)", () => {
  const root = mkdtempSync(join(tmpdir(), "design-reference-nested-comment-"))
  const dirPath = join(root, "fake-nested")
  mkdirSync(dirPath)
  const pageContent = `
export default function FakePage() {
  return (
    <div>
      {/* Hero */}
      <section className="min-h-screen">
        <h1>Headline</h1>
        {/* Testimonials preview */}
        <div className="grid grid-cols-3">
          <p>quote one</p>
        </div>
      </section>
      {/* Services */}
      <section id="servicios" className="py-24">
        <p>real services content</p>
      </section>
    </div>
  )
}
`
  writeFileSync(join(dirPath, "page.tsx"), pageContent, "utf8")
  try {
    const reference = extractDesignReference({ slug: "fake-nested", dirPath })
    // "Testimonials preview" is nested INSIDE the hero <section>, not its
    // own <section> tag -- it must never surface as its own sequence
    // entry, even though it would classify as "testimonials" if seen.
    assert.deepEqual(reference.sectionGrammar.roleSequence, ["hero", "services"])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("genuinely repeated adjacent roles in one real reference are preserved, not collapsed (tienda: colecciones + productos both -> products)", () => {
  const tienda = getDesignReferenceById("webs:tienda")!
  const seq = tienda.sectionGrammar.roleSequence
  const productsCount = seq.filter((role) => role === "products").length
  assert.equal(productsCount, 2, "tienda genuinely has two distinct product-ish sections back to back and both must survive")
})

test("9) photography vs abstract hero signals can differ across references", () => {
  const clinica = getDesignReferenceById("webs:clinica")!
  const vistamoda = getDesignReferenceById("webs:vistamoda")!
  assert.equal(clinica.heroGrammar.mediaStrategy, "none")
  assert.equal(vistamoda.heroGrammar.mediaStrategy, "photography")
  assert.notEqual(clinica.heroGrammar.backgroundTreatment, vistamoda.heroGrammar.backgroundTreatment)
})

test("10) multi-page vs long-scroll single-page distinction is preserved", () => {
  const clinica = getDesignReferenceById("webs:clinica")!
  const academia = getDesignReferenceById("webs:academia")!
  assert.equal(clinica.pageGrammar.multiPage, true)
  assert.equal(academia.pageGrammar.multiPage, false)
  assert.equal(academia.pageGrammar.pageCountBucket, "single-page")
})

test("11) page grammar (purposes/count) is extracted for a multi-page reference", () => {
  const clinica = getDesignReferenceById("webs:clinica")!
  assert.ok(clinica.pageGrammar.pageCount >= 5)
  assert.ok(clinica.pageGrammar.pagePurposes.includes("home"))
  assert.ok(clinica.pageGrammar.pagePurposes.includes("contact"))
})

test("12/13) no literal image URLs or any http(s) URLs survive in ANY real reference", () => {
  const references = getDesignReferences()
  assert.ok(references.length > 0)
  for (const reference of references) {
    const violations = findSanitizationViolations(reference)
    assert.deepEqual(violations, [], `${reference.id} leaked: ${JSON.stringify(violations)}`)
    const serialized = JSON.stringify(reference)
    assert.equal(/https?:\/\//i.test(serialized), false, `${reference.id} contains a URL`)
    assert.equal(/unsplash/i.test(serialized), false, `${reference.id} mentions unsplash literally`)
  }
})

test("16) reference records never contain raw JSX/source tokens", () => {
  const references = getDesignReferences()
  for (const reference of references) {
    const serialized = JSON.stringify(reference)
    assert.equal(/<section|<div|className=|useState\(/.test(serialized), false, `${reference.id} leaked raw source`)
  }
})

test("resetDesignReferenceCacheForTests() forces recomputation without changing results", () => {
  const before = getDesignReferences()
  resetDesignReferenceCacheForTests()
  const after = getDesignReferences()
  assert.deepEqual(before, after)
})

test("defaultWebsRoot() resolves to the real app/webs directory", () => {
  assert.match(defaultWebsRoot().split("\\").join("/"), /\/app\/webs$/)
})

test("every discovered reference is a plausible DesignReference shape", () => {
  const references = getDesignReferences()
  for (const reference of references as DesignReference[]) {
    assert.equal(reference.version, 1)
    assert.equal(reference.identity.source, "webs")
    assert.equal(reference.extraction.extractorVersion, 1)
  }
})
