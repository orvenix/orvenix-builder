import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import { getCommercialTemplateStart } from "../../lib/commercial/template-start"
import {
  COMMERCIAL_DESIGN_REGISTRY_V1,
  compileCommercialDesignV1,
  getCommercialDesignV1,
  getDemoFactsV1,
  validateCommercialDesignV1,
} from "../../lib/orvenix-ai/commercial-designs"
import { CONTABILIDAD_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/contabilidad"
import { getRealTemplate } from "../../lib/realTemplates"
import { validateTree } from "../../types/validateTree"

const CUSTOMER_FACTS = {
  businessName: "Fiscalia Clara",
  tagline: "Contabilidad mensual para PyMEs",
  description: "Despacho contable para empresas de servicios, nomina e impuestos.",
  contact: { whatsapp: "5512345678", email: "hola@fiscaliaclara.example" },
  address: "Av. Empresa 250",
  hours: "Lunes a viernes, 9:00 a 18:00",
  serviceArea: ["PyMEs", "Servicios profesionales"],
  services: [
    { name: "Contabilidad mensual", description: "Registro y reportes mensuales.", priceLabel: "Desde $4,500" },
    { name: "Nomina e IMSS", description: "Calculo de nomina y movimientos.", priceLabel: "Desde $2,900" },
    { name: "Declaraciones fiscales", description: "Presentacion de obligaciones." },
  ],
  people: [
    { name: "C.P. Elena Cruz", role: "Socia fiscal" },
    { name: "C.P. Mateo Rivas", role: "Nomina e IMSS" },
  ],
  faq: [
    { question: "¿Trabajan con empresas nuevas?", answer: "Si, se revisa el regimen y las obligaciones iniciales." },
  ],
}

function planText(value: unknown): string {
  const fragments: string[] = []
  const visit = (entry: unknown) => {
    if (typeof entry === "string") fragments.push(entry)
    else if (Array.isArray(entry)) entry.forEach(visit)
    else if (entry && typeof entry === "object") Object.values(entry as Record<string, unknown>).forEach(visit)
  }
  visit(value)
  return fragments.join("\n")
}

test("CV1-5 Contabilidad: registry exposes a valid native professional commercial design", () => {
  const validation = validateCommercialDesignV1(CONTABILIDAD_V1)
  assert.equal(validation.ok, true)
  assert.equal(CONTABILIDAD_V1.family, "professional")
  assert.deepEqual(CONTABILIDAD_V1.composition, { visualFamily: "professional", fidelity: "demo-shape" })
  assert.equal(COMMERCIAL_DESIGN_REGISTRY_V1["contabilidad@1"], CONTABILIDAD_V1)
  assert.equal(getCommercialDesignV1("contabilidad", 1), CONTABILIDAD_V1)
})

test("CV1-5 Contabilidad: customer compile produces plan pages and valid EditorTrees", async () => {
  const compiled = await compileCommercialDesignV1({ mode: "customer", designId: "contabilidad", version: 1, facts: CUSTOMER_FACTS })

  assert.deepEqual(compiled.plan.designSource, { kind: "commercial", id: "contabilidad", version: 1 })
  assert.deepEqual(compiled.plan.pages.map((page) => page.slug), ["home", "servicios", "planes", "equipo", "contacto"])

  for (const page of compiled.plan.pages) {
    const tree = validateTree(page.tree)
    assert.ok(tree.rootId)
    assert.ok(Object.keys(tree.nodes).length > 1)
    assert.ok(page.seo.title)
  }
})

test("CV1-5 Contabilidad: minimal customer compile keeps shape and never leaks demo accounting facts", async () => {
  const sparse = await compileCommercialDesignV1({
    mode: "customer",
    designId: "contabilidad",
    version: 1,
    facts: {
      businessName: "Contadores Norte",
      contact: { email: "hola@contadoresnorte.example" },
    },
  })

  assert.deepEqual(sparse.plan.pages.map((page) => page.slug), ["home", "servicios", "planes", "equipo", "contacto"])
  const text = planText(sparse.plan).toLowerCase()
  for (const forbidden of ["despacho ejemplo fiscal", "5500000000", "contacto@example.com", "desde $0000", "pyme (ejemplo)", "c.p. ejemplo"]) {
    assert.equal(text.includes(forbidden.toLowerCase()), false, forbidden)
  }
})

test("CV1-5 Contabilidad: catalog uses compiled commercial demo and start flow", () => {
  const template = getRealTemplate("contabilidad")
  assert.ok(template)
  assert.equal(template.livePath, "/templates/contabilidad/demo")
  assert.equal(template.commercialDesignId, "contabilidad")
  assert.equal(template.commercialDesignVersion, 1)
  assert.deepEqual(getCommercialTemplateStart(template), {
    designId: "contabilidad",
    version: 1,
    href: "/templates/contabilidad/comenzar",
  })
  assert.ok(getDemoFactsV1("contabilidad"))
})
