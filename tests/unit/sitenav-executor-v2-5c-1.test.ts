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
 * V2-5C.1 bounded refinement: executor-quality tests for SiteNav.tsx --
 * real brand identity, real mobile navigation, theme-derived (not AI-
 * derived, not hardcoded-blue) accent colors. Two testing techniques,
 * matched to what's actually verifiable in this repo's test
 * infrastructure (no jsdom/React Testing Library configured):
 *   - pure derivation functions (deriveBrandInitials, readableTextOn):
 *     direct unit tests on real inputs/outputs.
 *   - renderer structural/accessibility wiring (mobile trigger, aria-*,
 *     panel, useState): source-text assertions against SiteNav.tsx,
 *     the SAME precedented technique tests/unit/editor-save-before-
 *     navigation.test.ts already uses for this exact file.
 */

const SITE_NAV_SOURCE = fs.readFileSync(path.join(process.cwd(), "components/editor/primitives/SiteNav.tsx"), "utf8")

// ---------------------------------------------------------------------------
// A) Brand identity
// ---------------------------------------------------------------------------

test("A) deriveBrandInitials: real multi-word business name -> first-letter-of-first-two-words monogram", async () => {
  const { deriveBrandInitials } = await import("../../components/editor/primitives/SiteNav")
  assert.equal(deriveBrandInitials("Centro Movimiento Norte"), "CM")
})

test("A) deriveBrandInitials: does not overfit to one business -- proven across several real, unrelated names", async () => {
  const { deriveBrandInitials } = await import("../../components/editor/primitives/SiteNav")
  assert.equal(deriveBrandInitials("Restaurante Sabor de Casa"), "RS")
  assert.equal(deriveBrandInitials("Estudio Luz y Forma"), "EL")
  assert.equal(deriveBrandInitials("Tienda Vistamoda"), "TV")
  assert.equal(deriveBrandInitials("Launchpro"), "LA") // single-word real name -> first 2 chars
})

test("A) deriveBrandInitials: short (single-word) name", async () => {
  const { deriveBrandInitials } = await import("../../components/editor/primitives/SiteNav")
  assert.equal(deriveBrandInitials("Orvenix"), "OR")
  assert.equal(deriveBrandInitials("X"), "X") // 1-character word: never invents a second character
})

test("A) deriveBrandInitials: long name does not throw or overflow the return value unpredictably (bounded length)", async () => {
  const { deriveBrandInitials } = await import("../../components/editor/primitives/SiteNav")
  const long = "Centro Integral de Rehabilitacion Fisica y Terapia Deportiva Avanzada del Norte"
  const initials = deriveBrandInitials(long)
  assert.ok(initials.length <= 2)
  assert.equal(initials, "CI") // still derived from the REAL first two words, nothing invented
})

test("A) deriveBrandInitials: missing/empty name falls back to the ORIGINAL fixed value, never an invented name", async () => {
  const { deriveBrandInitials } = await import("../../components/editor/primitives/SiteNav")
  assert.equal(deriveBrandInitials(""), "OV")
  assert.equal(deriveBrandInitials("   "), "OV")
})

test("A) deriveBrandInitials: Unicode-safe -- accented first characters are preserved and uppercased, never split mid-codepoint", async () => {
  const { deriveBrandInitials } = await import("../../components/editor/primitives/SiteNav")
  assert.equal(deriveBrandInitials("Ñandú Diseño"), "ÑD")
  assert.equal(deriveBrandInitials("École Élan"), "ÉÉ")
})

test("A) composeNavigation threads the REAL business name into the siteNav node's title prop (not the fixed placeholder)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const withRealName = composeSection("navigation", { businessName: "Centro Movimiento Norte", sitePages: [{ name: "Inicio", slug: "home", isHome: true }] })
  const withoutName = composeSection("navigation", { sitePages: [{ name: "Inicio", slug: "home", isHome: true }] })
  assert.equal((withRealName!.nodes[withRealName!.rootId].props as Record<string, unknown>).title, "Centro Movimiento Norte")
  assert.equal((withoutName!.nodes[withoutName!.rootId].props as Record<string, unknown>).title, "Nombre del negocio") // unchanged existing placeholder, no invented name
})

test("A) the Creative Director cannot influence brandName/title -- no such field exists on the CD contract", async () => {
  const { validateCreativeSiteDirectionV1 } = await import("../../lib/orvenix-ai/creative-director/contract")
  const result = validateCreativeSiteDirectionV1({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    brandName: "Invented Co", // not a real field -- validateCreativeSiteDirectionV1 takes `unknown`, so this is a runtime-only check
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  })
  assert.equal(result.ok, false) // unknown key -> closed-shape rejection
})

// ---------------------------------------------------------------------------
// B) Mobile navigation -- structural/accessibility wiring
// ---------------------------------------------------------------------------

test("B) SiteNav is a client component with a bounded useState open/close (no new dependency, no new nav framework)", () => {
  assert.match(SITE_NAV_SOURCE, /^"use client";/)
  assert.match(SITE_NAV_SOURCE, /const \[mobileOpen, setMobileOpen\] = useState\(false\)/)
  assert.match(SITE_NAV_SOURCE, /const mobilePanelId = useId\(\)/)
})

test("B) mobile trigger is a real, keyboard-operable <button> (never a fake click div)", () => {
  assert.match(SITE_NAV_SOURCE, /<button\s+type="button"\s+className="orvenix-site-nav-trigger/)
  assert.doesNotMatch(SITE_NAV_SOURCE, /onClick=\{[^}]*setMobileOpen[^}]*\}[\s\S]{0,40}<div\b/)
})

test("B) mobile trigger has aria-expanded, aria-controls, and a descriptive accessible label", () => {
  assert.match(SITE_NAV_SOURCE, /aria-expanded=\{mobileOpen\}/)
  assert.match(SITE_NAV_SOURCE, /aria-controls=\{mobilePanelId\}/)
  assert.match(SITE_NAV_SOURCE, /aria-label=\{mobileOpen \? "Cerrar menú" : "Abrir menú"\}/)
})

test("B) the mobile panel element's id matches the trigger's aria-controls (same mobilePanelId identifier)", () => {
  assert.match(SITE_NAV_SOURCE, /id=\{mobilePanelId\}/)
})

test("B) the mobile panel renders real canonical links from the SAME linkDescriptors as desktop (no separate/duplicated link-resolution logic)", () => {
  // Exactly one computation of link hrefs/onClick (linkDescriptors), mapped twice.
  const computations = (SITE_NAV_SOURCE.match(/const linkDescriptors = navPages\.map/g) ?? []).length
  const renderSites = (SITE_NAV_SOURCE.match(/linkDescriptors\.map\(/g) ?? []).length
  assert.equal(computations, 1)
  assert.equal(renderSites, 2) // desktop <ul> + mobile panel <ul>
})

test("B) the mobile panel includes the CTA only when showCta is true (conditional, not unconditional)", () => {
  const mobilePanelSection = SITE_NAV_SOURCE.slice(SITE_NAV_SOURCE.indexOf("orvenix-site-nav-mobile-panel"))
  assert.match(mobilePanelSection, /\{showCta && ctaLabel \? \(/)
})

test("B) no horizontal overflow risk: brand title is truncated (overflow/ellipsis + bounded max-width) so a long name cannot push the trigger off-screen", () => {
  assert.match(SITE_NAV_SOURCE, /overflow: "hidden"/)
  assert.match(SITE_NAV_SOURCE, /textOverflow: "ellipsis"/)
  assert.match(SITE_NAV_SOURCE, /maxWidth: "min\(52vw, 320px\)"/)
})

// ---------------------------------------------------------------------------
// C) Theme-aware navigation
// ---------------------------------------------------------------------------

test("C) readableTextOn picks a contrast-safe text color for two clearly different palettes", async () => {
  const { readableTextOn, hasSafeContrast } = await import("../../lib/orvenix-ai/theme/visual-direction")
  const forDarkNavy = readableTextOn("#1e3a8a") // dark, saturated accent -- dark text on it would fail contrast
  const forPastelYellow = readableTextOn("#fde68a") // light pastel accent -- white text on it would fail contrast
  assert.equal(forDarkNavy, "#ffffff")
  assert.equal(forPastelYellow, "#0f172a")
  assert.ok(hasSafeContrast(forDarkNavy, "#1e3a8a"))
  assert.ok(hasSafeContrast(forPastelYellow, "#fde68a"))
  assert.notEqual(forDarkNavy, forPastelYellow) // output genuinely differs between the two palettes -- not a hardcoded single value
})

test("C) composeNavigation threads the real resolved theme accent (context.accentColor) into the siteNav node -- no new plumbing, same value hero/accent-soft already use", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const withAccent = composeSection("navigation", { accentColor: "#7c3aed", sitePages: [{ name: "Inicio", slug: "home", isHome: true }] })
  const withoutAccent = composeSection("navigation", { sitePages: [{ name: "Inicio", slug: "home", isHome: true }] })
  assert.equal((withAccent!.nodes[withAccent!.rootId].props as Record<string, unknown>).accent, "#7c3aed")
  assert.equal("accent" in (withoutAccent!.nodes[withoutAccent!.rootId].props as Record<string, unknown>), false)
})

test("C) two different real theme accents produce two different resolved siteNav 'accent' prop values (navigation visually belongs to the site's theme)", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const purple = composeSection("navigation", { accentColor: "#7c3aed", sitePages: [{ name: "Inicio", slug: "home", isHome: true }] })
  const teal = composeSection("navigation", { accentColor: "#0d9488", sitePages: [{ name: "Inicio", slug: "home", isHome: true }] })
  const purpleAccent = (purple!.nodes[purple!.rootId].props as Record<string, unknown>).accent
  const tealAccent = (teal!.nodes[teal!.rootId].props as Record<string, unknown>).accent
  assert.notEqual(purpleAccent, tealAccent)
})

test("C) AI cannot set a raw navigation color -- no CD field accepts a hex/CSS value for navigation (defense in depth, mirrors the reference-augmented contract test)", async () => {
  const { validateCreativeSiteDirectionV1 } = await import("../../lib/orvenix-ai/creative-director/contract")
  const result = validateCreativeSiteDirectionV1({
    version: 1,
    roleKey: "creative_director_v1",
    strategyKey: "site_narrative_v1",
    siteNarrative: "x",
    navigationAccent: "#ff00ff", // not a real field -- runtime-only check, see note above
    pageDirections: [{ slug: "home", narrativeGoal: "x" }],
  })
  assert.equal(result.ok, false) // unknown key -> closed-shape rejection; no navigationAccent/navigationColor field exists at all
})

test("C) fallback path: absent accentColor keeps the CTA/badge on the ORIGINAL fixed-blue expression (backward compatible)", () => {
  assert.match(SITE_NAV_SOURCE, /const navAccent = accent \? \{ background: accent, text: readableTextOn\(accent\) \} : null;/)
  assert.match(SITE_NAV_SOURCE, /const ctaBackground = navAccent\s*\n\s*\? navAccent\.background\s*\n\s*: surface === "dark"/)
})

// ---------------------------------------------------------------------------
// D) Treatments still materially differ after the SiteNav refinement
// (full coverage already in navigation-composition-v2-5c-1.test.ts; this
// file adds one direct cross-check that the refinement did not collapse
// any of the four axes into a no-op).
// ---------------------------------------------------------------------------

test("D) glass != solid, integrated != floating, pill != minimal, prominent != none -- still true after the SiteNav refinement", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const base = { sitePages: [{ name: "Inicio", slug: "home", isHome: true }], richComposition: true }

  const glass = composeSection("navigation", { ...base, aiPreferredNavigationSurfaceStyle: "glass" })
  const solid = composeSection("navigation", { ...base, aiPreferredNavigationSurfaceStyle: "solid" })
  assert.notEqual(
    (glass!.nodes[glass!.rootId].props as Record<string, unknown>).surfaceStyle,
    (solid!.nodes[solid!.rootId].props as Record<string, unknown>).surfaceStyle,
  )

  const integrated = composeSection("navigation", { ...base, aiPreferredNavigationContainment: "integrated" })
  const floating = composeSection("navigation", { ...base, aiPreferredNavigationContainment: "floating" })
  assert.notEqual(
    (integrated!.nodes[integrated!.rootId].props as Record<string, unknown>).chrome,
    (floating!.nodes[floating!.rootId].props as Record<string, unknown>).chrome,
  )

  const pill = composeSection("navigation", { ...base, aiPreferredNavigationLinkStyle: "pill" })
  const minimal = composeSection("navigation", { ...base, aiPreferredNavigationLinkStyle: "minimal" })
  assert.notEqual(
    (pill!.nodes[pill!.rootId].props as Record<string, unknown>).variant,
    (minimal!.nodes[minimal!.rootId].props as Record<string, unknown>).variant,
  )

  const prominent = composeSection("navigation", { ...base, aiPreferredNavigationCtaEmphasis: "prominent" })
  const none = composeSection("navigation", { ...base, aiPreferredNavigationCtaEmphasis: "none" })
  assert.notEqual(
    (prominent!.nodes[prominent!.rootId].props as Record<string, unknown>).showCta,
    (none!.nodes[none!.rootId].props as Record<string, unknown>).showCta,
  )
})

// ---------------------------------------------------------------------------
// E) Canonical routes remain byte-identical across every visual treatment,
// including the new brand/accent refinements.
// ---------------------------------------------------------------------------

test("E) canonical links stay byte-identical across brand name, accent color, and every treatment combination -- FABRICATED_ROUTES=0", async () => {
  const { composeSection } = await import("../../lib/orvenix-ai/composer")
  const sitePages = [
    { name: "Inicio", slug: "home", isHome: true },
    { name: "Servicios", slug: "servicios" },
    { name: "Contacto", slug: "contacto" },
  ]
  const baseline = composeSection("navigation", { sitePages })
  const withEverything = composeSection("navigation", {
    sitePages,
    businessName: "Centro Movimiento Norte",
    accentColor: "#7c3aed",
    richComposition: true,
    aiPreferredNavigationSurfaceStyle: "solid",
    aiPreferredNavigationContainment: "floating",
    aiPreferredNavigationLinkStyle: "pill",
    aiPreferredNavigationCtaEmphasis: "none",
  })
  const baselinePages = (baseline!.nodes[baseline!.rootId].props as Record<string, unknown>).pages
  const richPages = (withEverything!.nodes[withEverything!.rootId].props as Record<string, unknown>).pages
  assert.deepEqual(baselinePages, richPages)
  const realSlugs = new Set(sitePages.map((p) => p.slug))
  for (const page of baselinePages as Array<{ slug: string; href: string }>) {
    assert.ok(realSlugs.has(page.slug))
    assert.equal(page.href, `page:${page.slug}`)
  }
})
