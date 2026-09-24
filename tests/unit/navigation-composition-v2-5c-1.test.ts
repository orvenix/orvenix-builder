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

/**
 * V2-5C.1: Navigation & Header Composition Intelligence -- composer-
 * level execution tests. Proves each bounded navigation field actually
 * produces a STRUCTURAL difference in the composed siteNav node's
 * props (never just enum selection), preserves canonical routes, and
 * safely falls back to pre-V2-5C.1 behavior when absent.
 */

type NavProps = {
  chrome?: string
  surface?: string
  surfaceStyle?: string
  variant?: string
  showCta?: boolean
  pages?: Array<{ slug: string; href: string }>
  labelOverrides?: string
}

function navProps(section: { rootId: string; nodes: Record<string, { props?: Record<string, unknown> }> } | null): NavProps {
  return (section!.nodes[section!.rootId].props ?? {}) as NavProps
}

const SITE_PAGES = [
  { name: "Inicio", slug: "home", isHome: true },
  { name: "Servicios", slug: "servicios" },
  { name: "Contacto", slug: "contacto" },
]

// ---------------------------------------------------------------------------
// M1) Baseline/default navigation -- byte-identical to pre-V2-5C.1
// ---------------------------------------------------------------------------

test("1) baseline navigation (no richComposition, no CD) is byte-identical to the pre-V2-5C.1 default", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("navigation", { sitePages: SITE_PAGES })
  const props = navProps(section)
  // surface/chrome/surfaceStyle below come from the siteNav block's OWN
  // pre-existing capability defaults (merged by createComposedNode,
  // unrelated to V2-5C.1 richness) -- surfaceStyle:"glass" is what
  // SiteNav.defaults already listed explicitly (added for consistency
  // with the neighboring surface/chrome defaults; behaviorally identical
  // to SiteNav's own "glass" function-param default either way).
  assert.deepEqual(props, {
    title: "Nombre del negocio",
    subtitle: "Sitio profesional",
    labelOverrides: "home=Inicio\nservicios=Servicios\ncontacto=Contacto",
    pages: [
      { label: "Inicio", name: "Inicio", slug: "home", href: "page:home", isHome: true },
      { label: "Servicios", name: "Servicios", slug: "servicios", href: "page:servicios", isHome: false },
      { label: "Contacto", name: "Contacto", slug: "contacto", href: "page:contacto", isHome: false },
    ],
    showHome: true,
    showCta: true,
    ctaLabel: "Contactar",
    ctaHref: "#contacto",
    layout: "row",
    justify: "center",
    variant: "minimal",
    surface: "light",
    chrome: "floating",
    surfaceStyle: "glass",
  } as unknown as NavProps)
})

test("richComposition=true alone (from an unrelated hero decision, no navigation decision) leaves navigation UNCHANGED (Phase K)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const withoutRich = navProps(composeSection("navigation", { sitePages: SITE_PAGES }))
  const withRichButNoNavDecision = navProps(
    composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredHeroTreatment: "abstract-glow" }),
  )
  assert.deepEqual(withoutRich, withRichButNoNavDecision)
})

// ---------------------------------------------------------------------------
// M2) At least 3 materially different rich treatments
// ---------------------------------------------------------------------------

test("2) surfaceStyle=solid reaches the composer and structurally differs from the glass default", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const glass = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationSurfaceStyle: "glass" }))
  const solid = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationSurfaceStyle: "solid" }))
  assert.equal(solid.surfaceStyle, "solid")
  assert.notEqual(solid.surfaceStyle, glass.surfaceStyle)
})

test("2) linkStyle=pill reaches the composer and structurally differs from the minimal default", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const pill = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationLinkStyle: "pill" }))
  const minimal = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationLinkStyle: "minimal" }))
  assert.equal(pill.variant, "pill")
  assert.equal(minimal.variant, "minimal")
  assert.notEqual(pill.variant, minimal.variant)
})

test("2) containment=floating reaches the composer and structurally differs from integrated", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const floating = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationContainment: "floating" }))
  const integrated = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationContainment: "integrated" }))
  assert.equal(floating.chrome, "floating")
  assert.equal(integrated.chrome, "integrated")
  assert.notEqual(floating.chrome, integrated.chrome)
})

// ---------------------------------------------------------------------------
// M3) CTA emphasis difference
// ---------------------------------------------------------------------------

test("3) navigationCtaEmphasis=none removes the CTA button; prominent (default) keeps it", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const none = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationCtaEmphasis: "none" }))
  const prominent = navProps(composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationCtaEmphasis: "prominent" }))
  assert.equal(none.showCta, false)
  assert.equal(prominent.showCta, true)
})

// ---------------------------------------------------------------------------
// M4) Contained/floating vs full-width difference (covered above, test 2) --
// M5) transparent/overlay relationship: glass surfaceStyle IS the overlay-
// like translucent treatment; this is exercised via the contrast tests below.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// M6) Dark/light contrast safeguards (Phase F)
// ---------------------------------------------------------------------------

test("6) a dark hero (abstract-glow treatment) resolves navigation surface to dark -- deterministically, never AI-direct", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("navigation", {
    sitePages: SITE_PAGES,
    richComposition: true,
    aiPreferredNavigationSurfaceStyle: "glass",
    aiPreferredHeroTreatment: "abstract-glow",
  })
  assert.equal(navProps(section).surface, "dark")
})

test("6) an immersive hero variant also resolves navigation surface to dark", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("navigation", {
    sitePages: SITE_PAGES,
    richComposition: true,
    aiPreferredNavigationSurfaceStyle: "glass",
    aiPreferredHeroVariant: "immersive",
  })
  assert.equal(navProps(section).surface, "dark")
})

test("6) a standard/light hero resolves navigation surface to light -- never leaves light text on a light hero", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("navigation", {
    sitePages: SITE_PAGES,
    richComposition: true,
    aiPreferredNavigationSurfaceStyle: "glass",
    aiPreferredHeroTreatment: "standard",
    aiPreferredHeroVariant: "centered",
  })
  assert.equal(navProps(section).surface, "light")
})

test("6) the AI cannot set surface/dark-or-light directly -- SectionCompositionContext has no field for it, only hero signals the composer already reads", async () => {
  // Structural proof: aiPreferredNavigationSurfaceStyle only accepts "glass"|"solid" (a STYLE), never "dark"|"light" (a COLOR PAIRING).
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("navigation", {
    sitePages: SITE_PAGES,
    richComposition: true,
    // @ts-expect-error -- deliberately an invalid style value to prove the defensive re-check drops it safely
    aiPreferredNavigationSurfaceStyle: "dark",
  })
  assert.notEqual(navProps(section).surfaceStyle, "dark") // never silently accepted as a surfaceStyle
})

// ---------------------------------------------------------------------------
// M7) Mobile shell remains valid -- no new client-side navigation system.
// The renderer (SiteNav.tsx) has no viewport-conditional markup at all
// (confirmed by audit: relies on flex-wrap reflow only); this test proves
// the COMPOSER never introduces any new props that would require one --
// only props the existing, already-shipped SiteNav.tsx already handles.
// ---------------------------------------------------------------------------

test("7) every prop the composer can set on a rich navigation node is one SiteNav.tsx's existing SiteNavProps already declares", async () => {
  const fs = await import("node:fs")
  const siteNavSource = fs.readFileSync(path.join(process.cwd(), "components/editor/primitives/SiteNav.tsx"), "utf8")
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("navigation", {
    sitePages: SITE_PAGES,
    richComposition: true,
    aiPreferredNavigationSurfaceStyle: "solid",
    aiPreferredNavigationContainment: "floating",
    aiPreferredNavigationLinkStyle: "pill",
    aiPreferredNavigationCtaEmphasis: "none",
    aiPreferredHeroTreatment: "abstract-glow",
  })
  const props = navProps(section)
  for (const key of Object.keys(props)) {
    assert.ok(siteNavSource.includes(`${key}?:` ) || siteNavSource.includes(`${key}:`), `SiteNavProps must declare "${key}"`)
  }
})

// ---------------------------------------------------------------------------
// M8) Canonical links unchanged across every treatment; M9) no fabricated routes
// ---------------------------------------------------------------------------

test("8/9) canonical page links are IDENTICAL across every navigation treatment -- visual intelligence never touches routes", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const baseline = navProps(composeSection("navigation", { sitePages: SITE_PAGES })).pages
  const richA = navProps(
    composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationSurfaceStyle: "solid", aiPreferredNavigationContainment: "floating" }),
  ).pages
  const richB = navProps(
    composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredNavigationLinkStyle: "pill", aiPreferredNavigationCtaEmphasis: "none" }),
  ).pages
  assert.deepEqual(baseline, richA)
  assert.deepEqual(baseline, richB)
  // Every page/href is one of the REAL supplied sitePages -- never invented.
  const realSlugs = new Set(SITE_PAGES.map((p) => p.slug))
  for (const page of baseline ?? []) {
    assert.ok(realSlugs.has(page.slug))
    assert.equal(page.href, `page:${page.slug}`)
  }
})

// ---------------------------------------------------------------------------
// M10) Fallback byte/structural compatibility where expected
// ---------------------------------------------------------------------------

test("10) an invalid navigation override value falls back to the pre-V2-5C.1 default, never a raw/unknown value", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const section = composeSection("navigation", {
    sitePages: SITE_PAGES,
    richComposition: true,
    // @ts-expect-error -- deliberately invalid for the test
    aiPreferredNavigationLinkStyle: "neon-outline",
  })
  assert.equal(navProps(section).variant, "minimal") // falls back, never "neon-outline"
})

test("10) no navigation decision anywhere on the CreativeDirection (only hero/process fields) reproduces the exact pre-V2-5C.1 output", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const baseline = navProps(composeSection("navigation", { sitePages: SITE_PAGES }))
  const withUnrelatedRichComposition = navProps(
    composeSection("navigation", { sitePages: SITE_PAGES, richComposition: true, aiPreferredProcessTreatment: "numbered", aiSectionToneStrategy: "contrast-led" }),
  )
  assert.deepEqual(baseline, withUnrelatedRichComposition)
})
