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
import { HOTEL_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/hotel"
import { getRealTemplate } from "../../lib/realTemplates"
import { validateTree } from "../../types/validateTree"

const CUSTOMER_FACTS = {
  businessName: "Casa Bruma Hotel",
  tagline: "Hospedaje boutique entre bosque y ciudad",
  description: "Hotel boutique con suites, desayuno y experiencias de descanso.",
  contact: { whatsapp: "5512345678", email: "reservas@casabruma.example" },
  address: "Camino del Bosque 45",
  hours: "Check-in 15:00 · Check-out 12:00",
  serviceArea: ["Escapadas", "Parejas", "Viajes de descanso"],
  services: [
    { name: "Suite terraza", description: "Suite con terraza privada.", priceLabel: "Desde $3,200" },
    { name: "Habitacion jardin", description: "Habitacion con acceso a jardin.", priceLabel: "Desde $2,400" },
    { name: "Desayuno incluido", description: "Desayuno preparado en sitio." },
  ],
  faq: [
    { question: "¿Aceptan mascotas?", answer: "La disponibilidad se confirma al reservar." },
  ],
  assets: {
    hero: { src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=900&fit=crop&q=80", alt: "Hotel boutique" },
    serviceImages: [{ src: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&h=700&fit=crop&q=80", alt: "Habitacion" }],
  },
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

test("CV1-6 Hotel: registry exposes a valid native hospitality commercial design", () => {
  const validation = validateCommercialDesignV1(HOTEL_V1)
  assert.equal(validation.ok, true)
  assert.equal(HOTEL_V1.family, "hospitality")
  assert.deepEqual(HOTEL_V1.composition, { visualFamily: "hospitality", fidelity: "demo-shape" })
  assert.equal(COMMERCIAL_DESIGN_REGISTRY_V1["hotel@1"], HOTEL_V1)
  assert.equal(getCommercialDesignV1("hotel", 1), HOTEL_V1)
})

test("CV1-6 Hotel: customer compile produces distinct hospitality pages and valid EditorTrees", async () => {
  const compiled = await compileCommercialDesignV1({ mode: "customer", designId: "hotel", version: 1, facts: CUSTOMER_FACTS })

  assert.deepEqual(compiled.plan.designSource, { kind: "commercial", id: "hotel", version: 1 })
  assert.deepEqual(compiled.plan.pages.map((page) => page.slug), ["home", "habitaciones", "experiencia", "reservar", "contacto"])

  for (const page of compiled.plan.pages) {
    const tree = validateTree(page.tree)
    assert.ok(tree.rootId)
    assert.ok(Object.keys(tree.nodes).length > 1)
    assert.ok(page.seo.title)
  }
})

test("CV1-6 Hotel: minimal customer compile keeps shape and never leaks demo hotel facts", async () => {
  const sparse = await compileCommercialDesignV1({
    mode: "customer",
    designId: "hotel",
    version: 1,
    facts: {
      businessName: "Hotel Norte",
      contact: { phone: "5512345678" },
    },
  })

  assert.deepEqual(sparse.plan.pages.map((page) => page.slug), ["home", "habitaciones", "experiencia", "reservar", "contacto"])
  const text = planText(sparse.plan).toLowerCase()
  for (const forbidden of ["hotel ejemplo boutique", "5500000000", "reservas@example.com", "desde $0000", "escapadas de fin de semana (ejemplo)"]) {
    assert.equal(text.includes(forbidden.toLowerCase()), false, forbidden)
  }
})

test("CV1-6 Hotel: catalog uses compiled commercial demo and start flow", () => {
  const template = getRealTemplate("hotel")
  assert.ok(template)
  assert.equal(template.livePath, "/templates/hotel/demo")
  assert.equal(template.commercialDesignId, "hotel")
  assert.equal(template.commercialDesignVersion, 1)
  assert.deepEqual(getCommercialTemplateStart(template), {
    designId: "hotel",
    version: 1,
    href: "/templates/hotel/comenzar",
  })
  assert.ok(getDemoFactsV1("hotel"))
})
