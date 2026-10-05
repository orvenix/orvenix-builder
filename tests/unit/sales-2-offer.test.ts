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
  officialBuyout2026,
  officialCompanyIntro,
  officialContractClauses2026,
  officialPlanComparison2026,
  officialPlans2026,
  officialUpdatePolicy2026,
} from "../../lib/orvenix-official-2026"
import { PLAN_ENTITLEMENTS } from "../../lib/billing/plan-entitlements"
import { isOrvenixAiFeatureLabel } from "../../lib/commercial/sales-funnel"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")

const EXPORT_AS_PLAN_RIGHT = /export\w* de c[oó]digo|c[oó]digo limpio|exportaci[oó]n,? y varios/i

/* ------------------------------ prices and limits do not move ------------------------------ */

test("SALES-2: official prices and plan limits are unchanged", () => {
  const byId = Object.fromEntries(officialPlans2026.map((plan) => [plan.id, plan]))
  assert.deepEqual([byId.starter.monthlyUsd, byId.pro.monthlyUsd, byId.business.monthlyUsd, byId.enterprise.monthlyUsd], [15, 39, 79, null])
  assert.deepEqual([byId.starter.annualUsd, byId.pro.annualUsd, byId.business.annualUsd], [150, 390, 790])
  assert.deepEqual([byId.starter.maxWebsites, byId.pro.maxWebsites], [1, 10])
  assert.equal(PLAN_ENTITLEMENTS.starter.limits.pagesPerWebsite, 5)
  assert.equal(PLAN_ENTITLEMENTS.pro.limits.pagesPerWebsite, null)
})

/* ------------------------------ renting is not buying ------------------------------ */

test("SALES-2: no plan presents full code export as a right of renting", () => {
  for (const plan of officialPlans2026) {
    for (const line of [...plan.features, ...plan.limitations, plan.audience]) assert.doesNotMatch(line, EXPORT_AS_PLAN_RIGHT, `${plan.id}: ${line}`)
  }
  const exportRow = officialPlanComparison2026.find(([feature]) => /c[oó]digo/i.test(feature))!
  assert.deepEqual(exportRow, ["Entrega del codigo del sitio", "Con compra del sitio", "Con compra del sitio", "Con compra del sitio", "Con compra del sitio"])
})

test("SALES-2: the technical export capability is kept as-is for existing customers (separate from the offer)", () => {
  // Presentation changed; the entitlement did not. Retiring it is a product decision, not a silent change.
  assert.equal(PLAN_ENTITLEMENTS.starter.features.exportCode, false)
  for (const id of ["pro", "business", "enterprise"] as const) assert.equal(PLAN_ENTITLEMENTS[id].features.exportCode, true, id)
  assert.match(read("app/api/editor/[id]/export/route.ts"), /await requireExportPlan\(session\.user\.id\)/)
})

test("SALES-2: public plan cards, quoter and pricing copy no longer list code export for a plan", () => {
  const pricingSection = read("components/marketing/home/PricingSection.tsx")
  assert.doesNotMatch(pricingSection, /Exportacion de codigo limpio/)
  assert.doesNotMatch(read("components/marketing/home/Cotizador.tsx"), EXPORT_AS_PLAN_RIGHT)
  const precios = read("app/precios/page.tsx")
  assert.match(precios, /¿Mi plan incluye el codigo de mi sitio\?/)
  assert.match(precios, /La entrega del codigo y los archivos de tu sitio es parte de la Compra del sitio/)
  // The chatbot knowledge is generated from its seed (npm run chatbot:refresh): both must agree.
  for (const file of ["docs/chatbot-knowledge.md", "docs/chatbot-knowledge.seed.json"]) {
    const knowledge = read(file)
    assert.doesNotMatch(knowledge, /"Exportacion de codigo"|- Exportacion de codigo/, file)
    assert.match(knowledge, /Los planes son una renta del servicio/, file)
  }
  assert.doesNotMatch(read("lib/constructorPresets.ts"), /SEO y exportacion/)
})

/* ------------------------------ buying the site ------------------------------ */

test("SALES-2: buying covers the site's specific deliverable, never Orvenix, its tools or the base designs", () => {
  const rights = officialBuyout2026.rights.join(" ")
  assert.equal(officialBuyout2026.title, "Compra del sitio")
  assert.match(rights, /entregable especifico del sitio del cliente/)
  assert.match(rights, /plataforma Orvenix, el editor, el catalogo, los componentes reutilizables y los Diseños Orvenix base no se transfieren/)
  assert.match(rights, /no son exclusivos/)
  assert.doesNotMatch(rights, /patrimoniales perpetuos|universales e irrevocables|puede modificar, revender, duplicar o licenciar/)

  const ip = officialContractClauses2026.find((clause) => clause.title === "Propiedad intelectual y contenidos")!
  assert.doesNotMatch(ip.body, /Salvo compra definitiva/)
  assert.match(ip.body, /tambien despues de una compra del sitio/)
})

test("SALES-2: customer-facing purchase copy keeps the existing 'desde 799 USD / cotización' offer without promising the platform", () => {
  const precios = read("app/precios/page.tsx")
  assert.match(precios, /title: "Compra del sitio",\s*subtitle: "Desde 799 USD",\s*badge: "Por cotizacion"/)
  assert.doesNotMatch(precios, /Compra definitiva|derechos patrimoniales|propiedad del proyecto/)
  for (const file of ["app/page.tsx", "components/marketing/home/Cotizador.tsx", "app/legal/dossier-2026/page.tsx", "lib/checkout.ts", "docs/chatbot-knowledge.md"]) {
    assert.doesNotMatch(read(file), /Salvo compra definitiva|compra definitiva|propiedad total/i, file)
  }
  assert.match(read("app/legal/terminos/page.tsx"), /En ningún caso se transfieren la plataforma Orvenix, el editor, el catálogo, los componentes reutilizables ni los Diseños Orvenix base/)
})

/* ------------------------------ Orvenix IA ------------------------------ */

test("SALES-2: IA is never offered as available -- only as 'Orvenix IA — Próximamente'", () => {
  for (const plan of officialPlans2026) {
    for (const line of [...plan.features, plan.audience]) {
      if (isOrvenixAiFeatureLabel(line)) assert.equal(line, "Orvenix IA — Próximamente", `${plan.id}: ${line}`)
    }
    for (const line of plan.limitations) assert.equal(isOrvenixAiFeatureLabel(line), false, `${plan.id}: ${line}`)
  }
  assert.deepEqual(officialPlanComparison2026.find(([feature]) => isOrvenixAiFeatureLabel(feature)), ["Orvenix IA", "Próximamente", "Próximamente", "Próximamente", "Próximamente"])
  assert.match(officialCompanyIntro.whatIs.join(" "), /Orvenix IA llegara proximamente/)

  for (const file of ["app/plataforma/page.tsx", "app/api/chat/route.ts", "docs/chatbot-knowledge.md", "docs/chatbot-knowledge.seed.json", "lib/constructorPresets.ts"]) {
    assert.doesNotMatch(read(file), /usar IA|\bIA, CRM|IA personalizada/, file)
  }
  const pricingSection = read("components/marketing/home/PricingSection.tsx")
  assert.match(pricingSection, /\? \{ included: false, comingSoon: true, label: 'Orvenix IA' \}/)
  assert.match(pricingSection, /\{f\.comingSoon && \(/)
})

/* ------------------------------ decision 1 in the official copy ------------------------------ */

test("SALES-2: Starter copy says Orvenix designs arrive complete and the limit applies to additional pages", () => {
  const starter = officialPlans2026.find((plan) => plan.id === "starter")!
  assert.ok(starter.features.includes("Hasta 5 paginas o secciones (los Diseños Orvenix se entregan completos)"))
  assert.ok(officialUpdatePolicy2026.requiredUpgrades.some((line) => /por encima de su limite de 5; las paginas del Diseño Orvenix inicial se entregan completas/.test(line)))
  assert.ok(!officialUpdatePolicy2026.requiredUpgrades.some((line) => /sexta pagina/.test(line)))
})
