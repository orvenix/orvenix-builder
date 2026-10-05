import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import {
  COMMERCIAL_COLLECTIONS,
  ORVENIX_AI_COMING_SOON_LABEL,
  PENDING_DESIGN_STORAGE_KEY,
  isOrvenixAiFeatureLabel,
  listCommercialCatalog,
  parseDesignStartTarget,
  parsePendingDesign,
  serializePendingDesign,
} from "../../lib/commercial/sales-funnel"
import { REAL_TEMPLATES } from "../../lib/realTemplates"
import { getCommercialDesignV1 } from "../../lib/orvenix-ai/commercial-designs"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")

/* ------------------------------ commercial vocabulary ------------------------------ */

test("SALES-1 catalog: the sellable designs are exactly the catalog entries with a registered CommercialDesign", () => {
  const catalog = listCommercialCatalog()
  assert.deepEqual(catalog.map((entry) => entry.id).sort(), ["clinica", "construction", "contabilidad", "hotel", "servicios-locales"])
  for (const entry of catalog) {
    const template = REAL_TEMPLATES.find((item) => item.id === entry.id)!
    assert.ok(getCommercialDesignV1(template.commercialDesignId, template.commercialDesignVersion), entry.id)
    assert.equal(entry.startHref, `/templates/${entry.id}/comenzar`)
    assert.ok(entry.collection, `${entry.id} belongs to a collection`)
  }
})

test("SALES-1 collections are design collections, never billing plans", () => {
  assert.deepEqual(COMMERCIAL_COLLECTIONS.map((collection) => collection.id), ["Express", "Profesional", "Signature"])
  for (const collection of COMMERCIAL_COLLECTIONS) assert.ok(listCommercialCatalog().some((entry) => entry.collection === collection.id), collection.id)
  const source = read("lib/commercial/sales-funnel.ts")
  const imports = source.split("\n").filter((line) => line.startsWith("import "))
  assert.ok(imports.length > 0)
  for (const line of imports) assert.doesNotMatch(line, /plan-entitlements|plan-guard|billing|stripe|mercadopago|orvenix-official-2026/i, line)
  assert.doesNotMatch(read("lib/billing/plan-entitlements.ts"), /Express|Signature|commercialCollection/)
})

test("SALES-1 continue-with-design targets are only sellable design start pages (no open redirect)", () => {
  assert.deepEqual(parseDesignStartTarget("/templates/servicios-locales/comenzar"), { templateId: "servicios-locales", name: "Servicios Locales Pro", href: "/templates/servicios-locales/comenzar" })
  for (const bad of ["https://evil.example/templates/hotel/comenzar", "//evil.example", "/templates/arquitectura/comenzar", "/templates/hotel/comenzar?x=1", "/dashboard", "/templates/../admin/comenzar", "", null]) {
    assert.equal(parseDesignStartTarget(bad), null, String(bad))
  }
  const now = 1_000_000_000_000
  const raw = serializePendingDesign({ templateId: "hotel", href: "/templates/hotel/comenzar" }, now)
  assert.equal(parsePendingDesign(raw, now + 1000)?.href, "/templates/hotel/comenzar")
  assert.equal(parsePendingDesign(raw, now + 1000 * 60 * 60 * 24 * 8), null, "stale intents expire")
  assert.equal(parsePendingDesign(JSON.stringify({ href: "https://evil.example", savedAt: now }), now), null)
  assert.equal(parsePendingDesign("not json", now), null)
  assert.equal(PENDING_DESIGN_STORAGE_KEY, "orvenix:pending-design")
})

test("SALES-1 IA labels are recognized so customer surfaces can mark them as coming soon", () => {
  for (const label of ["Orvenix AI para copy, optimizacion, traduccion y analisis", "IA personalizada o API dedicada", "Integra inteligencia artificial"]) assert.equal(isOrvenixAiFeatureLabel(label), true, label)
  for (const label of ["Hosting incluido", "E-commerce integrado", "Exportacion de codigo limpio", "Varios sitios"]) assert.equal(isOrvenixAiFeatureLabel(label), false, label)
  assert.equal(ORVENIX_AI_COMING_SOON_LABEL, "Orvenix IA — Próximamente")
})

/* ------------------------------ landing & navigation ------------------------------ */

test("SALES-1 landing leads to Diseños Orvenix first and presents IA as coming soon", () => {
  const hero = read("components/marketing/home/Hero.tsx")
  assert.match(hero, /<Link href="\/templates" className="mk-btn-primary home-hero-cta-primary">\s*Ver Diseños Orvenix/)
  assert.match(hero, /<Link href="\/precios" className="mk-btn-outline home-hero-cta-secondary">\s*Ver planes/)
  assert.match(hero, /Orvenix IA — Próximamente/)
  assert.doesNotMatch(hero, /Super Builder \+ IA|href="\/webs"/)
  const home = read("app/page.tsx")
  assert.match(home, /buttonHref="\/templates"/)
  assert.match(home, /¿Qué son Express, Profesional y Signature\?/)
  assert.match(home, /Son colecciones de Diseños Orvenix, no planes/)
  assert.match(read("components/marketing/home/OrvenixBuilderShowcase.tsx"), /label="Orvenix IA" value="Próximamente"/)
  assert.doesNotMatch(read("components/marketing/home/Cotizador.tsx"), /usar IA/)
})

test("SALES-1 navigation points visitors at the sellable catalog", () => {
  const navbar = read("components/marketing/Navbar.tsx")
  assert.match(navbar, /\{ href: '\/templates', label: 'Diseños' \}/)
  assert.doesNotMatch(navbar, /\{ href: '\/webs'/)
  assert.match(read("components/marketing/Footer.tsx"), /<Link href="\/templates">Diseños Orvenix<\/Link>/)
})

/* ------------------------------ catalog, pricing, dashboard ------------------------------ */

test("SALES-1 /templates explains the three collections as design styles, not plans", () => {
  const page = read("app/templates/page.tsx")
  assert.match(page, /Tres colecciones de Diseños Orvenix/)
  assert.match(page, /Las colecciones describen el estilo del diseño, no tu plan/)
  assert.match(page, /COMMERCIAL_COLLECTIONS\.map/)
  assert.doesNotMatch(page, /Ver demos en vivo/)
})

test("SALES-1 /precios keeps the chosen design in view and offers only sellable designs", () => {
  const page = read("app/precios/page.tsx")
  assert.match(page, /parseDesignStartTarget\(firstSearchValue\(rawSearchParams\?\.callbackUrl\)\)/)
  assert.match(page, /\{designTarget && <DesignIntentNotice target=\{designTarget\} \/>\}/)
  assert.match(page, /listCommercialCatalog\(\)/)
  assert.doesNotMatch(page, /REAL_TEMPLATES\.slice\(0, 6\)/)
  assert.match(page, /href=\{entry\.startHref\}/)
  assert.match(page, /isOrvenixAiFeatureLabel\(feature\) \? `\$\{feature\} \(próximamente\)` : feature/)
  // Prices and checkout are untouched by SALES-1.
  assert.match(page, /getPricingPlans\(\)/)
  const notice = read("app/precios/DesignIntentNotice.tsx")
  assert.match(notice, /localStorage\.setItem\(PENDING_DESIGN_STORAGE_KEY, serializePendingDesign\(target\)\)/)
  const pricing = read("components/marketing/home/PricingSection.tsx")
  assert.match(pricing, /isOrvenixAiFeatureLabel\(f\.label\) && \(/)
  assert.doesNotMatch(pricing, /usar IA/)
  assert.match(pricing, /'\/api\/billing\/subscribe'|\/api\/billing\/subscribe/)
})

test("SALES-1 dashboard: Diseños Orvenix first, IA coming soon for customers, chosen design resumed after checkout", () => {
  const dashboard = read("app/dashboard/page.impl.tsx")
  assert.match(dashboard, /<span className="relative z-10">Elegir un Diseño Orvenix<\/span>/)
  assert.match(dashboard, /\{isAdmin \? \(\s*<CreateSiteWithAI/)
  assert.match(dashboard, /Orvenix IA — Próximamente/)
  assert.match(dashboard, /<PendingDesignBanner \/>/)
  assert.doesNotMatch(dashboard, /href="\/webs"/)
  assert.doesNotMatch(dashboard, /comprar o rentar/)
  const banner = read("app/dashboard/PendingDesignBanner.tsx")
  assert.match(banner, /useSyncExternalStore\(subscribe, readRaw, \(\) => null\)/)
  assert.match(banner, /parsePendingDesign\(raw\)/)
  // Reaching the design's start form fulfills the intent.
  assert.match(read("app/templates/[id]/comenzar/CommercialStartForm.tsx"), /localStorage\.removeItem\(PENDING_DESIGN_STORAGE_KEY\)/)
  // IA infrastructure is kept, not deleted.
  assert.match(dashboard, /import \{ CreateSiteWithAI \} from "\.\/CreateSiteWithAI"/)
})

test("SALES-1 design detail states the pages the customer receives, from the registered recipe", () => {
  const page = read("app/templates/[id]/page.tsx")
  assert.match(page, /getCommercialDesignV1\(template\.commercialDesignId, template\.commercialDesignVersion\)\?\.pages\.map\(\(page\) => page\.name\)/)
  assert.match(page, /Incluye \{designPages\.length\} páginas:/)
})
