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

import { REAL_TEMPLATES, getRealTemplate } from "../../lib/realTemplates"
import { getCommercialTemplateStart } from "../../lib/commercial/template-start"
import {
  COMMERCIAL_START_MAX_SERVICES,
  EMPTY_COMMERCIAL_START_FORM,
  buildCommercialStartFacts,
  confirmCommercialSite,
  createCommercialAttemptKey,
  isSafeEditorRoute,
  requestCommercialPreview,
  toPublicCommercialMessage,
  type CommercialPreview,
  type CommercialSiteAction,
  type CommercialStartFormValues,
} from "../../lib/commercial/start-flow"
import {
  compileCommercialDesignV1,
  getCommercialDesignV1,
  getDemoFactsV1,
  DEMO_FACTS_INPUT_BY_DESIGN_V1,
  COMMERCIAL_FIDELITY_MAX_SERVICES_V1,
} from "../../lib/orvenix-ai/commercial-designs"
import type { CommercialDesignSiteCreationActionInput, OrvenixSiteCreationActionResult } from "../../app/actions/ai"

type ModuleWithLoad = { _load: (...args: unknown[]) => unknown }
type RedirectError = Error & { url: string }

const FORM: CommercialStartFormValues = {
  businessName: "  Plomería Hernández  ",
  whatsapp: "81 1234 5678",
  phone: "",
  services: "Instalación de boilers\nReparación de fugas\n\nreparación de fugas\n",
  location: "Monterrey",
  serviceArea: "San Pedro, Cumbres,  , san pedro",
}

function read(file: string) {
  return readFileSync(path.join(process.cwd(), file), "utf8")
}

function okFacts(values: CommercialStartFormValues) {
  const built = buildCommercialStartFacts(values)
  assert.ok("facts" in built, JSON.stringify(built))
  return built.facts
}

/* 1. Demo parity */
test("CV1-1: servicios-locales points to its compiled commercial demo, never the /webs React page", () => {
  const template = getRealTemplate("servicios-locales")
  assert.ok(template)
  assert.equal(template.livePath, "/templates/servicios-locales/demo")
  // The demo page renders only when the design and its demo pack are registered.
  assert.ok(getCommercialDesignV1(template.commercialDesignId, template.commercialDesignVersion))
  assert.ok(getDemoFactsV1("servicios-locales"))
  // Catalog copy no longer promises evidence the customer did not provide.
  assert.doesNotMatch(`${template.description} ${template.features.join(" ")}`, /reseñas verificadas|con precios|faq/i)
})

/* 2. Routing decision */
test("CV1-1: commercial templates start the commercial flow; legacy templates keep the self-edit path", () => {
  assert.deepEqual(getCommercialTemplateStart(getRealTemplate("servicios-locales")), {
    designId: "servicios-locales",
    version: 2,
    href: "/templates/servicios-locales/comenzar",
  })
  assert.equal(getCommercialTemplateStart(getRealTemplate("construction"))?.href, "/templates/construction/comenzar")

  for (const template of REAL_TEMPLATES) {
    const start = getCommercialTemplateStart(template)
    if (template.commercialDesignId) {
      assert.ok(start, template.id)
      assert.ok(getCommercialDesignV1(start.designId, start.version), `${template.id} must reference a registered design`)
    } else {
      assert.equal(start, null, `${template.id} must stay legacy`)
    }
  }
  assert.equal(getCommercialTemplateStart(getRealTemplate("arquitectura")), null)
  assert.equal(getCommercialTemplateStart(null), null)
  assert.equal(getCommercialTemplateStart({ id: "servicios-locales", commercialDesignId: "servicios-locales" }), null, "a version is required")
})

test("CRG-1: first sellable collection exposes exactly five safe Diseños Orvenix", () => {
  const expected = new Map([
    ["servicios-locales", { version: 2, collection: "Express" }],
    ["construction", { version: 2, collection: "Signature" }],
    ["clinica", { version: 1, collection: "Profesional" }],
    ["contabilidad", { version: 1, collection: "Profesional" }],
    ["hotel", { version: 1, collection: "Signature" }],
  ])
  const commercial = REAL_TEMPLATES.filter((template) => template.commercialDesignId)
  assert.deepEqual(commercial.map((template) => template.id).sort(), [...expected.keys()].sort())

  for (const template of commercial) {
    const spec = expected.get(template.id)
    assert.ok(spec, template.id)
    assert.equal(template.commercialDesignVersion, spec.version, template.id)
    assert.equal(template.commercialCollection, spec.collection, template.id)
    assert.equal(template.livePath, `/templates/${template.id}/demo`, template.id)
    assert.equal(getCommercialTemplateStart(template)?.href, `/templates/${template.id}/comenzar`, template.id)
    assert.ok(getCommercialDesignV1(template.commercialDesignId, template.commercialDesignVersion), template.id)
    assert.ok(getDemoFactsV1(template.commercialDesignId), template.id)

    const publicCopy = `${template.description} ${template.features.join(" ")}`
    assert.doesNotMatch(publicCopy, /testimonios|reseñas|ratings|c[eé]dulas|certificad[oa]s?|IMCP|TripAdvisor|Google|mejor precio garantizado|seguros aceptados|8 especialidades/i, template.id)
  }

  const catalog = read("app/templates/page.tsx")
  assert.match(catalog, /Diseños Orvenix · Express · Profesional · Signature/)
  assert.doesNotMatch(catalog, /100%.*editables/)
  assert.match(read("app/templates/TemplateGrid.tsx"), /Diseños Orvenix ·/)
})

test("CV1-1/1b: every 'Usar este diseño' entry point uses the shared decision; legacy templates offer no editable copy", () => {
  for (const file of ["app/templates/[id]/page.tsx", "app/templates/TemplateGrid.tsx", "app/webs/page.tsx"]) {
    const source = read(file)
    assert.match(source, /getCommercialTemplateStart\(/, file)
    assert.doesNotMatch(source, /selfEditTemplateAction/, `${file}: no legacy copy action in the commercial catalog`)
    assert.match(source, /Diseño de referencia/, `${file}: legacy templates are labelled as references`)
  }
  const demo = read("app/templates/[id]/demo/page.tsx")
  assert.match(demo, /getCommercialTemplateStart\(template\)/)
  assert.match(demo, /target="_top"/)
  const start = read("app/templates/[id]/comenzar/page.tsx")
  assert.match(start, /getCommercialDesignV1\(start\.designId, start\.version\)/)
  assert.match(start, /requireCanCreateWebsite/)
  assert.match(start, /\/login\?callbackUrl=/)
})

function redirectError(url: string): RedirectError {
  return Object.assign(new Error("NEXT_REDIRECT"), { url, digest: `NEXT_REDIRECT;replace;${url};303;` })
}

async function withTemplateActions<T>(callback: (actions: typeof import("../../app/templates/actions"), calls: { flow: Array<Record<string, unknown>>; sites: number }) => Promise<T>) {
  const originalLoad = (Module as unknown as ModuleWithLoad)._load
  const calls = { flow: [] as Array<Record<string, unknown>>, sites: 0 }
  ;(Module as unknown as ModuleWithLoad)._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "next/navigation") return { redirect: (url: string) => { throw redirectError(url) } }
    if (request === "next/cache") return { revalidatePath: () => undefined }
    if (request === "@/lib/auth-session") return { getAuthSession: async () => ({ user: { id: "user_1", email: "u@example.com" } }) }
    if (request === "@/lib/plan-guard") return { requireCanCreateWebsite: async () => ({ canCreateWebsite: true }) }
    if (request === "@/lib/auth") return { createSiteFromTree: async () => { calls.sites += 1; return { id: "never" } } }
    if (request === "@/lib/editRequests") return { createEditRequest: async () => "ticket_1" }
    if (request === "@/lib/intelligentTemplates") {
      return {
        runIntelligentTemplateFlow: async (params: Record<string, unknown>) => {
          calls.flow.push(params)
          return { intentId: "intent_1", site: { id: "site_legacy" }, nextRoute: "/editor/site_legacy" }
        },
      }
    }
    return originalLoad.call(this, request, parent, isMain)
  }
  const actionsPath = path.join(process.cwd(), ".tmp/unit/app/templates/actions.js")
  try {
    delete require.cache[actionsPath]
    return await callback(await import("../../app/templates/actions"), calls)
  } finally {
    ;(Module as unknown as ModuleWithLoad)._load = originalLoad
    delete require.cache[actionsPath]
  }
}

test("CV1-1: selfEditTemplateAction redirects commercial templates to the start page without creating anything", async () => {
  await withTemplateActions(async ({ selfEditTemplateAction }, calls) => {
    await assert.rejects(() => selfEditTemplateAction("servicios-locales"), (error) => {
      assert.equal((error as RedirectError).url, "/templates/servicios-locales/comenzar")
      return true
    })
    assert.equal(calls.flow.length, 0, "never runIntelligentTemplateFlow / createPublicPageTree")
    assert.equal(calls.sites, 0)
  })
})

test("CV1-1: a legacy template keeps the exact previous self-edit flow", async () => {
  await withTemplateActions(async ({ selfEditTemplateAction }, calls) => {
    await assert.rejects(() => selfEditTemplateAction("arquitectura"), (error) => {
      assert.equal((error as RedirectError).url, "/editor/site_legacy")
      return true
    })
    assert.deepEqual(calls.flow.map((params) => [params.templateId, params.intent]), [["arquitectura", "edit"]])
  })
})

/* 4. Form -> existing contract */
test("CV1-1: the form builds a valid BusinessFactsInputV1 containing only what the customer typed", () => {
  const facts = okFacts(FORM)
  assert.deepEqual(facts, {
    businessName: "Plomería Hernández",
    contact: { whatsapp: "81 1234 5678" },
    services: [{ name: "Instalación de boilers" }, { name: "Reparación de fugas" }],
    location: "Monterrey",
    serviceArea: ["San Pedro", "Cumbres"],
  })

  const minimal = okFacts({ ...EMPTY_COMMERCIAL_START_FORM, businessName: "Taller Uno", phone: "5512345678" })
  assert.deepEqual(minimal, { businessName: "Taller Uno", contact: { phone: "5512345678" } })
})

test("CV1-1: the form rejects missing name, missing contact and malformed numbers with product language", () => {
  const empty = buildCommercialStartFacts(EMPTY_COMMERCIAL_START_FORM)
  assert.ok("errors" in empty)
  assert.ok(empty.errors.businessName)
  assert.match(empty.errors.whatsapp ?? "", /WhatsApp o un teléfono/)

  const badNumber = buildCommercialStartFacts({ ...EMPTY_COMMERCIAL_START_FORM, businessName: "Taller", whatsapp: "123", phone: "5512345678" })
  assert.ok("errors" in badNumber, "a typed but invalid WhatsApp must not be dropped silently")
  assert.match(badNumber.errors.whatsapp ?? "", /dígitos/)

  const letters = buildCommercialStartFacts({ ...EMPTY_COMMERCIAL_START_FORM, businessName: "Taller", phone: "llamar 5512345678" })
  assert.ok("errors" in letters)
  assert.ok(letters.errors.phone)

  for (const message of Object.values({ ...empty.errors, ...badNumber.errors, ...letters.errors })) {
    assert.doesNotMatch(String(message), /BusinessFacts|missing_|hash|preview/i)
  }
})

test("CV1-1b: the form caps main services at the demo-shape structural range", () => {
  assert.equal(COMMERCIAL_START_MAX_SERVICES, COMMERCIAL_FIDELITY_MAX_SERVICES_V1)
  const facts = okFacts({ ...FORM, services: Array.from({ length: 9 }, (_, index) => `Servicio ${index + 1}`).join("\n") })
  assert.equal((facts.services as unknown[]).length, COMMERCIAL_START_MAX_SERVICES)
  assert.match(read("app/templates/[id]/comenzar/CommercialStartForm.tsx"), /hasta 6/)
})

/* 5-6. Preview never creates; confirm uses the server nextRoute */
function recordingAction(responses: { preview?: OrvenixSiteCreationActionResult; execute?: OrvenixSiteCreationActionResult }) {
  const calls: CommercialDesignSiteCreationActionInput[] = []
  const action: CommercialSiteAction = async (input) => {
    calls.push(input)
    const response = input.mode === "execute" ? responses.execute : responses.preview
    assert.ok(response, `unexpected ${input.mode} call`)
    return response
  }
  return { action, calls }
}

const PREVIEW_PAGES = [
  { slug: "home", title: "Inicio", isHome: true, tree: { rootId: "r", nodes: {} } },
  { slug: "contacto", title: "Contacto", isHome: false, tree: { rootId: "r", nodes: {} } },
]
const HASH = "a".repeat(64)

test("CV1-1: requesting the preview never executes creation", async () => {
  const { action, calls } = recordingAction({
    preview: {
      success: true,
      result: { ok: true, action: "preview", scope: "site_creation", message: "x", warnings: [] } as never,
      previewId: "preview_1",
      previewHash: HASH,
      previewPages: PREVIEW_PAGES,
    },
  })
  const facts = okFacts(FORM)
  const key = createCommercialAttemptKey()
  assert.match(key, /^[A-Za-z0-9._:-]{8,96}$/, "matches the server attempt-key pattern")
  const result = await requestCommercialPreview(action, { designId: "servicios-locales", version: 2, facts, clientAttemptKey: key })

  assert.ok("preview" in result)
  assert.deepEqual(result.preview, { previewId: "preview_1", previewHash: HASH, pages: PREVIEW_PAGES })
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], { mode: "preview", designId: "servicios-locales", version: 2, clientAttemptKey: key, facts })
  assert.equal("confirmed" in calls[0], false)
  assert.ok(calls.every((call) => call.mode !== "execute"))
})

test("CV1-1: confirming sends the persisted preview identity and navigates only to the returned editor route", async () => {
  const preview: CommercialPreview = { previewId: "preview_1", previewHash: HASH, pages: PREVIEW_PAGES }
  const created = recordingAction({
    execute: { success: true, result: { ok: true } as never, nextRoute: "/editor/site_abc123", siteId: "site_abc123" },
  })
  const result = await confirmCommercialSite(created.action, { designId: "servicios-locales", version: 2, preview })
  assert.deepEqual(result, { ok: true, nextRoute: "/editor/site_abc123" })
  assert.deepEqual(created.calls, [{
    mode: "execute",
    designId: "servicios-locales",
    version: 2,
    confirmed: true,
    previewId: "preview_1",
    expectedPreviewHash: HASH,
  }])

  // Fallback to the created-site route the server already returns elsewhere.
  const nested = recordingAction({ execute: { success: true, result: { createdSite: { nextRoute: "/editor/site_nested" } } as never } })
  assert.deepEqual(await confirmCommercialSite(nested.action, { designId: "servicios-locales", version: 2, preview }), { ok: true, nextRoute: "/editor/site_nested" })

  for (const unsafe of ["https://evil.example/editor/x", "//evil.example", "/editor/../admin", "/dashboard", undefined]) {
    const bad = recordingAction({ execute: { success: true, result: { ok: true } as never, nextRoute: unsafe } })
    const outcome = await confirmCommercialSite(bad.action, { designId: "servicios-locales", version: 2, preview })
    assert.ok("message" in outcome, String(unsafe))
  }
  assert.equal(isSafeEditorRoute("/editor/site_abc123"), true)
})

test("CV1-1: internal server wording never reaches the customer", async () => {
  assert.equal(toPublicCommercialMessage("Inicia sesión para crear un sitio con este diseño.", "x"), "Inicia sesión para crear un sitio con este diseño.")
  for (const internal of ["El Preview expiró.", "No se pudo crear el sitio con Orvenix AI.", "BusinessFactsV1 invalido: missing_contact_channel", "hash mismatch"]) {
    assert.equal(toPublicCommercialMessage(internal, "fallback"), "fallback", internal)
  }
  const failing = recordingAction({ preview: { success: false, message: "Este intento de Preview fallo. Genera uno nuevo." } })
  const outcome = await requestCommercialPreview(failing.action, { designId: "servicios-locales", version: 2, facts: okFacts(FORM), clientAttemptKey: "commercial:test-key" })
  assert.ok("message" in outcome)
  assert.doesNotMatch(outcome.message, /preview|hash|execute/i)
})

/* 7. Demo data never becomes customer facts */
function demoStrings(): string[] {
  const demo = DEMO_FACTS_INPUT_BY_DESIGN_V1["servicios-locales"]
  const values: string[] = []
  const visit = (value: unknown) => {
    if (typeof value === "string" && value.trim().length >= 6) values.push(value.trim())
    else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === "object") Object.values(value).forEach(visit)
  }
  visit(demo)
  return values
}

test("CV1-1: a customer compile from the form uses customer facts only and inherits nothing from the demo pack", async () => {
  const facts = okFacts(FORM)
  const compiled = await compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 2, facts })
  assert.equal(compiled.facts.kind, "customer")
  assert.equal(compiled.facts.businessName, "Plomería Hernández")
  assert.deepEqual(compiled.plan.pages.map((page) => page.slug), ["home", "servicios", "contacto"])

  const serialized = JSON.stringify(compiled.plan)
  assert.match(serialized, /Plomería Hernández/)
  assert.match(serialized, /wa\.me\/528112345678/)
  assert.doesNotMatch(serialized, /\/commercial-demo\//)
  assert.doesNotMatch(serialized, /de ejemplo|example\.com/i)
  for (const value of demoStrings()) assert.equal(serialized.includes(value), false, `demo value leaked: ${value}`)

  // No factual claim the customer did not give: no prices, testimonials or FAQ sections.
  assert.equal(compiled.facts.services.some((service) => service.priceLabel), false)
  assert.deepEqual(compiled.facts.evidence.testimonials ?? [], [])
  assert.deepEqual(compiled.facts.faq, [])

  await assert.rejects(
    () => compileCommercialDesignV1({ mode: "customer", designId: "servicios-locales", version: 2, facts: getDemoFactsV1("servicios-locales")! }),
    /DemoFactsPack/,
  )
})

test("CV1-1: the existing commercial action previews servicios-locales from form facts without creating a site", async () => {
  const originalLoad = (Module as unknown as ModuleWithLoad)._load
  const completed: Array<Record<string, unknown>> = []
  let creations = 0
  ;(Module as unknown as ModuleWithLoad)._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@anthropic-ai/sdk") return class Anthropic {}
    if (request === "next/cache") return { revalidatePath: () => undefined }
    if (request === "@/lib/auth-session") return { getAuthSession: async () => ({ user: { id: "user_1", role: "CLIENT" } }) }
    if (request === "@/lib/plan-guard") return { requireAIPlan: async () => { throw new Error("AI plan must not be required") }, requireCanCreateWebsite: async () => undefined }
    if (request === "@/lib/auth") return { canManageSite: async () => true }
    if (request === "@/lib/orvenix-ai/design-memory") return { recordDesignGeneration: async () => null, acceptDesignGeneration: async () => null }
    if (request === "@/lib/orvenix-ai/site-creation/preview-store") {
      return {
        reserveSiteCreationPreviewAttempt: async () => ({ id: "preview_cv1", userId: "user_1", status: "planning" }),
        getCompletedSiteCreationPreviewForAttempt: async () => null,
        completeSiteCreationPreviewAttempt: async (record: Record<string, unknown>) => {
          completed.push(record)
          return { ...record, id: String(record.previewId), status: "completed" }
        },
        failSiteCreationPreviewAttempt: async () => true,
        getSiteCreationPreviewFailureMessage: (error: unknown) => (error instanceof Error ? error.message : "error"),
        getSiteCreationPreviewForExecute: async () => null,
        createDraftSiteFromPersistedPreview: async () => {
          creations += 1
          return { siteId: "never", nextRoute: "/editor/never", verified: true }
        },
      }
    }
    return originalLoad.call(this, request, parent, isMain)
  }
  try {
    delete require.cache[path.join(process.cwd(), ".tmp/unit/app/actions/ai.js")]
    const { createSiteFromCommercialDesignAction } = await import("../../app/actions/ai")
    const preview = await requestCommercialPreview(createSiteFromCommercialDesignAction, {
      designId: "servicios-locales",
      version: 2,
      facts: okFacts(FORM),
      clientAttemptKey: "commercial:cv1-1-test",
    })
    assert.ok("preview" in preview, "message" in preview ? preview.message : "")
    assert.deepEqual(preview.preview.pages.map((page) => page.slug), ["home", "servicios", "contacto"])
    assert.match(preview.preview.previewHash, /^[a-f0-9]{64}$/)
    assert.equal(completed.length, 1)
    assert.deepEqual((completed[0].plan as { designSource?: unknown }).designSource, { kind: "commercial", id: "servicios-locales", version: 2 })
    assert.equal(creations, 0, "preview never creates a site")

    // An unconfirmed execute is refused by the existing action.
    const unconfirmed = await createSiteFromCommercialDesignAction({ mode: "execute", designId: "servicios-locales", version: 2, confirmed: false, previewId: "preview_cv1", expectedPreviewHash: preview.preview.previewHash })
    assert.equal(unconfirmed.success, false)
    assert.equal(creations, 0)
  } finally {
    ;(Module as unknown as ModuleWithLoad)._load = originalLoad
  }
})
