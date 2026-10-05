import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync, readdirSync, statSync } from "node:fs"

/*
 * ADMIN MODERATION MINIMUM: WARNING / SUSPEND / REACTIVATE / TERMINATE with
 * AuditLog (module = "moderation") as the source of truth. The real modules
 * (lib/auth, site-publication, proxy, the public routes) run against one
 * in-memory database, so every surface is checked through its own code.
 */

type AuditRow = {
  id: string
  createdAt: Date
  level: string
  module: string
  action: string
  userId: string | null
  siteId: string | null
  entityType: string | null
  entityId: string | null
  message: string
  metadata: Record<string, unknown> | null
}
type SiteRow = { id: string; name: string; userId: string | null; published: boolean; user: { email: string; name: string | null } | null }
type Where = { module?: string; siteId?: string | { in: string[] }; action?: { in: string[] } }

const ctx = {
  sites: new Map<string, SiteRow>(),
  users: new Map<string, { id: string; role: string }>(),
  audit: [] as AuditRow[],
  clock: Date.UTC(2026, 9, 5, 12),
  failAuditInsert: false,
  session: null as null | { user: { id: string; role?: string } },
  contacts: [] as unknown[],
  automations: [] as unknown[],
  emails: [] as Array<{ to: string; subject: string; html: string }>,
}

function matches(row: AuditRow, where: Where) {
  if (where.module && row.module !== where.module) return false
  if (typeof where.siteId === "string" && row.siteId !== where.siteId) return false
  if (where.siteId && typeof where.siteId === "object" && !where.siteId.in.includes(row.siteId ?? "")) return false
  if (where.action && !where.action.in.includes(row.action)) return false
  return true
}
const latestFirst = (a: AuditRow, b: AuditRow) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1)
const siteView = (site: SiteRow) => ({ ...site, description: "", tree: { rootId: "root", nodes: {} } })

const fakePrisma = {
  user: { findUnique: async ({ where }: { where: { id: string } }) => ctx.users.get(where.id) ?? null },
  editorWebsite: {
    findFirst: async ({ where }: { where: { id: string; published?: boolean; userId?: string } }) => {
      const site = ctx.sites.get(where.id)
      if (!site) return null
      if (where.published !== undefined && site.published !== where.published) return null
      if (where.userId !== undefined && site.userId !== where.userId) return null
      return siteView(site)
    },
    findUnique: async ({ where }: { where: { id: string } }) => (ctx.sites.has(where.id) ? siteView(ctx.sites.get(where.id)!) : null),
    deleteMany: async ({ where }: { where: { id: string; userId?: string } }) => {
      const site = ctx.sites.get(where.id)
      if (!site || (where.userId !== undefined && site.userId !== where.userId)) return { count: 0 }
      ctx.sites.delete(where.id)
      return { count: 1 }
    },
  },
  auditLog: {
    create: async ({ data }: { data: Omit<AuditRow, "id" | "createdAt"> }) => {
      if (ctx.failAuditInsert) throw new Error("audit table unavailable")
      ctx.clock += 1000
      const row = { id: `audit_${String(ctx.audit.length + 1).padStart(4, "0")}`, createdAt: new Date(ctx.clock), ...data } as AuditRow
      ctx.audit.push(row)
      return { id: row.id }
    },
    update: async ({ where, data }: { where: { id: string }; data: { metadata: Record<string, unknown> } }) => {
      const row = ctx.audit.find((entry) => entry.id === where.id)!
      row.metadata = data.metadata
      return row
    },
    findFirst: async ({ where }: { where: Where }) => ctx.audit.filter((row) => matches(row, where)).sort(latestFirst)[0] ?? null,
    findMany: async ({ where }: { where: Where }) => ctx.audit.filter((row) => matches(row, where)).sort(latestFirst),
  },
}

type ModuleWithInternals = {
  _resolveFilename: (...args: unknown[]) => string
  _load: (...args: unknown[]) => unknown
}
const ModuleInternals = Module as unknown as ModuleWithInternals
const originalResolveFilename = ModuleInternals._resolveFilename
ModuleInternals._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}
const originalLoad = ModuleInternals._load
ModuleInternals._load = function mockedLoad(request: unknown, parent: unknown, isMain: unknown) {
  if (request === "@/lib/editor-db") return { editorPrisma: fakePrisma }
  if (request === "@/lib/storage-mode") return { isFileStorageMode: () => false, getStorageMode: () => "database" }
  if (request === "@/lib/auth-session") return { getAuthSession: async () => ctx.session }
  if (request === "next/cache") return { revalidatePath: () => undefined, revalidateTag: () => undefined }
  if (request === "@/lib/adminCsv") return { createContact: async (contact: unknown) => { ctx.contacts.push(contact); return { id: "contact_1" } } }
  if (request === "@/lib/automation/runtime") return { triggerAutomations: async (...args: unknown[]) => { ctx.automations.push(args) } }
  if (request === "resend") {
    return {
      Resend: class {
        emails = { send: async (args: { to: string; subject: string; html: string }) => { ctx.emails.push(args); return { error: null } } }
      },
    }
  }
  return originalLoad.call(this, request, parent, isMain)
}
process.env.RESEND_API_KEY = "re_unit_test_only"

const ADMIN = "admin_1"
const OWNER = "owner_1"
const STRANGER = "stranger_1"

function reset() {
  ctx.sites = new Map([
    ["site_live", { id: "site_live", name: "Taller <b>Uno</b>", userId: OWNER, published: true, user: { email: "owner@example.test", name: "Ana <script>x</script>" } }],
    ["site_draft", { id: "site_draft", name: "Borrador", userId: OWNER, published: false, user: { email: "owner@example.test", name: "Ana" } }],
  ])
  ctx.users = new Map([
    [ADMIN, { id: ADMIN, role: "ADMIN" }],
    [OWNER, { id: OWNER, role: "CLIENT" }],
    [STRANGER, { id: STRANGER, role: "CLIENT" }],
  ])
  ctx.audit = []
  ctx.failAuditInsert = false
  ctx.session = null
  ctx.contacts = []
  ctx.automations = []
  ctx.emails = []
}

const actions = () => import("../../app/actions/admin-moderation")
const moderation = () => import("../../lib/moderation/site-moderation")
const auth = () => import("../../lib/auth")

async function asAdmin<T>(run: () => Promise<T>): Promise<T> {
  ctx.session = { user: { id: ADMIN, role: "ADMIN" } }
  try {
    return await run()
  } finally {
    ctx.session = null
  }
}
async function moderate(input: Record<string, unknown>) {
  return asAdmin(async () => (await actions()).moderateSiteAction(input))
}
async function state(siteId = "site_live") {
  return (await (await moderation()).getSiteModerationStatus(siteId)).state
}

/* ----------------------------- authorization ----------------------------- */

test("MODERATION: a CLIENT cannot moderate, and forged parameters or a forged token role do not help", async () => {
  reset()
  const { moderateSiteAction } = await actions()
  ctx.session = null
  assert.equal((await moderateSiteAction({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido" })).success, false)
  ctx.session = { user: { id: OWNER, role: "CLIENT" } }
  assert.equal((await moderateSiteAction({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido", role: "ADMIN", userRole: "ADMIN", isAdmin: true })).success, false)
  // The role is read from the database, not from the session token.
  ctx.session = { user: { id: STRANGER, role: "ADMIN" } }
  assert.equal((await moderateSiteAction({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido" })).success, false)
  // The owner cannot reactivate their own site either.
  ctx.session = { user: { id: OWNER, role: "CLIENT" } }
  assert.equal((await moderateSiteAction({ siteId: "site_live", action: "REACTIVATE", reason: "Ya lo corregí" })).success, false)
  assert.equal(ctx.audit.length, 0)
})

test("MODERATION: invalid ids, missing sites, empty or oversized reasons, unknown actions and unconfirmed terminations are refused without writing", async () => {
  reset()
  for (const input of [
    { siteId: "site_live' OR 1=1", action: "SUSPEND", reason: "Motivo válido" },
    { siteId: "../etc/passwd", action: "SUSPEND", reason: "Motivo válido" },
    { siteId: "site_missing", action: "SUSPEND", reason: "Motivo válido" },
    { siteId: "site_live", action: "SUSPEND", reason: "   " },
    { siteId: "site_live", action: "SUSPEND", reason: "<b></b>" },
    { siteId: "site_live", action: "SUSPEND", reason: "x".repeat(501) },
    { siteId: "site_live", action: "PURGE", reason: "Motivo válido" },
    { siteId: "site_live", action: "TERMINATE", reason: "Motivo válido" },
    { siteId: "site_live", action: "TERMINATE", reason: "Motivo válido", confirmSiteId: "site_other" },
    { siteId: "site_live", action: "REACTIVATE", reason: "Ya está activo" },
  ]) {
    const result = await moderate(input)
    assert.equal(result.success, false, JSON.stringify(input))
  }
  assert.equal(ctx.audit.length, 0)
})

test("MODERATION: the reason is stored as bounded plain text and the row answers who, what, when, why", async () => {
  reset()
  const { sanitizeModerationReason } = await moderation()
  assert.deepEqual(sanitizeModerationReason('Spam <script>alert("x")</script> en\n\tla portada'), { ok: true, reason: 'Spam alert("x") en la portada' })
  const result = await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Phishing <img src=x onerror=alert(1)> en contacto" })
  assert.equal(result.success, true)
  const row = ctx.audit[0]
  assert.equal(row.module, "moderation")
  assert.equal(row.action, "SUSPEND")
  assert.equal(row.siteId, "site_live")
  assert.equal(row.entityId, "site_live")
  assert.equal(row.userId, ADMIN)
  assert.ok(row.createdAt instanceof Date)
  assert.equal(row.message, "Phishing en contacto")
  assert.doesNotMatch(row.message, /[<>]/)
  assert.deepEqual(row.metadata, { ownerId: OWNER, previousState: "active", nextState: "suspended", published: true })
})

test("MODERATION: if the AuditLog row cannot be written the action fails and nothing changes", async () => {
  reset()
  ctx.failAuditInsert = true
  const result = await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido" })
  assert.equal(result.success, false)
  assert.equal(await state(), "active")
  const source = readFileSync(path.join(process.cwd(), "app/actions/admin-moderation.ts"), "utf8")
  assert.doesNotMatch(source, /from "@\/lib\/audit"/, "the error-swallowing audit() helper is not used for moderation")
})

/* --------------------------------- state --------------------------------- */

test("MODERATION: the latest SUSPEND / REACTIVATE / TERMINATE wins and WARNING never changes the state", async () => {
  reset()
  assert.equal(await state(), "active")
  assert.equal((await moderate({ siteId: "site_live", action: "WARNING", reason: "Revisa los precios" })).success, true)
  assert.equal(await state(), "active")
  await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Contenido engañoso" })
  assert.equal(await state(), "suspended")
  await moderate({ siteId: "site_live", action: "WARNING", reason: "Segundo aviso" })
  assert.equal(await state(), "suspended")
  await moderate({ siteId: "site_live", action: "REACTIVATE", reason: "Corregido" })
  assert.equal(await state(), "active")
  await moderate({ siteId: "site_live", action: "TERMINATE", reason: "Reincidencia", confirmSiteId: "site_live" })
  assert.equal(await state(), "terminated")
  const { getSitesModerationSummary } = await moderation()
  const summary = await getSitesModerationSummary(["site_live", "site_draft"])
  assert.equal(summary.get("site_live")!.state, "terminated")
  assert.equal(summary.get("site_live")!.reason, "Reincidencia")
  assert.ok(summary.get("site_live")!.lastWarningAt)
  assert.equal(summary.get("site_draft")!.state, "active")
  // Moderation rows are permanent: nothing in the product deletes audit logs.
  assert.deepEqual(findSources(/auditLog\.(delete|deleteMany)\(/), [])
})

/* ---------------------------- public surfaces ---------------------------- */

test("MODERATION: SUSPEND hides /p; REACTIVATE returns the site to its own publication state", async () => {
  reset()
  const { getPublishedSite } = await auth()
  assert.ok(await getPublishedSite("site_live"))
  await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido" })
  assert.equal(await getPublishedSite("site_live"), null)
  assert.equal(ctx.sites.get("site_live")!.published, true, "suspension never touches published")
  await moderate({ siteId: "site_live", action: "REACTIVATE", reason: "Corregido" })
  assert.ok(await getPublishedSite("site_live"))
  // A draft stays a draft after a suspension cycle.
  await moderate({ siteId: "site_draft", action: "SUSPEND", reason: "Contenido prohibido" })
  await moderate({ siteId: "site_draft", action: "REACTIVATE", reason: "Corregido" })
  assert.equal(await getPublishedSite("site_draft"), null)
  // Every /p route goes through getPublishedSite.
  for (const route of ["app/p/[id]/page.tsx", "app/p/[id]/[slug]/page.tsx", "app/p/[id]/producto/[productId]/page.tsx"]) {
    assert.match(readFileSync(path.join(process.cwd(), route), "utf8"), /await getPublishedSite\(id\)/, route)
  }
})

async function artifactStatus(siteId: string): Promise<number | "next"> {
  const { NextRequest } = await import("next/server")
  const proxy = (await import("../../proxy")).default
  const response = await proxy(new NextRequest(new URL(`http://localhost/published-sites/${siteId}/index.html`)))
  return response.headers.get("x-middleware-next") === "1" ? "next" : response.status
}

test("MODERATION: /published-sites files are served only for existing, published, unmoderated sites", async () => {
  reset()
  assert.equal(await artifactStatus("site_live"), "next")
  assert.equal(await artifactStatus("site_draft"), 404, "unpublished")
  assert.equal(await artifactStatus("site_deleted_long_ago"), 404, "a deleted site's leftover HTML is never served")
  assert.equal(await artifactStatus("bad%2F..%2Fid"), 404)
  await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido" })
  assert.equal(await artifactStatus("site_live"), 404)
  await moderate({ siteId: "site_live", action: "REACTIVATE", reason: "Corregido" })
  assert.equal(await artifactStatus("site_live"), "next")
  const { config } = await import("../../proxy")
  assert.ok(config.matcher.includes("/published-sites/:path*"))
})

async function checkout(siteId: string) {
  const route = await import("../../app/api/store/[siteId]/checkout/route")
  const request = new Request(`http://localhost/api/store/${siteId}/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerEmail: "buyer@example.test", items: [{ variantId: "variant_1", quantity: 1 }] }),
  })
  return route.POST(request, { params: Promise.resolve({ siteId }) })
}

test("MODERATION: a suspended store takes no checkout and fires no automation", async () => {
  reset()
  await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Fraude reportado" })
  const response = await checkout("site_live")
  assert.equal(response.status, 423)
  assert.equal(((await response.json()) as { error: string }).error, "STORE_UNAVAILABLE")
  assert.equal(ctx.automations.length, 0)
})

async function contact(siteId: string) {
  const route = await import("../../app/api/contacto/route")
  return route.POST(new Request("http://localhost/api/contacto", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": `10.0.0.${Math.floor(Math.random() * 200) + 1}` },
    body: JSON.stringify({ nombre: "Cliente", email: "cliente@example.test", mensaje: "Hola", siteId }),
  }))
}

test("MODERATION: a suspended site's contact form stores nothing and triggers no automation", async () => {
  reset()
  const active = await contact("site_live")
  assert.equal(active.status, 200)
  assert.equal(ctx.contacts.length, 1)
  assert.equal(ctx.automations.length, 1)
  assert.equal((await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Spam masivo" })).success, true)
  const blocked = await contact("site_live")
  assert.equal(blocked.status, 423)
  assert.equal(ctx.contacts.length, 1)
  assert.equal(ctx.automations.length, 1)
})

/* ---------------------------- owner surfaces ----------------------------- */

async function publishError(siteId: string, actor: { userId: string; role: "ADMIN" | "CLIENT" }) {
  const { publishSiteForActor } = await import("../../lib/site-publication")
  try {
    await publishSiteForActor({ siteId, actor })
    return null
  } catch (error) {
    return error as { code?: string; message: string }
  }
}

test("MODERATION: nobody publishes a suspended site; the route answers 423 with the reason to show", async () => {
  reset()
  assert.notEqual((await publishError("site_live", { userId: OWNER, role: "CLIENT" }))?.code, "SITE_MODERATED")
  await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido" })
  for (const actor of [{ userId: OWNER, role: "CLIENT" as const }, { userId: ADMIN, role: "ADMIN" as const }]) {
    const error = await publishError("site_live", actor)
    assert.equal(error?.code, "SITE_MODERATED", actor.role)
  }
  // A stranger is still refused for ownership first (no state leak).
  assert.equal((await publishError("site_live", { userId: STRANGER, role: "CLIENT" }))?.code, "FORBIDDEN")
  assert.match(readFileSync(path.join(process.cwd(), "app/api/editor/[id]/publish/route.ts"), "utf8"), /"SITE_MODERATED"\s*\?\s*423/)
})

test("MODERATION: the owner cannot delete a suspended or terminated site; active sites delete as before", async () => {
  reset()
  const { deleteSiteForRole } = await auth()
  await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Contenido prohibido" })
  await assert.rejects(deleteSiteForRole("site_live", OWNER, "CLIENT"), /suspendido o terminado/)
  await assert.rejects(deleteSiteForRole("site_live", ADMIN, "ADMIN"), /suspendido o terminado/, "no purge from the product")
  await assert.rejects(deleteSiteForRole("site_live", STRANGER, "CLIENT"), /No se encontro el sitio/, "a stranger learns nothing about the state")
  assert.ok(ctx.sites.has("site_live"))
  await moderate({ siteId: "site_live", action: "TERMINATE", reason: "Reincidencia", confirmSiteId: "site_live" })
  await assert.rejects(deleteSiteForRole("site_live", OWNER, "CLIENT"), /suspendido o terminado/)
  assert.deepEqual(await deleteSiteForRole("site_draft", OWNER, "CLIENT"), { count: 1 })
})

test("MODERATION: TERMINATE blocks every surface; only an admin reactivates it, with a reason", async () => {
  reset()
  const { getPublishedSite } = await auth()
  await moderate({ siteId: "site_live", action: "TERMINATE", reason: "Uso fraudulento", confirmSiteId: "site_live" })
  assert.equal(await state(), "terminated")
  assert.equal(await getPublishedSite("site_live"), null)
  assert.equal(await artifactStatus("site_live"), 404)
  assert.equal((await checkout("site_live")).status, 423)
  assert.equal((await contact("site_live")).status, 423)
  assert.equal((await publishError("site_live", { userId: OWNER, role: "CLIENT" }))?.code, "SITE_MODERATED")
  ctx.session = { user: { id: OWNER, role: "CLIENT" } }
  assert.equal((await (await actions()).moderateSiteAction({ siteId: "site_live", action: "REACTIVATE", reason: "Quiero volver" })).success, false)
  ctx.session = null
  assert.equal((await moderate({ siteId: "site_live", action: "SUSPEND", reason: "Bajar a suspensión" })).success, false, "a terminated site is only reactivated")
  assert.equal((await moderate({ siteId: "site_live", action: "REACTIVATE", reason: "" })).success, false)
  const reactivated = await moderate({ siteId: "site_live", action: "REACTIVATE", reason: "Revisión aprobada" })
  assert.equal(reactivated.success, true)
  assert.ok(await getPublishedSite("site_live"))
  assert.deepEqual(ctx.audit.map((row) => [row.action, row.metadata?.previousState]), [["TERMINATE", "active"], ["REACTIVATE", "terminated"]])
})

test("MODERATION: the editor stays open (notice only) and the dashboard stops offering publish-related links", () => {
  const editor = readFileSync(path.join(process.cwd(), "app/editor/[id]/page.impl.tsx"), "utf8")
  assert.match(editor, /ownerModerationNotice\(moderation\)/)
  assert.match(editor, /<EditorExperienceShell \/>/)
  assert.doesNotMatch(editor, /moderation[^\n]*(notFound|redirect)\(|(notFound|redirect)\([^\n]*moderation/)
  const dashboard = readFileSync(path.join(process.cwd(), "app/dashboard/page.impl.tsx"), "utf8")
  assert.match(dashboard, /const isPublic = site\.published && !moderationNotice/)
  assert.match(dashboard, /\{!moderationNotice && <DeleteSiteButton/)
})

/* --------------------------------- email --------------------------------- */

test("MODERATION: WARNING emails the owner with every value escaped and records the outcome", async () => {
  reset()
  const result = await moderate({ siteId: "site_live", action: "WARNING", reason: "Quita el banner \"gratis\" & el sorteo" })
  assert.equal(result.success, true)
  assert.equal(ctx.emails.length, 1)
  const [email] = ctx.emails
  assert.equal(email.to, "owner@example.test")
  assert.equal(email.subject, "Aviso sobre tu sitio en Orvenix")
  assert.match(email.html, /Taller &lt;b&gt;Uno&lt;\/b&gt;/)
  assert.match(email.html, /Ana &lt;script&gt;x&lt;\/script&gt;/)
  assert.match(email.html, /Quita el banner &quot;gratis&quot; &amp; el sorteo/)
  assert.doesNotMatch(email.html, /<script>|<b>Uno/)
  assert.equal(ctx.audit[0].metadata?.email, "sent")
  assert.equal(await state(), "active")
  const { escapeHtml } = await import("../../lib/email")
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;")
})

function findSources(pattern: RegExp): string[] {
  const hits: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(path.join(process.cwd(), dir))) {
      const rel = path.join(dir, entry)
      if (statSync(path.join(process.cwd(), rel)).isDirectory()) walk(rel)
      else if (/\.(ts|tsx|mjs)$/.test(entry) && pattern.test(readFileSync(path.join(process.cwd(), rel), "utf8"))) hits.push(rel)
    }
  }
  for (const dir of ["app", "lib", "scripts", "prisma"]) walk(dir)
  return hits
}

test.after(() => {
  ModuleInternals._load = originalLoad
  ModuleInternals._resolveFilename = originalResolveFilename
})
