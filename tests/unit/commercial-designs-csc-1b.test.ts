import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"

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

import { validateTree } from "../../types/validateTree"
import {
  COMMERCIAL_DESIGN_REGISTRY_V1,
  EXIF_GPS_STRIP_REQUIREMENT_V1,
  calculateCommercialStructuralFingerprintV1,
  compileCommercialDesignV1,
  getDemoFactsV1,
  normalizeBusinessFactsV1,
  resolveCommercialDesignV1,
  validateCommercialDesignV1,
} from "../../lib/orvenix-ai/commercial-designs"
import { SERVICIOS_LOCALES_V1 } from "../../lib/orvenix-ai/commercial-designs/designs/servicios-locales"
import { safeLogoSrcV1 } from "../../components/editor/primitives/SiteNav"

const CUSTOMER_FACTS = {
  businessName: "Taller Alfa Local",
  tagline: "Servicio local autorizado por el cliente",
  description: "Mantenimiento residencial y comercial con atención directa.",
  contact: { whatsapp: "5512345678", phone: "5512345678", email: "hola@talleralfa.example" },
  address: "Calle Ficticia 123",
  hours: "Lunes a viernes, 9:00 a 17:00",
  serviceArea: ["Roma Norte", "Condesa"],
  services: [
    { name: "Instalación", description: "Instalación en sitio.", priceLabel: "Desde $750" },
    { name: "Mantenimiento", description: "Revisión preventiva.", priceLabel: "Desde $490" },
    { name: "Reparación", description: "Diagnóstico y ajuste." },
  ],
  faq: [
    { question: "¿Atienden hoy?", answer: "La disponibilidad se confirma por WhatsApp." },
    { question: "¿Cotizan antes de visitar?", answer: "Sí, con la información que comparta el cliente." },
  ],
  assets: {
    logo: { src: "/uploads/taller-alfa.webp", alt: "Taller Alfa Local" },
    hero: { src: "/uploads/taller-alfa-hero.webp", alt: "Equipo de trabajo" },
    serviceImages: [{ src: "/uploads/taller-alfa-servicio.webp", alt: "Servicio en sitio" }],
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

function nodeTypes(plan: Awaited<ReturnType<typeof compileCommercialDesignV1>>["plan"]) {
  return new Set(plan.pages.flatMap((page) => Object.values(page.tree.nodes).map((node) => node.type)))
}

test("CSC-1B CommercialDesignV1 accepts Servicios Locales and registry is immutable", () => {
  const validation = validateCommercialDesignV1(SERVICIOS_LOCALES_V1)
  assert.equal(validation.ok, true)
  assert.equal(COMMERCIAL_DESIGN_REGISTRY_V1["servicios-locales@1"], SERVICIOS_LOCALES_V1)
  assert.equal(Object.isFrozen(COMMERCIAL_DESIGN_REGISTRY_V1["servicios-locales@1"]), true)
})

test("CSC-1B validator rejects unknown, commerce-authoritative and code-like fields", () => {
  const bad = {
    ...SERVICIOS_LOCALES_V1,
    html: "<section />",
    products: [{ sku: "sku_1", stock: 99, price: 100 }],
    pages: [{ ...SERVICIOS_LOCALES_V1.pages[0], sections: [{ role: "hero", className: "p-8" }] }],
  }
  const validation = validateCommercialDesignV1(bad)
  assert.equal(validation.ok, false)
  assert.ok("diagnostics" in validation)
  assert.ok(validation.diagnostics.some((diagnostic) => diagnostic.code === "unknown_key"))
})

test("CSC-1B BusinessFactsV1 requires businessName and one contact channel", () => {
  assert.deepEqual(normalizeBusinessFactsV1({ businessName: "Sin contacto" }).ok, false)
  assert.deepEqual(normalizeBusinessFactsV1({ contact: { email: "hola@example.com" } }).ok, false)
  const normalized = normalizeBusinessFactsV1({ businessName: "Local", contact: { email: "hola@example.com" } })
  assert.equal(normalized.ok, true)
})

test("CSC-1B demo and customer compile share structural fingerprint with equivalent fact coverage", async () => {
  const demo = await compileCommercialDesignV1({ mode: "demo", designId: "servicios-locales", version: 1 })
  const customer = await compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 1, facts: CUSTOMER_FACTS })
  assert.equal(demo.plan.designSource?.id, "servicios-locales")
  assert.equal(customer.plan.designSource?.version, 1)
  assert.equal(demo.plan.pages.length, 3)
  assert.equal(customer.plan.pages.map((page) => page.slug).join(","), "home,servicios,contacto")
  assert.equal(demo.structuralFingerprint, customer.structuralFingerprint)
})

test("CSC-1B customer compile rejects demo facts and never leaks distinctive demo values", async () => {
  const demoFacts = getDemoFactsV1("servicios-locales")
  assert.ok(demoFacts)
  await assert.rejects(
    () => compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 1, facts: demoFacts }),
    /DemoFactsPack/,
  )

  const customer = await compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 1, facts: CUSTOMER_FACTS })
  const text = planText(customer.plan).toLowerCase()
  for (const forbidden of [
    "servicios ejemplo hogar",
    "5500000000",
    "contacto@example.com",
    "zona centro (ejemplo)",
    "desde $0000",
    "negocio de ejemplo",
    "demo-servicios-locales",
  ]) {
    assert.equal(text.includes(forbidden.toLowerCase()), false, forbidden)
  }
})

test("CSC-1B strictFacts omits invented facts when optional data is absent", async () => {
  const sparse = await compileCommercialDesignV1({
    mode: "customer",
    designId: "servicios-locales",
    version: 1,
    facts: {
      businessName: "Local Mínimo",
      contact: { email: "contacto@local-minimo.example" },
    },
  })
  const text = planText(sparse.plan).toLowerCase()
  for (const forbidden of ["desde $", "años", "clientes", "reseñas", "rating", "garantía", "certificado", "zona de servicio:", "horario:"]) {
    assert.equal(text.includes(forbidden), false, forbidden)
  }
  assert.equal(sparse.plan.pages.some((page) => page.slug === "servicios"), false)
})

test("CSC-1B compiled pilot trees validate and survive JSON roundtrip", async () => {
  const compiled = await compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 1, facts: CUSTOMER_FACTS })
  for (const page of compiled.plan.pages) {
    const validated = validateTree(page.tree)
    const roundTrip = validateTree(JSON.parse(JSON.stringify(validated)))
    assert.equal(roundTrip.rootId, validated.rootId)
    assert.ok(Object.keys(roundTrip.nodes).length > 1)
    assert.ok(page.seo.title)
    assert.ok(page.seo.description)
  }
})

test("CSC-1B PublicRenderer compatibility uses normal block vocabulary, not free-position nodes", async () => {
  const compiled = await compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 1, facts: CUSTOMER_FACTS })
  const types = nodeTypes(compiled.plan)
  assert.equal(types.has("siteNav"), true)
  assert.equal(types.has("section"), true)
  assert.equal(planText(compiled.plan).includes("positionMode"), false)
})

test("CSC-1B asset roles degrade and EXIF/GPS invariant is captured", async () => {
  const noAssets = await compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 1, facts: { ...CUSTOMER_FACTS, assets: undefined } })
  assert.equal(noAssets.plan.pages.length, 3)
  assert.equal(EXIF_GPS_STRIP_REQUIREMENT_V1.implemented, false)
  assert.equal(SERVICIOS_LOCALES_V1.pages.some((page) => JSON.stringify(page).includes("/uploads/")), false)
})

test("CSC-1B SiteNav logo sanitizer accepts only upload/https and preserves fallback cases", () => {
  assert.equal(safeLogoSrcV1("/uploads/logo.webp"), "/uploads/logo.webp")
  assert.equal(safeLogoSrcV1("https://cdn.example.com/logo.png"), "https://cdn.example.com/logo.png")
  assert.equal(safeLogoSrcV1("javascript:alert(1)"), null)
  assert.equal(safeLogoSrcV1("data:image/png;base64,xxx"), null)
  assert.equal(safeLogoSrcV1(undefined), null)
})

test("CSC-1B footer presets render only supplied facts", async () => {
  const phoneOnly = await compileCommercialDesignV1({
    mode: "customer",
    designId: "servicios-locales",
    version: 1,
    facts: {
      businessName: "Teléfono Local",
      contact: { phone: "5512345678" },
    },
  })
  const text = planText(phoneOnly.plan)
  assert.equal(text.includes("Teléfono: 5512345678"), true)
  assert.equal(text.includes("WhatsApp:"), false)
  assert.equal(text.includes("Zona de servicio:"), false)
  assert.equal(text.includes("Gracias por tu visita"), false)
})

test("CSC-1B dev review and commercial action guards are wired without bypassing preview", () => {
  const devRoute = readFileSync("app/dev-commercial-review/servicios-locales/page.tsx", "utf8")
  assert.match(devRoute, /process\.env\.NODE_ENV === "production"/)
  assert.match(devRoute, /compileCommercialDesignV1/)
  assert.match(devRoute, /PublicRenderer/)

  const action = readFileSync("app/actions/ai.ts", "utf8")
  assert.match(action, /createSiteFromCommercialDesignAction/)
  assert.match(action, /getAuthSession/)
  assert.match(action, /requireCanCreateWebsite/)
  assert.match(action, /completeSiteCreationPreviewAttempt/)
  assert.match(action, /runOrvenixSiteCreationAction/)
})

test("CSC-1B structural fingerprint is derived from resolver design structure", () => {
  const normalized = normalizeBusinessFactsV1(CUSTOMER_FACTS)
  assert.equal(normalized.ok, true)
  if (!normalized.ok) throw new Error("unreachable")
  const resolved = resolveCommercialDesignV1(SERVICIOS_LOCALES_V1, normalized.facts)
  assert.equal(calculateCommercialStructuralFingerprintV1(resolved).length, 64)
  assert.equal(resolved.skeleton.map((page) => page.slug).join(","), "home,servicios,contacto")
})
