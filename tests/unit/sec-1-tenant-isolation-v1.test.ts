import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"

/**
 * SEC-1 (SEC0-01 / SEC0-02): adversarial two-tenant fixtures against the REAL
 * product and variant route handlers + the real `canManageSite`, over an
 * in-memory store (no DB). Proves both the HTTP result and that the other
 * tenant's persistent state is unchanged.
 */

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

type Site = { id: string; userId: string }
type Product = { id: string; siteId: string; name: string; status: string; description: string; media: unknown; metadata: unknown }
type Variant = { id: string; productId: string; sku: string; name: string; priceMxn: number; stock: number; comparePriceMxn?: number | null; attributes: unknown }

const db = {
  sites: [] as Site[],
  products: [] as Product[],
  variants: [] as Variant[],
}
let currentUser: { id: string; role: string; email: string } | null = null
let nextId = 1

function seed() {
  db.sites = [{ id: "site_A", userId: "user_A" }, { id: "site_B", userId: "user_B" }]
  db.products = [
    { id: "prod_A", siteId: "site_A", name: "Product A", status: "active", description: "secret A", media: [], metadata: {} },
    { id: "prod_B", siteId: "site_B", name: "Product B", status: "active", description: "secret B", media: [], metadata: {} },
  ]
  db.variants = [
    { id: "var_A", productId: "prod_A", sku: "SKU-A-1", name: "A1", priceMxn: 50000, stock: 7, attributes: {} },
    { id: "var_B", productId: "prod_B", sku: "SKU-B-1", name: "B1", priceMxn: 90000, stock: 3, attributes: {} },
  ]
}

const snapshot = () => JSON.stringify(db)

function productMatches(product: Product, where: Record<string, unknown>) {
  if (where.id !== undefined && product.id !== where.id) return false
  if (where.siteId !== undefined && product.siteId !== where.siteId) return false
  return true
}

function variantMatches(variant: Variant, where: Record<string, unknown>) {
  if (where.id !== undefined && variant.id !== where.id) return false
  if (where.productId !== undefined && variant.productId !== where.productId) return false
  const productWhere = where.product as { siteId?: string } | undefined
  if (productWhere?.siteId !== undefined) {
    const product = db.products.find((entry) => entry.id === variant.productId)
    if (!product || product.siteId !== productWhere.siteId) return false
  }
  return true
}

function withVariants(product: Product) {
  return { ...product, variants: db.variants.filter((variant) => variant.productId === product.id) }
}

const fakePrisma = {
  editorWebsite: {
    findFirst: async ({ where }: { where: { id: string; userId?: string } }) =>
      db.sites.find((site) => site.id === where.id && (where.userId === undefined || site.userId === where.userId)) ?? null,
  },
  product: {
    findFirst: async ({ where, include }: { where: Record<string, unknown>; include?: Record<string, unknown> }) => {
      const product = db.products.find((entry) => productMatches(entry, where))
      if (!product) return null
      return include?.variants ? withVariants(product) : { ...product }
    },
    updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<Product> }) => {
      const matches = db.products.filter((entry) => productMatches(entry, where))
      for (const product of matches) Object.assign(product, data)
      return { count: matches.length }
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const before = db.products.length
      db.products = db.products.filter((entry) => !productMatches(entry, where))
      return { count: before - db.products.length }
    },
    update: async () => {
      throw new Error("unscoped product.update must not be used")
    },
    delete: async () => {
      throw new Error("unscoped product.delete must not be used")
    },
  },
  productVariant: {
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const variant = db.variants.find((entry) => variantMatches(entry, where))
      return variant ? { id: variant.id } : null
    },
    create: async ({ data }: { data: Omit<Variant, "id"> }) => {
      const variant = { id: `var_new_${nextId++}`, ...data } as Variant
      db.variants.push(variant)
      return variant
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<Variant> }) => {
      const variant = db.variants.find((entry) => entry.id === where.id)
      if (!variant) throw new Error("not found")
      Object.assign(variant, data)
      return variant
    },
    delete: async ({ where }: { where: { id: string } }) => {
      db.variants = db.variants.filter((entry) => entry.id !== where.id)
    },
  },
  $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
}

const originalLoad = (Module as unknown as { _load: (...args: unknown[]) => unknown })._load
;(Module as unknown as { _load: (...args: unknown[]) => unknown })._load = function load(request: unknown, parent: unknown, isMain: unknown) {
  if (request === "@/lib/editor-db") return { editorPrisma: fakePrisma }
  if (request === "@/lib/auth-session") return { getAuthSession: async () => (currentUser ? { user: currentUser } : null) }
  if (request === "@/lib/plan-guard") {
    return {
      requireEcommercePlan: async () => undefined,
      getUserPlanAccess: async () => ({ isActive: true, plan: null }),
    }
  }
  return originalLoad.call(this, request, parent, isMain)
}

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>

async function loadRoutes() {
  const product = (await import("../../app/api/store/[siteId]/products/[productId]/route")) as unknown as Record<string, Handler>
  const variant = (await import("../../app/api/store/[siteId]/products/[productId]/variants/[variantId]/route")) as unknown as Record<string, Handler>
  return { product, variant }
}

function call(handler: Handler, method: string, params: Record<string, string>, body?: unknown) {
  const request = new Request("http://localhost/api/test", {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return handler(request, { params: Promise.resolve(params) })
}

function as(userId: string | null) {
  currentUser = userId ? { id: userId, role: "CLIENT", email: `${userId}@example.com` } : null
}

async function assertNoLeak(response: Response, forbidden: string[]) {
  const text = await response.text()
  for (const secret of forbidden) assert.equal(text.includes(secret), false, `response leaked ${secret}: ${text}`)
}

test("PATCH product: owner can update own product (A→A, B→B)", async () => {
  seed()
  const { product } = await loadRoutes()
  as("user_A")
  const resA = await call(product.PATCH, "PATCH", { siteId: "site_A", productId: "prod_A" }, { name: "A renamed" })
  assert.equal(resA.status, 200)
  assert.equal(((await resA.json()) as { product: Product }).product.name, "A renamed")
  as("user_B")
  const resB = await call(product.PATCH, "PATCH", { siteId: "site_B", productId: "prod_B" }, { status: "archived" })
  assert.equal(resB.status, 200)
  assert.equal(db.products.find((entry) => entry.id === "prod_B")?.status, "archived")
})

test("SEC0-01: B cannot PATCH Product A through Site B (and A cannot PATCH B through Site A)", async () => {
  seed()
  const { product } = await loadRoutes()
  const before = snapshot()

  as("user_B")
  const res = await call(product.PATCH, "PATCH", { siteId: "site_B", productId: "prod_A" }, { name: "pwned", status: "archived", metadata: { x: 1 } })
  assert.equal(res.status, 404)
  await assertNoLeak(res, ["secret A", "SKU-A-1", "Product A", "50000"])

  as("user_A")
  const reverse = await call(product.PATCH, "PATCH", { siteId: "site_A", productId: "prod_B" }, { name: "pwned" })
  assert.equal(reverse.status, 404)
  await assertNoLeak(reverse, ["secret B", "SKU-B-1", "Product B"])

  assert.equal(snapshot(), before, "no tenant state changed")
})

test("SEC0-01: B cannot use Site A in the URL at all; anonymous is rejected", async () => {
  seed()
  const { product } = await loadRoutes()
  const before = snapshot()
  as("user_B")
  assert.equal((await call(product.PATCH, "PATCH", { siteId: "site_A", productId: "prod_A" }, { name: "pwned" })).status, 403)
  as(null)
  assert.equal((await call(product.PATCH, "PATCH", { siteId: "site_A", productId: "prod_A" }, { name: "pwned" })).status, 401)
  assert.equal(snapshot(), before)
})

test("foreign and non-existent products are indistinguishable (both 404, same body)", async () => {
  seed()
  const { product } = await loadRoutes()
  as("user_B")
  const foreign = await call(product.PATCH, "PATCH", { siteId: "site_B", productId: "prod_A" }, { name: "x" })
  const missing = await call(product.PATCH, "PATCH", { siteId: "site_B", productId: "prod_does_not_exist" }, { name: "x" })
  assert.equal(foreign.status, missing.status)
  assert.deepEqual(await foreign.json(), await missing.json())
})

test("SEC0-02: B cannot create a simple variant under Product A through Site B", async () => {
  seed()
  const { product } = await loadRoutes()
  const before = snapshot()
  as("user_B")
  const res = await call(product.PUT, "PUT", { siteId: "site_B", productId: "prod_A" }, { sku: "EVIL-1", name: "evil", priceMxn: 1, stock: 9999 })
  assert.equal(res.status, 404)
  await assertNoLeak(res, ["SKU-A-1", "secret A"])
  assert.equal(db.variants.filter((variant) => variant.productId === "prod_A").length, 1, "zero foreign variant rows")
  assert.equal(snapshot(), before)
})

test("SEC0-02: B cannot create matrix variants under Product A through Site B", async () => {
  seed()
  const { product } = await loadRoutes()
  const before = snapshot()
  as("user_B")
  const res = await call(product.PUT, "PUT", { siteId: "site_B", productId: "prod_A" }, {
    _action: "generate_variant_matrix", dimensionsText: "Talla: S, M", skuPrefix: "EVIL", priceMxn: 1,
  })
  assert.equal(res.status, 404)
  assert.equal(snapshot(), before)
})

test("legitimate simple and matrix variant creation still work for the owner", async () => {
  seed()
  const { product } = await loadRoutes()
  as("user_A")
  const simple = await call(product.PUT, "PUT", { siteId: "site_A", productId: "prod_A" }, { sku: "SKU-A-2", name: "A2", priceMxn: 51000, stock: 2 })
  assert.equal(simple.status, 201)
  const matrix = await call(product.PUT, "PUT", { siteId: "site_A", productId: "prod_A" }, {
    _action: "generate_variant_matrix", dimensionsText: "Talla: S, M", skuPrefix: "A", priceMxn: 52000,
  })
  assert.equal(matrix.status, 201)
  assert.equal(((await matrix.json()) as { variants: Variant[] }).variants.length, 2)
  assert.equal(db.variants.filter((variant) => variant.productId === "prod_A").length, 4)
  assert.ok(db.variants.filter((variant) => variant.productId === "prod_A").every((variant) => variant.productId === "prod_A"))
  assert.equal(db.variants.filter((variant) => variant.productId === "prod_B").length, 1, "Product B untouched")
})

test("DELETE product is tenant-scoped too", async () => {
  seed()
  const { product } = await loadRoutes()
  const before = snapshot()
  as("user_B")
  assert.equal((await call(product.DELETE, "DELETE", { siteId: "site_B", productId: "prod_A" })).status, 404)
  assert.equal(snapshot(), before)
  as("user_A")
  assert.equal((await call(product.DELETE, "DELETE", { siteId: "site_A", productId: "prod_A" })).status, 200)
  assert.equal(db.products.some((entry) => entry.id === "prod_A"), false)
  assert.equal(db.products.some((entry) => entry.id === "prod_B"), true)
})

test("variant PATCH/DELETE: cross-tenant combinations are NOT_FOUND; owner path works", async () => {
  seed()
  const { variant } = await loadRoutes()
  const before = snapshot()
  as("user_B")
  for (const params of [
    { siteId: "site_B", productId: "prod_A", variantId: "var_A" },
    { siteId: "site_B", productId: "prod_B", variantId: "var_A" },
  ]) {
    assert.equal((await call(variant.PATCH, "PATCH", params, { priceMxn: 1 })).status, 404)
    assert.equal((await call(variant.DELETE, "DELETE", params)).status, 404)
  }
  assert.equal(snapshot(), before)
  as("user_A")
  const ok = await call(variant.PATCH, "PATCH", { siteId: "site_A", productId: "prod_A", variantId: "var_A" }, { stock: 9 })
  assert.equal(ok.status, 200)
  assert.equal(db.variants.find((entry) => entry.id === "var_A")?.stock, 9)
})

test("authz helpers fail closed on blank/oversized ids without touching the store", async () => {
  seed()
  const authz = await import("../../lib/authz")
  assert.deepEqual(await authz.requireSiteProduct("site_A", ""), { ok: false, status: 404, code: "NOT_FOUND" })
  assert.deepEqual(await authz.requireSiteProduct("site_A", "x".repeat(500)), { ok: false, status: 404, code: "NOT_FOUND" })
  assert.deepEqual(await authz.requireSiteProduct("site_A", { id: "prod_A" }), { ok: false, status: 404, code: "NOT_FOUND" })
  assert.deepEqual(await authz.requireManagedSite({ id: "user_A", role: "CLIENT" }, ""), { ok: false, status: 403, code: "FORBIDDEN" })
  assert.deepEqual(await authz.requireManagedSite({ id: "user_A", role: "CLIENT" }, "site_B"), { ok: false, status: 403, code: "FORBIDDEN" })
  const ok = await authz.requireSiteProduct("site_A", "prod_A")
  assert.deepEqual(ok, { ok: true, value: { productId: "prod_A", siteId: "site_A" } })
  // ADMIN keeps the existing canManageSite policy.
  assert.equal((await authz.requireManagedSite({ id: "admin", role: "ADMIN" }, "site_B")).ok, true)
})
