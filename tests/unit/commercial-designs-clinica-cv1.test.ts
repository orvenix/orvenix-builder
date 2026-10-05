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
import { CLINICA_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/clinica"
import { getRealTemplate } from "../../lib/realTemplates"
import { validateTree } from "../../types/validateTree"

const CUSTOMER_FACTS = {
  businessName: "Clinica Aurora",
  tagline: "Atencion medica cercana y coordinada",
  description: "Clinica privada con consulta general, odontologia preventiva y fisioterapia.",
  contact: { whatsapp: "5512345678", phone: "5512345678", email: "citas@clinicaaurora.example" },
  address: "Av. Salud 120",
  hours: "Lunes a viernes, 8:00 a 19:00",
  serviceArea: ["Centro", "Norte", "Teleconsulta"],
  services: [
    { name: "Consulta general", description: "Valoracion inicial y seguimiento." },
    { name: "Odontologia preventiva", description: "Revision, limpieza y orientacion." },
    { name: "Fisioterapia", description: "Plan de rehabilitacion y movilidad." },
  ],
  people: [
    { name: "Dra. Laura Medina", role: "Medicina general" },
    { name: "Dr. Andres Vega", role: "Odontologia" },
  ],
  testimonials: [
    { quote: "Agende rapido y recibimos seguimiento claro.", author: "Paciente autorizado", role: "Consulta general" },
  ],
  faq: [
    { question: "¿Atienden con cita?", answer: "Si, las citas se confirman por WhatsApp o telefono." },
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

test("CV1-4 Clinica: registry exposes a valid native health commercial design", () => {
  const validation = validateCommercialDesignV1(CLINICA_V1)
  assert.equal(validation.ok, true)
  assert.equal(CLINICA_V1.siteType, "health")
  assert.deepEqual(CLINICA_V1.composition, { visualFamily: "health", fidelity: "demo-shape" })
  assert.equal(COMMERCIAL_DESIGN_REGISTRY_V1["clinica@1"], CLINICA_V1)
  assert.equal(getCommercialDesignV1("clinica", 1), CLINICA_V1)
})

test("CV1-4 Clinica: demo and customer compile through CommercialDesignV1 into valid EditorTrees", async () => {
  const demo = await compileCommercialDesignV1({ mode: "demo", designId: "clinica", version: 1 })
  const customer = await compileCommercialDesignV1({ mode: "customer", designId: "clinica", version: 1, facts: CUSTOMER_FACTS })

  assert.deepEqual(demo.plan.designSource, { kind: "commercial", id: "clinica", version: 1 })
  assert.deepEqual(customer.plan.designSource, { kind: "commercial", id: "clinica", version: 1 })
  assert.deepEqual(customer.plan.pages.map((page) => page.slug), ["home", "especialidades", "equipo", "citas", "contacto"])
  assert.equal(customer.generated.architecture.siteType, "health")

  for (const page of customer.plan.pages) {
    const tree = validateTree(page.tree)
    assert.ok(tree.rootId)
    assert.ok(Object.keys(tree.nodes).length > 1)
    assert.ok(page.seo.title)
  }
})

test("CV1-4 Clinica: sparse customer data keeps sellable shape without leaking demo facts", async () => {
  const sparse = await compileCommercialDesignV1({
    mode: "customer",
    designId: "clinica",
    version: 1,
    facts: {
      businessName: "Consultorio Norte",
      contact: { phone: "5512345678" },
    },
  })

  assert.deepEqual(sparse.plan.pages.map((page) => page.slug), ["home", "especialidades", "equipo", "citas", "contacto"])
  const text = planText(sparse.plan).toLowerCase()
  for (const forbidden of ["clinica ejemplo integral", "5500000000", "contacto@example.com", "paciente de ejemplo", "zona centro (ejemplo)"]) {
    assert.equal(text.includes(forbidden.toLowerCase()), false, forbidden)
  }
})

test("CV1-4 Clinica: catalog uses compiled commercial demo and start flow", () => {
  const template = getRealTemplate("clinica")
  assert.ok(template)
  assert.equal(template.livePath, "/templates/clinica/demo")
  assert.equal(template.commercialDesignId, "clinica")
  assert.equal(template.commercialDesignVersion, 1)
  assert.deepEqual(getCommercialTemplateStart(template), {
    designId: "clinica",
    version: 1,
    href: "/templates/clinica/comenzar",
  })
  assert.ok(getDemoFactsV1("clinica"))
})
