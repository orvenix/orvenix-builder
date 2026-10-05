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
