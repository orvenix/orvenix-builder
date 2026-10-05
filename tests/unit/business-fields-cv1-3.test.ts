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

import {
  BUSINESS_FIELDS_PROP,
  applyBusinessFieldsUpdateToSiteV1,
  assertSameStructureV1,
  countBusinessFieldUsesV1,
  materializeBusinessFieldsV1,
  nodeBusinessBindingsV1,
  readBusinessFieldsV1,
  siteBusinessFieldUsesV1,
  type BusinessFieldKeyV1,
  type BusinessFieldsSitePageV1,
} from "../../lib/commercial/business-fields"
import {
  commercialComposedStructureV1,
  compileCommercialDesignV1,
  type BusinessFactsInputV1,
} from "../../lib/orvenix-ai/commercial-designs"
import { getNodeEditCapabilities, getProtectedReason } from "../../lib/editor/context-capabilities"
import { getEditorModeCapabilities } from "../../lib/editor/editor-mode-profile"
import { resolveRuntimeHref } from "../../lib/builder-core/tree/pageLinks"
import { validateTree } from "../../types/validateTree"
import type { EditorNode, EditorTree } from "../../types/editor"

type ModuleWithLoad = { _load: (...args: unknown[]) => unknown }
const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const FACTS: BusinessFactsInputV1 = {
  businessName: "Plomeria Hernandez",
  contact: { whatsapp: "8112345678", phone: "8187654321", email: "hola@plomeria.mx" },
  address: "Av Juarez 100 Centro",
  hours: "Lunes a sabado 9 a 18",
  serviceArea: ["San Pedro"],
  social: { facebook: "https://facebook.com/plomeria", instagram: "https://instagram.com/plomeria" },
  assets: { logo: { src: "/uploads/logo-plomeria.webp" } },
  services: [{ name: "Fugas" }],
}

const cache = new Map<string, Promise<BusinessFieldsSitePageV1[]>>()
function sitePages(designId: string, facts: BusinessFactsInputV1 = FACTS, version = 2): Promise<BusinessFieldsSitePageV1[]> {
  const key = `${designId}@${version}:${JSON.stringify(facts)}`
  if (!cache.has(key)) {
    cache.set(key, compileCommercialDesignV1({ mode: "customer", designId, version, facts }).then((compiled) =>
      // Exactly what the site holds after creation: persisted JSON loaded through validateTree.
      compiled.plan.pages.map((page) => ({ slug: page.slug, isHome: page.isHome, tree: validateTree(clone(page.tree)) })),
    ))
  }
  return cache.get(key)!.then(clone)
}

function boundValues(trees: EditorTree[], field: BusinessFieldKeyV1): string[] {
  const values: string[] = []
  for (const tree of trees) {
    for (const node of Object.values(tree.nodes)) {
      for (const [prop, binding] of Object.entries(nodeBusinessBindingsV1(node))) if (binding.field === field) values.push(String(node.props[prop] ?? ""))
    }
  }
  return values
}

function update(pages: BusinessFieldsSitePageV1[], patch: Parameters<typeof applyBusinessFieldsUpdateToSiteV1>[1]) {
  const result = applyBusinessFieldsUpdateToSiteV1(pages, patch)
  assert.ok("pages" in result, JSON.stringify(result))
  return result
}

/* ----------------------------- bindings at compile ----------------------------- */

test("CV1-3 compile: a demo-shape customer site gets an authority on every page and explicit bindings", async () => {
  const pages = await sitePages("servicios-locales")
  for (const page of pages) {
    const fields = readBusinessFieldsV1(page.tree)
    assert.ok(fields, page.slug)
    assert.equal(fields.businessName, "Plomeria Hernandez")
    assert.equal(fields.whatsapp, "528112345678")
    assert.equal(fields.logo, "/uploads/logo-plomeria.webp")
  }
  const uses = siteBusinessFieldUsesV1(pages.map((page) => page.tree))
  for (const field of ["businessName", "whatsapp", "phone", "email", "address", "hours", "logo", "social.facebook", "social.instagram"] as const) {
    assert.ok((uses[field] ?? 0) > 0, `${field} has representations`)
  }
  // The demo (and the frozen @1 versions) never carry bindings.
  const demo = await compileCommercialDesignV1({ mode: "demo", designId: "servicios-locales", version: 2 })
  const v1 = await sitePages("servicios-locales", FACTS, 1)
  for (const tree of [...demo.plan.pages.map((page) => page.tree), ...v1.map((page) => page.tree)]) {
    assert.equal(readBusinessFieldsV1(tree), null)
    assert.equal(Object.values(tree.nodes).some((node) => BUSINESS_FIELDS_PROP in node.props), false)
  }
})

/* ----------------------------- one edit, whole site ----------------------------- */

test("CV1-3 name: one change updates every bound representation on every page, including SEO and WhatsApp messages", async () => {
  const pages = await sitePages("servicios-locales")
  const result = update(pages, { businessName: "Fontaneria Lopez" })
  const trees = result.pages.map((page) => page.tree)
  const names = boundValues(trees, "businessName")
  // At least the navigation brand and the footer brand on each of the three pages.
  assert.ok(names.length >= 6, String(names.length))
  assert.ok(names.every((value) => value === "Fontaneria Lopez"), JSON.stringify(names))
  for (const tree of trees) {
    const nav = Object.values(tree.nodes).find((node) => node.type === "siteNav")!
    assert.equal(nav.props.title, "Fontaneria Lopez")
    assert.match(String(nav.props.ctaHref), /^https:\/\/wa\.me\/528112345678\?text=Hola%20Fontaneria%20Lopez/)
    assert.match(String(tree.seo?.title), /Fontaneria Lopez$/)
    assert.equal(readBusinessFieldsV1(tree)?.businessName, "Fontaneria Lopez")
    assert.equal(tree.brand?.businessName, "Fontaneria Lopez", "the legacy brand kit mirrors the authority")
  }
})

test("CV1-3 phone, WhatsApp and email: every link and line on every page follows the field", async () => {
  const pages = await sitePages("servicios-locales")
  const result = update(pages, { phone: "81 0000 0000", whatsapp: "8199999999", email: "Contacto@Lopez.mx" })
  assert.equal(result.fields.phone, "8100000000")
  assert.equal(result.fields.whatsapp, "528199999999", "a 10-digit MX WhatsApp gets 52, like the intake")
  assert.equal(result.fields.email, "contacto@lopez.mx")
  const trees = result.pages.map((page) => page.tree)
  const phones = boundValues(trees, "phone")
  assert.ok(phones.length >= 4)
  assert.ok(phones.every((value) => value === "tel:8100000000" || value === "Teléfono: 8100000000"), JSON.stringify(phones))
  const whatsapp = boundValues(trees, "whatsapp")
  assert.ok(whatsapp.length >= 10)
  assert.ok(whatsapp.every((value) => value.startsWith("https://wa.me/528199999999") || value === "WhatsApp: 528199999999"), JSON.stringify(whatsapp))
  const emails = boundValues(trees, "email")
  assert.ok(emails.every((value) => value === "mailto:contacto@lopez.mx" || value === "Correo: contacto@lopez.mx"), JSON.stringify(emails))
  // No old contact value survives in any bound prop.
  const serialized = JSON.stringify(trees.map((tree) => Object.values(tree.nodes).filter((node) => BUSINESS_FIELDS_PROP in node.props).map((node) => node.props)))
  for (const old of ["8187654321", "528112345678", "hola@plomeria.mx"]) assert.equal(serialized.includes(old), false, old)
})

test("CV1-3 address, hours and social links update their bound representations", async () => {
  const pages = await sitePages("servicios-locales")
  const result = update(pages, { address: "Calle 5 #20", hours: "24 horas", social: { facebook: "https://facebook.com/lopez" } })
  const trees = result.pages.map((page) => page.tree)
  assert.ok(boundValues(trees, "address").every((value) => value === "Calle 5 #20" || value === "Dirección: Calle 5 #20"))
  assert.ok(boundValues(trees, "hours").every((value) => value === "24 horas" || value === "Horario: 24 horas"))
  const facebook = boundValues(trees, "social.facebook")
  assert.ok(facebook.length >= 3 && facebook.every((value) => value === "https://facebook.com/lopez"))
  assert.ok(boundValues(trees, "social.instagram").every((value) => value === "https://instagram.com/plomeria"), "untouched fields keep their value")
})

test("CV1-3 empty states: hours missing at creation are a bound empty state that a Business edit fills", async () => {
  const pages = await sitePages("servicios-locales", { businessName: "Taller Uno", contact: { whatsapp: "8112345678" }, services: [{ name: "Fugas" }] })
  const before = boundValues(pages.map((page) => page.tree), "hours")
  assert.ok(before.length > 0 && before.every((value) => value.includes("Agrega tu horario")))
  const result = update(pages, { hours: "9 a 18" })
  assert.ok(boundValues(result.pages.map((page) => page.tree), "hours").every((value) => value.includes("9 a 18") && !value.includes("Agrega")))
  // Clearing goes back to the empty state (hidden publicly), never to an invented value.
  const cleared = update(result.pages, { hours: "" })
  assert.ok(boundValues(cleared.pages.map((page) => page.tree), "hours").every((value) => value.includes("Agrega tu horario")))
})

test("CV1-3 logo: the design's logo slot follows the field (library/https reference only) and may be cleared", async () => {
  const pages = await sitePages("servicios-locales")
  const set = update(pages, { logo: "https://cdn.example.com/logo-lopez.png" })
  for (const page of set.pages) assert.equal(Object.values(page.tree.nodes).find((node) => node.type === "siteNav")!.props.logoSrc, "https://cdn.example.com/logo-lopez.png")
  const cleared = update(set.pages, { logo: "" })
  for (const page of cleared.pages) assert.equal("logoSrc" in Object.values(page.tree.nodes).find((node) => node.type === "siteNav")!.props, false)
  for (const bad of ["javascript:alert(1)", "data:image/png;base64,AAAA", "http://insecure.example/logo.png", "/var/lib/orvenix/uploads/x.png"]) {
    const result = applyBusinessFieldsUpdateToSiteV1(pages, { logo: bad })
    assert.ok("errors" in result && result.errors.logo, bad)
  }
})

/* ----------------------------- never a redesign ----------------------------- */

test("CV1-3 no redesign: every update keeps node ids, types, children and the composed structure", async () => {
  for (const designId of ["servicios-locales", "construction"]) {
    const pages = await sitePages(designId)
    const result = update(pages, { businessName: "Otro Nombre", phone: "8100000000", whatsapp: "8199999999", email: "a@b.mx", address: "X", hours: "Y", logo: "", social: { facebook: "https://facebook.com/x" } })
    for (const page of result.pages) {
      const before = pages.find((entry) => entry.slug === page.slug)!.tree
      assert.doesNotThrow(() => assertSameStructureV1(before, page.tree))
      assert.deepEqual(commercialComposedStructureV1(page.tree), commercialComposedStructureV1(before), `${designId}/${page.slug}`)
    }
  }
})

test("CV1-3 unbound content is never touched, even when it contains the same text", async () => {
  const pages = await sitePages("servicios-locales")
  // Add look-alike CONTENT: a service card text quoting the phone and prose mentioning the name.
  const home = pages.find((page) => page.isHome)!
  const extraId = Object.keys(home.tree.nodes).find((id) => home.tree.nodes[id].type === "text" && !(BUSINESS_FIELDS_PROP in home.tree.nodes[id].props))!
  home.tree.nodes[extraId].props = { ...home.tree.nodes[extraId].props, content: "Llámanos al 8187654321 · Plomeria Hernandez" }
  const result = update(pages, { businessName: "Fontaneria Lopez", phone: "8100000000" })
  const after = result.pages.find((page) => page.isHome)!.tree
  assert.equal(after.nodes[extraId].props.content, "Llámanos al 8187654321 · Plomeria Hernandez")
  // Prose generated around the name is design content too.
  const prose = Object.values(after.nodes).filter((node) => typeof node.props.content === "string" && (node.props.content as string).includes("Conoce más sobre Plomeria Hernandez"))
  assert.equal(prose.length, 1)
  assert.equal(BUSINESS_FIELDS_PROP in prose[0].props, false)
})

test("CV1-3 legacy: a site without an authority is never reinterpreted", () => {
  const legacy = validateTree({
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: {}, children: ["t", "b"], version: 1 },
      t: { id: "t", type: "text", props: { content: "WhatsApp: 528112345678" }, children: [], parentId: "root", version: 1 },
      b: { id: "b", type: "ctaButton", props: { label: "Llamar", href: "tel:8187654321" }, children: [], parentId: "root", version: 1 },
    },
  })
  assert.equal(readBusinessFieldsV1(legacy), null)
  assert.deepEqual(countBusinessFieldUsesV1(legacy), {})
  const result = applyBusinessFieldsUpdateToSiteV1([{ slug: "home", isHome: true, tree: legacy }], { phone: "8100000000" })
  assert.ok("message" in result && result.message)
  assert.deepEqual(getNodeEditCapabilities(legacy, "b").link, { key: "href" }, "legacy buttons keep their link control")
  assert.equal(getProtectedReason(legacy.nodes.t), undefined)
})

/* ----------------------------- editing policy ----------------------------- */

test("CV1-3 policy: bound text is protected as data-bound; bound buttons keep their label but not their link", async () => {
  const pages = await sitePages("servicios-locales")
  const tree = pages.find((page) => page.slug === "contacto")!.tree
  const bound = Object.entries(tree.nodes).filter(([, node]) => BUSINESS_FIELDS_PROP in node.props)
  const line = bound.find(([, node]) => node.type === "text")!
  assert.equal(getProtectedReason(line[1]), "data-bound")
  const button = bound.find(([, node]) => node.type === "ctaButton")!
  const caps = getNodeEditCapabilities(tree, button[0])
  assert.equal(caps.protected, undefined)
  assert.deepEqual(caps.text, { key: "label" })
  assert.equal(caps.link, undefined)
  // The protection is data-driven: the same in Simple and Pro.
  assert.equal(getProtectedReason.length, 1)
  assert.notDeepEqual(getEditorModeCapabilities("simple"), getEditorModeCapabilities("pro"))
})

test("CV1-3 persistence is fail-safe: a missing or malformed home never blocks saving a site without Business Fields", async () => {
  const saved: EditorTree[] = []
  for (const storedHome of [null, { tree: null }, { tree: "corrupt" }, { tree: [] }]) {
    const originalLoad = (Module as unknown as ModuleWithLoad)._load
    ;(Module as unknown as ModuleWithLoad)._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
      if (request === "@/lib/editor-db") return { editorPrisma: { editorWebsite: { findUnique: async () => ({ id: "site_legacy" }), upsert: async () => undefined, update: async () => undefined } } }
      if (request === "@/lib/builder-core/tree/sitePages") {
        return {
          HOME_PAGE_SLUG: "home",
          ensureHomePage: async () => undefined,
          getResolvedSitePage: async (_id: string, slug: string) => (slug === "home" ? storedHome : null),
          getResolvedSiteTheme: async () => ({ tokens: {} }),
          saveResolvedPageTree: async (_id: string, _slug: string, tree: EditorTree) => { saved.push(tree) },
          saveResolvedSiteTheme: async () => undefined,
        }
      }
      if (request === "@/lib/orvenix-ai/design-memory") return { markDesignGenerationEdited: async () => undefined }
      return originalLoad.call(this, request, parent, isMain)
    }
    const modulePath = path.join(process.cwd(), ".tmp/unit/lib/editorPersistence.js")
    try {
      delete require.cache[modulePath]
      const { saveEditorTreeToDb } = await import("../../lib/editorPersistence")
      const page = { rootId: "r", nodes: { r: { id: "r", type: "section", props: {}, children: ["t"], version: 1 }, t: { id: "t", type: "text", props: { content: "WhatsApp: 528112345678" }, children: [], parentId: "r", version: 1 } } }
      const result = await saveEditorTreeToDb("site_legacy", page, "servicios")
      assert.equal(result.nodes.t.props.content, "WhatsApp: 528112345678", JSON.stringify(storedHome))
    } finally {
      ;(Module as unknown as ModuleWithLoad)._load = originalLoad
      delete require.cache[modulePath]
    }
  }
  assert.equal(saved.length, 4)
})

test("CV1-3 persistence: any save (any mode, any page) re-derives bound values from the home authority", async () => {
  const pages = await sitePages("servicios-locales")
  const updated = update(pages, { businessName: "Fontaneria Lopez" }).pages
  const storedHome = updated.find((page) => page.isHome)!.tree
  const saved: Array<{ slug: string; tree: EditorTree }> = []
  const originalLoad = (Module as unknown as ModuleWithLoad)._load
  ;(Module as unknown as ModuleWithLoad)._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "@/lib/editor-db") {
      return { editorPrisma: { editorWebsite: { findUnique: async () => ({ id: "site_x" }), upsert: async () => undefined, update: async () => undefined } } }
    }
    if (request === "@/lib/builder-core/tree/sitePages") {
      return {
        HOME_PAGE_SLUG: "home",
        ensureHomePage: async () => undefined,
        getResolvedSitePage: async (_id: string, slug: string) => ({ slug, tree: clone(slug === "home" ? storedHome : updated.find((page) => page.slug === slug)!.tree) }),
        getResolvedSiteTheme: async () => ({ tokens: {} }),
        saveResolvedPageTree: async (_id: string, slug: string, tree: EditorTree) => { saved.push({ slug, tree }) },
        saveResolvedSiteTheme: async () => undefined,
      }
    }
    if (request === "@/lib/orvenix-ai/design-memory") return { markDesignGenerationEdited: async () => undefined }
    return originalLoad.call(this, request, parent, isMain)
  }
  const modulePath = path.join(process.cwd(), ".tmp/unit/lib/editorPersistence.js")
  try {
    delete require.cache[modulePath]
    const { saveEditorTreeToDb } = await import("../../lib/editorPersistence")
    // A Pro direct edit of a bound node plus a stale replica, on a non-home page...
    const servicios = clone(updated.find((page) => page.slug === "servicios")!.tree)
    const navId = Object.keys(servicios.nodes).find((id) => servicios.nodes[id].type === "siteNav")!
    servicios.nodes[navId].props.title = "Nombre Editado A Mano"
    ;(servicios as Record<string, unknown>).businessFields = { ...readBusinessFieldsV1(servicios), businessName: "Replica Vieja" }
    const result = await saveEditorTreeToDb("site_x", servicios, "servicios")
    assert.equal(result.nodes[navId].props.title, "Fontaneria Lopez")
    assert.equal(readBusinessFieldsV1(result)?.businessName, "Fontaneria Lopez")
    assert.equal(saved.at(-1)?.tree.nodes[navId].props.title, "Fontaneria Lopez")
    // ...and saving the home page cannot rewrite the authority either.
    const home = clone(storedHome)
    ;(home as Record<string, unknown>).businessFields = { ...readBusinessFieldsV1(home), businessName: "Intento" }
    const savedHome = await saveEditorTreeToDb("site_x", home, "home")
    assert.equal(readBusinessFieldsV1(savedHome)?.businessName, "Fontaneria Lopez")
    // Unbound edits are saved as written.
    const free = clone(updated.find((page) => page.slug === "servicios")!.tree)
    const freeId = Object.keys(free.nodes).find((id) => free.nodes[id].type === "heading" && !(BUSINESS_FIELDS_PROP in free.nodes[id].props))!
    free.nodes[freeId].props.text = "Mi título propio"
    assert.equal((await saveEditorTreeToDb("site_x", free, "servicios")).nodes[freeId].props.text, "Mi título propio")
  } finally {
    ;(Module as unknown as ModuleWithLoad)._load = originalLoad
    delete require.cache[modulePath]
  }
})

/* ----------------------------- security ----------------------------- */

test("CV1-3 security: validation reuses the central rules; unsafe values never reach the site", async () => {
  const pages = await sitePages("servicios-locales")
  const cases: Array<[Parameters<typeof applyBusinessFieldsUpdateToSiteV1>[1], BusinessFieldKeyV1]> = [
    [{ social: { facebook: "javascript:alert(1)" } }, "social.facebook"],
    [{ social: { facebook: "http://facebook.com/x" } }, "social.facebook"],
    [{ social: { instagram: "data:text/html,x" } }, "social.instagram"],
    [{ phone: "llamar 8100000000" }, "phone"],
    [{ whatsapp: "123" }, "whatsapp"],
    [{ email: "no-es-correo" }, "email"],
    [{ businessName: "   " }, "businessName"],
    [{ phone: "" }, "phone"],
    [{ social: { instagram: "" } }, "social.instagram"],
  ]
  for (const [patch, field] of cases) {
    const result = applyBusinessFieldsUpdateToSiteV1(pages, patch)
    assert.ok("errors" in result && result.errors[field], `${JSON.stringify(patch)} -> ${field}`)
  }
  // Markup is stripped from text fields.
  const named = update(pages, { businessName: "<b>Hola</b>`x`" })
  assert.equal(named.fields.businessName, "bHola/bx")
  // Bound links render through the guarded runtime resolver like any link.
  for (const page of named.pages) {
    for (const node of Object.values(page.tree.nodes) as EditorNode[]) {
      if (node.type === "ctaButton" && typeof node.props.href === "string") assert.notEqual(resolveRuntimeHref("site_x", node.props.href, "published"), "#")
    }
  }
})

test("CV1-3 action: authorization first, one transaction for every page, no writes on refusal", async () => {
  const pages = await sitePages("servicios-locales")
  const writes: Array<{ table: string; where: unknown }> = []
  let allowed = false
  const originalLoad = (Module as unknown as ModuleWithLoad)._load
  ;(Module as unknown as ModuleWithLoad)._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
    if (request === "next/cache") return { revalidatePath: () => undefined }
    if (request === "@/lib/auth-session") return { getAuthSession: async () => ({ user: { id: "user_1", role: "CLIENT" } }) }
    if (request === "@/lib/auth") return { canManageSite: async () => allowed }
    if (request === "@/lib/storage-mode") return { isFileStorageMode: () => false }
    if (request === "@/lib/editorPersistence") return { getEditorTreeFromDb: async (_id: string, slug: string) => clone(pages.find((page) => page.slug === slug)!.tree) }
    if (request === "@/lib/builder-core/tree/sitePages") {
      return {
        HOME_PAGE_SLUG: "home",
        listSitePages: async () => pages.map((page) => ({ slug: page.slug, isHome: page.isHome })),
        getResolvedSitePage: async (_id: string, slug: string) => ({ slug, tree: clone(pages.find((page) => page.slug === slug)!.tree), updatedAt: new Date(0) }),
      }
    }
    if (request === "@/lib/editor-db") {
      const tx = {
        sitePage: { update: async (args: { where: unknown }) => { writes.push({ table: "sitePage", where: args.where }) } },
        editorWebsite: { update: async (args: { where: unknown }) => { writes.push({ table: "editorWebsite", where: args.where }) } },
      }
      return { editorPrisma: { $transaction: async (callback: (client: typeof tx) => Promise<void>) => callback(tx) } }
    }
    return originalLoad.call(this, request, parent, isMain)
  }
  const modulePath = path.join(process.cwd(), ".tmp/unit/app/actions/business-fields.js")
  try {
    delete require.cache[modulePath]
    const action = await import("../../app/actions/business-fields")
    const refused = await action.updateBusinessFieldsAction({ siteId: "site_x", patch: { businessName: "X" } })
    assert.equal(refused.success, false)
    assert.equal(writes.length, 0)
    allowed = true
    const invalid = await action.updateBusinessFieldsAction({ siteId: "site_x", patch: { social: { facebook: "javascript:x" } } })
    assert.equal(invalid.success, false)
    assert.equal(writes.length, 0)
    const ok = await action.updateBusinessFieldsAction({ siteId: "site_x", pageSlug: "servicios", patch: { phone: "8100000000" } })
    assert.equal(ok.success, true)
    assert.deepEqual(writes.filter((write) => write.table === "sitePage").map((write) => (write.where as { siteId_slug: { slug: string; siteId: string } }).siteId_slug), pages.map((page) => ({ siteId: "site_x", slug: page.slug })))
    assert.deepEqual(writes.filter((write) => write.table === "editorWebsite").map((write) => write.where), [{ id: "site_x" }])
  } finally {
    ;(Module as unknown as ModuleWithLoad)._load = originalLoad
    delete require.cache[modulePath]
  }
})

/* ----------------------------- Simple / Pro / UI ----------------------------- */

test("CV1-3 Simple surface: real Business controls on connected sites; guide only for older commercial sites; no new data model", () => {
  const brand = read("components/editor/experience/client/ClientBrandPanel.tsx")
  assert.match(brand, /hasBusinessFields && \(\s*<PanelSection title="Negocio"/)
  assert.match(brand, /isCommercialSite && !hasBusinessFields/)
  const panel = read("components/editor/experience/client/BusinessFieldsPanel.tsx")
  assert.match(panel, /updateBusinessFieldsAction/)
  assert.match(panel, /flushPendingSave\(\)/)
  // The canvas shows the saved tree (same store, same renderer) -- no local re-derivation, no uploads.
  assert.match(panel, /latest\.initialize\(websiteId, result\.tree/)
  assert.doesNotMatch(panel, /\/api\/editor\/upload|FormData|fetch\(/)
  // VE-4 conflict surface untouched in CV1-3.
  assert.doesNotMatch(read("components/editor/selection/CustomerContextBar.tsx"), /businessFields|BusinessField/)
  // Materialization is pure and mode-free.
  assert.equal(materializeBusinessFieldsV1.length, 2)
})
