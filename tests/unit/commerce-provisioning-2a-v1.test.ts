import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import fs from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(
  request: unknown,
  parent: unknown,
  isMain: unknown,
  options: unknown,
) {
  if (typeof request === "string" && request.startsWith("@/generated/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), request.slice(2)), parent, isMain, options)
  }
  if (typeof request === "string" && request.startsWith("@/")) {
    const compiledPath = path.join(process.cwd(), ".tmp/unit", request.slice(2))
    if (fs.existsSync(`${compiledPath}.js`)) return `${compiledPath}.js`
    return originalResolveFilename.call(this, compiledPath, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

// COMMERCE-2A: zero Anthropic / Pexels / Mercado Pago / network, and ZERO real
// DB: editorPrisma's `$transaction`/`aiGenerationJob` are replaced by an
// in-memory, transactional fake (same pattern as
// site-creation-preview-persistence.test.ts) BEFORE the real preview-service
// runs. Credentials are only deleted, never read.
delete process.env.ANTHROPIC_API_KEY
delete process.env.PEXELS_API_KEY

let networkAttempts = 0
globalThis.fetch = (async () => {
  networkAttempts += 1
  throw new Error("COMMERCE-2A test: network is forbidden")
}) as typeof fetch

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { runAutonomousMultiPageSiteBuilder } from "../../lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "../../lib/orvenix-ai/autonomous/types"
import { validateSiteCreationPlanV2, type SiteCreationPlanV2 } from "../../lib/orvenix-ai/site-creation/plan-v2"
import { validateEditorTreeSafety } from "../../lib/orvenix-ai/safety"
import {
  buildCommerceProvisioningPlanV1,
  validateSiteCreationPlanV2CommerceV1,
  type CommerceProvisioningPlanV1,
} from "../../lib/orvenix-ai/commerce/provisioning-plan"
import {
  CommerceProvisioningErrorV1,
  executeCommerceProvisioningV1,
  loadExistingStoreBindingV1,
  readOrvenixProvisioningMetadataV1,
  type CommerceProvisioningRepositoryV1,
  type ProvisionedProductCandidateV1,
} from "../../lib/orvenix-ai/commerce/provisioning-executor"
import { bindProvisionedCommerceIntoPlanV1, countPendingProvisioningCardsV1 } from "../../lib/orvenix-ai/commerce/provisioning-binding"
import { createPrismaCommerceProvisioningRepositoryV1 } from "../../lib/commerce/prisma-commerce-provisioning-repository"
import { bindStoreProductRecordsV1, type StoreProductRecordV1 } from "../../lib/orvenix-ai/commerce/product-facts"
import { buildStoreCheckoutBaseItemsV1, StoreCheckoutSchemaV1 } from "../../lib/commerce/checkout-pricing"
import { normalizeSiteCreationBusiness } from "../../lib/orvenix-ai/site-creation/business-normalization"
import {
  buildNovaMarketBuilderInputBaseV1,
  buildNovaMarketNewStorePreviewInputV1,
} from "../../lib/orvenix-ai/assisted-generation/e2e/comparison-harness"
import { NOVAMARKET_CATEGORIES_V1, NOVAMARKET_PRODUCTS_V1 } from "../../lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture"
import { ProductCard } from "../../components/editor/blocks/store/ProductCard"
import type { OrvenixSiteCreationActionInput } from "../../app/actions/ai"
import { getPlanEntitlements } from "../../lib/billing/plan-entitlements"
import type { EditorNode, EditorTree } from "../../types/editor"

// ---------------------------------------------------------------- in-memory transactional Prisma fake

type Row = Record<string, unknown> & { id: string }

function cloneMap<T>(map: Map<string, T>) {
  return new Map(Array.from(map.entries()).map(([key, value]) => [key, structuredClone(value)]))
}

function createHarness({ failOnProductCreate = 0 } = {}) {
  const jobs = new Map<string, Row>()
  const websites = new Map<string, Row>()
  const pages = new Map<string, Row>()
  const themes = new Map<string, Row>()
  const products = new Map<string, Row>()
  const variants = new Map<string, Row>()
  let productCounter = 0
  let variantCounter = 0
  let productCreates = 0

  function tx() {
    return {
      $queryRaw: async () => [],
      subscription: {
        findUnique: async () => ({
          status: "active",
          plan: { id: "pro", name: "pro", maxWebsites: 10, maxVisits: 10000, hasEcommerce: true, hasAI: true, hasExport: true },
        }),
      },
      editorWebsite: {
        count: async ({ where }: { where: { userId: string } }) => Array.from(websites.values()).filter((site) => site.userId === where.userId).length,
        findUnique: async ({ where }: { where: { id: string } }) => structuredClone(websites.get(where.id) ?? null),
        create: async ({ data }: { data: Row }) => {
          websites.set(data.id, structuredClone(data))
          return structuredClone(data)
        },
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const site = websites.get(where.id)
          if (!site) throw new Error("site not found")
          websites.set(where.id, { ...site, ...structuredClone(data) })
          return structuredClone(websites.get(where.id))
        },
      },
      sitePage: {
        create: async ({ data }: { data: Row }) => {
          const page: Row = { ...structuredClone(data), id: `page_${pages.size + 1}` }
          pages.set(`${page.siteId}:${page.slug}`, page)
          return page
        },
        update: async ({ where, data }: { where: { siteId_slug: { siteId: string; slug: string } }; data: Record<string, unknown> }) => {
          const key = `${where.siteId_slug.siteId}:${where.siteId_slug.slug}`
          const current = pages.get(key)
          if (!current) throw new Error(`SitePage no encontrada: ${key}`)
          pages.set(key, { ...current, ...structuredClone(data) })
          return pages.get(key)
        },
        findMany: async ({ where }: { where: { siteId: string } }) =>
          Array.from(pages.values()).filter((page) => page.siteId === where.siteId).sort((a, b) => String(a.slug).localeCompare(String(b.slug))).map((page) => structuredClone(page)),
        findFirst: async ({ where }: { where: { siteId: string; slug: string } }) => structuredClone(pages.get(`${where.siteId}:${where.slug}`) ?? null),
      },
      siteTheme: {
        upsert: async ({ where, create, update }: { where: { siteId: string }; create: Row; update: { tokens: unknown } }) => {
          const theme = themes.get(where.siteId) ? { ...themes.get(where.siteId)!, tokens: update.tokens } : structuredClone(create)
          themes.set(where.siteId, theme)
          return theme
        },
        findUnique: async ({ where }: { where: { siteId: string } }) => structuredClone(themes.get(where.siteId) ?? null),
      },
      product: {
        findMany: async ({ where, include, select }: { where: { siteId: string }; include?: { variants?: boolean }; select?: { variants?: unknown } }) =>
          Array.from(products.values())
            .filter((product) => product.siteId === where.siteId)
            .map((product) => ({
              ...structuredClone(product),
              ...(include?.variants || select?.variants ? { variants: Array.from(variants.values()).filter((variant) => variant.productId === product.id).map((variant) => structuredClone(variant)) } : {}),
            })),
        create: async ({ data }: { data: Record<string, unknown> }) => {
          productCreates += 1
          if (failOnProductCreate && productCreates === failOnProductCreate) throw new Error("simulated product insert failure")
          if (!websites.has(String(data.siteId))) throw new Error("FK violation: site does not exist")
          productCounter += 1
          const id = `cm2a_prod_${String(productCounter).padStart(4, "0")}`
          products.set(id, { ...structuredClone(data), id })
          return { id }
        },
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const product = products.get(where.id)
          if (!product) throw new Error("product not found")
          products.set(where.id, { ...product, ...structuredClone(data) })
          return products.get(where.id)
        },
      },
      productVariant: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          if (!products.has(String(data.productId))) throw new Error("FK violation: product does not exist")
          variantCounter += 1
          const id = `cm2a_var_${String(variantCounter).padStart(4, "0")}`
          variants.set(id, { ...structuredClone(data), id })
          return { id }
        },
      },
      aiGenerationJob: {
        findUnique: async ({ where }: { where: { id: string } }) => structuredClone(jobs.get(where.id) ?? null),
        updateMany: async ({ where, data }: { where: { id: string; type: string; status: string }; data: Record<string, unknown> }) => {
          const job = jobs.get(where.id)
          if (!job || job.type !== where.type || job.status !== where.status) return { count: 0 }
          jobs.set(where.id, { ...job, ...structuredClone(data), updatedAt: new Date() })
          return { count: 1 }
        },
        deleteMany: async () => ({ count: 0 }),
        create: async ({ data }: { data: Row }) => {
          const job = { ...structuredClone(data), createdAt: new Date(), updatedAt: new Date() }
          jobs.set(job.id, job)
          return job
        },
        upsert: async ({ where, create, update }: { where: { id: string }; create: Row; update: Record<string, unknown> }) => {
          const existing = jobs.get(where.id)
          const next = existing ? { ...existing, ...structuredClone(update), updatedAt: new Date() } : { ...structuredClone(create), createdAt: new Date(), updatedAt: new Date() }
          jobs.set(where.id, next)
          return next
        },
      },
    }
  }

  const stores = { jobs, websites, pages, themes, products, variants }
  const prisma = {
    aiGenerationJob: tx().aiGenerationJob,
    $transaction: async <T>(callback: (client: ReturnType<typeof tx>) => Promise<T>) => {
      const backups = Object.fromEntries(Object.entries(stores).map(([key, map]) => [key, cloneMap(map)])) as Record<keyof typeof stores, Map<string, Row>>
      try {
        return await callback(tx())
      } catch (error) {
        for (const [key, map] of Object.entries(stores) as Array<[keyof typeof stores, Map<string, Row>]>) {
          map.clear()
          backups[key].forEach((value, entryKey) => map.set(entryKey, value))
        }
        throw error
      }
    },
  }
  return { prisma, tx, ...stores, setFailOnProductCreate: (value: number) => { failOnProductCreate = value; productCreates = 0 } }
}

async function installHarness(harness: ReturnType<typeof createHarness>) {
  const editorDb = await import("../../lib/editor-db")
  const prisma = editorDb.editorPrisma as unknown as Record<string, unknown>
  prisma.aiGenerationJob = harness.prisma.aiGenerationJob
  prisma.$transaction = harness.prisma.$transaction
}

// ---------------------------------------------------------------- helpers

function orderedNodes(tree: EditorTree, rootId = tree.rootId): EditorNode[] {
  const out: EditorNode[] = []
  const walk = (id: string) => {
    const node = tree.nodes[id] as EditorNode | undefined
    if (!node) return
    out.push(node)
    for (const child of node.children) walk(child)
  }
  walk(rootId)
  return out
}

function cardsOf(tree: EditorTree) {
  return orderedNodes(tree).filter((node) => node.type === "store-product-card")
}

/** Approved-structure fingerprint: everything except the cart shell subtree and the execution binding props. */
function structuralShape(tree: EditorTree) {
  const root = tree.nodes[tree.rootId] as EditorNode
  const shellIds = new Set(root.children.filter((id) => orderedNodes(tree, id).some((node) => node.type === "store-cart-drawer")))
  return root.children
    .filter((id) => !shellIds.has(id))
    .flatMap((id) => orderedNodes(tree, id))
    .map((node) => {
      const { productId: _p, variantId: _v, provisioningRef: _r, ...props } = node.props as Record<string, unknown>
      void _p
      void _v
      void _r
      return { type: node.type, props, children: node.children.length }
    })
}

let attemptCounter = 0

async function persistPreview(harness: ReturnType<typeof createHarness>, run: AutonomousMultiPageSiteBuilderResult) {
  await installHarness(harness)
  const service = await import("../../lib/orvenix-ai/site-creation/preview-service")
  attemptCounter += 1
  const attempt = await service.reserveSiteCreationPreviewAttempt({ userId: "user_1", clientAttemptKey: `client:commerce-2a-${attemptCounter}` })
  const validation = validateSiteCreationPlanV2(run.plan, { maxPages: 12, maxBytes: 1_000_000 })
  assert.equal(validation.ok, true)
  if (!validation.ok) throw new Error("invalid plan")
  const preview = await service.completeSiteCreationPreviewAttempt({
    userId: "user_1",
    previewId: attempt.id,
    previewHash: validation.planHash,
    request: "Crea una tienda en linea para NovaMarket",
    business: { name: "NovaMarket" },
    plan: validation.plan,
  })
  return { service, preview, previewHash: validation.planHash, approvedPlan: validation.plan }
}

class InMemoryProvisioningRepository implements CommerceProvisioningRepositoryV1 {
  products: Array<{ id: string; siteId: string; name: string; description: string; metadata: unknown; status: string }> = []
  variants: Array<{ id: string; productId: string; sku: string; name: string; priceMxn: number; comparePriceMxn?: number; stock: number }> = []
  writes = 0
  async findProvisionedProducts({ siteId, previewId }: { siteId: string; previewId: string }): Promise<ProvisionedProductCandidateV1[]> {
    return this.products.flatMap((product) => {
      const meta = readOrvenixProvisioningMetadataV1(product.metadata)
      return product.siteId === siteId && meta?.previewId === previewId
        ? [{ productId: product.id, siteId: product.siteId, sourceIndex: meta.sourceIndex, variants: meta.variants, ownedVariantIds: this.variants.filter((variant) => variant.productId === product.id).map((variant) => variant.id) }]
        : []
    })
  }
  async createProduct(params: { siteId: string; name: string; description: string; metadata: unknown }) {
    this.writes += 1
    const id = `mem_prod_${this.products.length + 1}`
    this.products.push({ id, status: "active", ...structuredClone(params) })
    return { id }
  }
  async createVariant(params: { productId: string; sku: string; name: string; priceMxn: number; comparePriceMxn?: number; stock: number }) {
    this.writes += 1
    const id = `mem_var_${this.variants.length + 1}`
    this.variants.push({ id, ...structuredClone(params) })
    return { id }
  }
  async updateProductMetadata({ productId, metadata }: { productId: string; metadata: unknown }) {
    this.writes += 1
    const product = this.products.find((entry) => entry.id === productId)!
    product.metadata = structuredClone(metadata)
  }
  async loadStoreProducts(siteId: string): Promise<StoreProductRecordV1[]> {
    return this.products.filter((product) => product.siteId === siteId).map((product) => ({
      ...product,
      variants: this.variants.filter((variant) => variant.productId === product.id).map((variant) => ({ ...variant, comparePriceMxn: variant.comparePriceMxn ?? null })),
    }))
  }
}

// ---------------------------------------------------------------- 1) provisioning plan

test("plan: NovaMarket new-store facts -> deterministic, bounded, validated plan traced to source indexes", () => {
  const products = buildNovaMarketBuilderInputBaseV1().business.products
  const first = buildCommerceProvisioningPlanV1(products)!
  const second = buildCommerceProvisioningPlanV1(products)!
  assert.deepEqual(first, second, "deterministic")
  assert.equal(first.products.length, 24)
  assert.deepEqual(validateSiteCreationPlanV2CommerceV1({ version: 1, provisioning: first }), [])
  assert.deepEqual(first.products[0], {
    sourceIndex: 0,
    name: "Tablet Nova 10",
    description: "Tablet de 10 pulgadas para lectura, video y trabajo ligero.",
    category: "Tecnología",
    variants: [
      { variantIndex: 0, label: "64 GB", sku: "NM-001-64", priceMxn: 549900, comparePriceMxn: 629900, initialStock: 25 },
      { variantIndex: 1, label: "128 GB", sku: "NM-001-128", priceMxn: 649900, initialStock: 25 },
    ],
  })
  assert.equal(first.products[1].variants[0].sku, "ORV-002-1", "missing SKU gets a deterministic fallback")
  assert.equal(JSON.stringify(first).includes("http"), false)
})

test("plan: all-or-nothing -- any product without a grounded price, or any bound product, yields no plan", () => {
  assert.equal(buildCommerceProvisioningPlanV1([{ name: "Con precio", variants: [{ label: "U", priceMxn: 100, availability: "in_stock" }] }, { name: "Sin precio" }]), null)
  assert.equal(buildCommerceProvisioningPlanV1([{ name: "Bound", storeBinding: { productId: "p" }, variants: [{ label: "U", priceMxn: 100, availability: "in_stock", variantId: "v" }] }]), null)
  assert.equal(buildCommerceProvisioningPlanV1([]), null)
})

test("plan V2 boundary: malformed commerce blocks are rejected (extra keys, stock, sku, index, price)", () => {
  const good = buildCommerceProvisioningPlanV1(buildNovaMarketBuilderInputBaseV1().business.products)!
  const mutate = (fn: (plan: CommerceProvisioningPlanV1) => void) => {
    const plan = structuredClone(good)
    fn(plan)
    return validateSiteCreationPlanV2CommerceV1({ version: 1, provisioning: plan })
  }
  assert.ok(mutate((plan) => { (plan.products[0] as Record<string, unknown>).productId = "x" }).length > 0)
  assert.ok(mutate((plan) => { plan.products[0].variants[0].initialStock = -1 }).length > 0)
  assert.ok(mutate((plan) => { plan.products[1].variants[0].sku = plan.products[0].variants[0].sku }).length > 0)
  assert.ok(mutate((plan) => { plan.products[1].sourceIndex = 7 }).length > 0)
  assert.ok(mutate((plan) => { plan.products[0].variants[0].priceMxn = 12.5 }).length > 0)
  assert.ok(mutate((plan) => { (plan.products[0].variants[0] as Record<string, unknown>).variantId = "v" }).length > 0)
})

// ---------------------------------------------------------------- 2) preview is side-effect free and non-executable

test("NovaMarket PREVIEW: 24 presentation/pending products, 0 executable cards, 0 ids, hash-covered plan, 0 store writes", async () => {
  const harness = createHarness()
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  assert.equal(run.plan.commerce?.provisioning.products.length, 24)
  const catalog = run.plan.pages.find((page) => page.slug === "productos")!
  const cards = cardsOf(catalog.tree)
  assert.equal(cards.length, 24)
  for (const card of cards) {
    assert.equal("productId" in card.props, false)
    assert.equal("variantId" in card.props, false)
    assert.match(String(card.props.provisioningRef), /^orv-prov:\d+:\d+$/)
  }
  const serialized = JSON.stringify(run.plan)
  assert.equal(/"productId"|"variantId"|demo-v1|nm-mock-/.test(serialized), false, "no fake/demo/mock ids in the preview")
  for (const page of run.plan.pages) assert.equal(orderedNodes(page.tree).some((node) => node.type === "store-cart-drawer"), false, "no cart shell in preview")
  const pendingCardCount = countPendingProvisioningCardsV1(run.plan)
  assert.ok(pendingCardCount >= cards.length + cardsOf(run.plan.pages.find((page) => page.isHome)!.tree).length)
  assert.equal(run.plan.pages.flatMap((page) => cardsOf(page.tree)).length, pendingCardCount, "all pending commerce cards remain hash-covered in the approved plan")

  const { previewHash, approvedPlan } = await persistPreview(harness, run)
  assert.equal(harness.products.size, 0, "preview persistence wrote no Product")
  assert.equal(harness.variants.size, 0, "preview persistence wrote no ProductVariant")
  assert.equal(harness.websites.size, 0)

  // The commerce intent is inside the hashed plan: changing it changes the hash.
  const tampered = structuredClone(approvedPlan)
  tampered.commerce!.provisioning.products[0].variants[0].priceMxn = 1
  const tamperedValidation = validateSiteCreationPlanV2(tampered, { maxPages: 12, maxBytes: 1_000_000 })
  assert.ok(tamperedValidation.ok && tamperedValidation.planHash !== previewHash)
})

test("preview without the trusted intent (or non-ecommerce) carries no commerce plan -- COMMERCE-1 presentation unchanged", async () => {
  const presentation = await runAutonomousMultiPageSiteBuilder(buildNovaMarketBuilderInputBaseV1())
  assert.equal(presentation.plan.commerce, undefined)
  assert.equal(presentation.plan.pages.flatMap((page) => orderedNodes(page.tree)).some((node) => node.type.startsWith("store-")), false)

  const agency = await runAutonomousMultiPageSiteBuilder({
    request: "Crea un sitio para una agencia",
    business: { name: "Agencia 2A", industry: "agencia de marketing", services: [{ name: "Estrategia" }] },
    forceFreshComposition: true,
    commerceProvisioning: { mode: "new_store" },
  })
  assert.equal(agency.plan.commerce, undefined)
})

test("pending card renders the existing ProductCard NON-executable (no add-to-cart)", () => {
  const html = renderToStaticMarkup(createElement(ProductCard, { provisioningRef: "orv-prov:0:0", productName: "Tablet Nova 10", priceMxn: 549900 }))
  assert.ok(html.includes('data-store-card-state="pending"'))
  assert.equal(html.includes("Añadir al carrito"), false)
})

// ---------------------------------------------------------------- 3) confirm: real execute path with the transactional fake

test("NovaMarket CONFIRM: products+variants provisioned in the site transaction, authoritative ids bound, same approved architecture", async () => {
  const harness = createHarness()
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const { service, preview, previewHash, approvedPlan } = await persistPreview(harness, run)

  const result = await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash })
  assert.equal(result.siteId, preview.reservedSiteId)

  // 24 products, one variant row per planned variant, all owned by the new site, active, category persisted.
  const plannedVariantCount = approvedPlan.commerce!.provisioning.products.reduce((sum, product) => sum + product.variants.length, 0)
  assert.equal(harness.products.size, 24)
  assert.equal(harness.variants.size, plannedVariantCount)
  for (const product of harness.products.values()) {
    assert.equal(product.siteId, preview.reservedSiteId)
    assert.equal(product.status, "active")
    assert.deepEqual(product.media, [])
    const meta = readOrvenixProvisioningMetadataV1(product.metadata)!
    assert.equal(meta.previewId, preview.id)
    const expectedLabel = NOVAMARKET_CATEGORIES_V1.find((category) => category.slug === NOVAMARKET_PRODUCTS_V1[meta.sourceIndex].category)!.name
    assert.equal((product.metadata as { category?: string }).category, expectedLabel, "category persisted in Product.metadata.category")
  }

  // Final persisted trees: every card bound to ids RETURNED BY the fake persistence (never synthetic/mock).
  const finalPages = new Map(Array.from(harness.pages.values()).map((page) => [String(page.slug), page]))
  assert.deepEqual([...finalPages.keys()].sort(), approvedPlan.pages.map((page) => page.slug).sort(), "same page universe")
  for (const approvedPage of approvedPlan.pages) {
    const finalTree = finalPages.get(approvedPage.slug)!.tree as EditorTree
    const finalCards = cardsOf(finalTree)
    assert.equal(finalCards.length, cardsOf(approvedPage.tree).length, `${approvedPage.slug}: same product selection`)
    for (const card of finalCards) {
      assert.equal(card.props.provisioningRef, undefined)
      const variant = harness.variants.get(String(card.props.variantId))
      assert.ok(variant, `variant ${String(card.props.variantId)} exists in the store`)
      assert.equal(variant.productId, card.props.productId, "variant belongs to the bound product")
      assert.match(String(card.props.productId), /^cm2a_prod_\d{4}$/)
    }
    assert.deepEqual(finalCards.map((card) => card.props.productName), cardsOf(approvedPage.tree).map((card) => card.props.productName), `${approvedPage.slug}: same product order/grouping`)
    assert.deepEqual(structuralShape(finalTree), structuralShape(approvedPage.tree), `${approvedPage.slug}: approved architecture preserved`)
    const drawers = orderedNodes(finalTree).filter((node) => node.type === "store-cart-drawer").length
    assert.equal(drawers, finalCards.length > 0 ? 1 : 0, `${approvedPage.slug}: one cart shell when there are cards`)
    assert.equal(validateEditorTreeSafety(finalTree).safe, true)
  }
  const homeTree = finalPages.get("home")!.tree
  assert.deepEqual(harness.websites.get(preview.reservedSiteId)!.tree, homeTree, "site-level tree equals the bound home page")
  assert.equal(harness.jobs.get(preview.id)!.status, "consumed")
})

test("replay: executing the consumed preview again returns the same site and creates NO duplicate products", async () => {
  const harness = createHarness()
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const { service, preview, previewHash } = await persistPreview(harness, run)
  const first = await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash })
  const productsAfterFirst = harness.products.size
  const second = await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash })
  assert.deepEqual(second, first)
  assert.equal(harness.products.size, productsAfterFirst)
})

test("atomicity: product #2 insert fails -> site, pages, theme, products, variants all rolled back; retry succeeds with exactly 24", async () => {
  const harness = createHarness({ failOnProductCreate: 2 })
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const { service, preview, previewHash } = await persistPreview(harness, run)

  await assert.rejects(service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash }))
  assert.equal(harness.websites.size, 0)
  assert.equal(harness.pages.size, 0)
  assert.equal(harness.themes.size, 0)
  assert.equal(harness.products.size, 0)
  assert.equal(harness.variants.size, 0)
  assert.equal(harness.jobs.get(preview.id)!.status, "completed", "preview stays confirmable")

  harness.setFailOnProductCreate(0)
  await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash })
  assert.equal(harness.products.size, 24)
})

test("integrity: a persisted preview whose commerce plan was altered no longer matches the confirmed hash", async () => {
  const harness = createHarness()
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const { service, preview, previewHash } = await persistPreview(harness, run)
  const job = harness.jobs.get(preview.id)!
  const input = job.input as { plan: SiteCreationPlanV2 }
  input.plan.commerce!.provisioning.products[0].variants[0].priceMxn = 1
  await assert.rejects(service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash }), /no coincide/)
  assert.equal(harness.products.size, 0)
})

test("confirm guards: ecommerce entitlement is re-checked before provisioning, inside the transaction", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/orvenix-ai/site-creation/preview-service.ts"), "utf8")
  const guard = source.indexOf("commerceProvisioning && !canUseEcommerce(access.plan?.id)")
  const provision = source.indexOf("executeCommerceProvisioningV1({")
  const transaction = source.indexOf("editorPrisma.$transaction(async (tx) => {")
  assert.ok(transaction > 0 && guard > transaction && provision > guard)
  assert.ok(source.includes("createPrismaCommerceProvisioningRepositoryV1(tx)"), "repository is bound to the site-creation transaction client")
})

// ---------------------------------------------------------------- 4) executor idempotency (pure, in-memory repository)

test("executor idempotency: partial prior provisioning for the same preview is completed, never duplicated; duplicates fail closed", async () => {
  const plan = buildCommerceProvisioningPlanV1(buildNovaMarketBuilderInputBaseV1().business.products)!
  const repository = new InMemoryProvisioningRepository()
  const first = await executeCommerceProvisioningV1({ repository, siteId: "site_a", previewId: "prev_1", plan: { ...plan, products: plan.products.slice(0, 5) } })
  assert.equal(first.createdProducts, 5)

  const full = await executeCommerceProvisioningV1({ repository, siteId: "site_a", previewId: "prev_1", plan })
  assert.equal(full.reusedProducts, 5)
  assert.equal(full.createdProducts, 19)
  assert.equal(repository.products.length, 24)

  const again = await executeCommerceProvisioningV1({ repository, siteId: "site_a", previewId: "prev_1", plan })
  assert.equal(again.createdProducts, 0)
  assert.equal(repository.products.length, 24)

  // Another preview for the same site is a different key: it provisions its own rows.
  const otherPreview = await executeCommerceProvisioningV1({ repository, siteId: "site_a", previewId: "prev_2", plan: { ...plan, products: plan.products.slice(0, 1) } })
  assert.equal(otherPreview.createdProducts, 1)

  repository.products.push({ ...structuredClone(repository.products[0]), id: "dup_prod" })
  await assert.rejects(executeCommerceProvisioningV1({ repository, siteId: "site_a", previewId: "prev_1", plan }), CommerceProvisioningErrorV1)
})

test("binder: fails closed on unresolved references; binds only ids returned by provisioning", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  assert.throws(() => bindProvisionedCommerceIntoPlanV1(run.plan, []), /Falta el producto/)
  const repository = new InMemoryProvisioningRepository()
  const provisioned = await executeCommerceProvisioningV1({ repository, siteId: "site_b", previewId: "prev_b", plan: run.plan.commerce!.provisioning })
  const finalPlan = bindProvisionedCommerceIntoPlanV1(run.plan, provisioned.products)
  assert.equal(countPendingProvisioningCardsV1(finalPlan), 0)
  const ids = new Set(repository.variants.map((variant) => variant.id))
  for (const page of finalPlan.pages) for (const card of cardsOf(page.tree)) assert.ok(ids.has(String(card.props.variantId)))
  assert.equal(validateSiteCreationPlanV2(finalPlan, { maxPages: 12, maxBytes: 1_000_000 }).ok, true)
})

// ---------------------------------------------------------------- 5) existing store binding

test("existing store: loads only that site's rows, binds via COMMERCE-1 without creating anything; category round-trips", async () => {
  const repository = new InMemoryProvisioningRepository()
  const plan = buildCommerceProvisioningPlanV1(buildNovaMarketBuilderInputBaseV1().business.products)!
  await executeCommerceProvisioningV1({ repository, siteId: "site_store", previewId: "prev_s", plan })
  await executeCommerceProvisioningV1({ repository, siteId: "site_other", previewId: "prev_o", plan: { ...plan, products: plan.products.slice(0, 2) } })
  const writesBefore = repository.writes

  const binding = await loadExistingStoreBindingV1(repository, "site_store")
  assert.equal(binding.records.length, 24)
  assert.ok(binding.records.every((record) => record.siteId === "site_store"))
  assert.equal(bindStoreProductRecordsV1("site_store", binding.records)[0].category, "Tecnología")

  const run = await runAutonomousMultiPageSiteBuilder({ ...buildNovaMarketNewStorePreviewInputV1(), commerceStore: binding })
  assert.equal(run.plan.commerce, undefined, "an existing store never gets a new-store provisioning plan")
  const cards = run.plan.pages.flatMap((page) => cardsOf(page.tree))
  const storeProductIds = new Set(repository.products.filter((product) => product.siteId === "site_store").map((product) => product.id))
  assert.ok(cards.length > 0 && cards.every((card) => storeProductIds.has(String(card.props.productId))))
  assert.equal(repository.writes, writesBefore, "no duplicate Product rows")
})

test("Prisma repository adapter: mirrors store CRUD conventions against a transaction client (fake, no DB)", async () => {
  const harness = createHarness()
  const client = harness.tx()
  await client.editorWebsite.create({ data: { id: "site_p", userId: "u", name: "n", description: "", tree: {}, published: false } })
  const repository = createPrismaCommerceProvisioningRepositoryV1(client as never)
  const plan = buildCommerceProvisioningPlanV1([{ name: "Taza", category: "Hogar", variants: [{ label: "Blanca", priceMxn: 19900, comparePriceMxn: 24900, availability: "in_stock", initialStock: 4 }] }])!
  const result = await executeCommerceProvisioningV1({ repository, siteId: "site_p", previewId: "prev_p", plan })
  const product = harness.products.get(result.products[0].productId)!
  assert.deepEqual({ type: product.type, status: product.status, media: product.media, category: (product.metadata as { category: string }).category }, { type: "physical", status: "active", media: [], category: "Hogar" })
  const variant = harness.variants.get(result.products[0].variants[0].variantId)!
  assert.deepEqual({ sku: variant.sku, name: variant.name, priceMxn: variant.priceMxn, comparePriceMxn: variant.comparePriceMxn, stock: variant.stock, attributes: variant.attributes }, { sku: "ORV-001-1", name: "Blanca", priceMxn: 19900, comparePriceMxn: 24900, stock: 4, attributes: {} })
  const [candidate] = await repository.findProvisionedProducts({ siteId: "site_p", previewId: "prev_p" })
  assert.deepEqual(
    { productId: candidate.productId, sourceIndex: candidate.sourceIndex, variants: candidate.variants, siteId: candidate.siteId, ownedVariantIds: candidate.ownedVariantIds },
    { ...result.products[0], siteId: "site_p", ownedVariantIds: [result.products[0].variants[0].variantId] },
  )
})

// ---------------------------------------------------------------- 6) customer trust boundary

test("customer input: product facts are accepted, ids/bindings/provisioning fields are stripped", () => {
  const normalized = normalizeSiteCreationBusiness({
    name: "Tienda",
    products: [{
      name: "Taza",
      category: "Hogar",
      variants: [{ label: "Blanca", priceMxn: 19900, initialStock: 3, variantId: "forged", stock: 999 } as never],
      productId: "forged",
      storeBinding: { productId: "forged" },
      pendingProvisioning: { sourceIndex: 0, variantIndex: 0 },
      provisioningRef: "orv-prov:0:0",
    } as never],
  }, "Crea una tienda")
  assert.deepEqual(normalized.products, [{ name: "Taza", description: "", category: "Hogar", variants: [{ label: "Blanca", priceMxn: 19900, availability: "in_stock", initialStock: 3 }] }])
  assert.equal(JSON.stringify(normalized).includes("forged"), false)
})

test("customer input: the public action type has no store id / binding / provisioning / provider field (type-level + source)", () => {
  const withBinding: OrvenixSiteCreationActionInput = {
    message: "x",
    // @ts-expect-error -- no trusted store binding on the public action.
    commerceStore: { siteId: "s", records: [] },
  }
  const withIntent: OrvenixSiteCreationActionInput = {
    message: "x",
    // @ts-expect-error -- the provisioning intent is server-decided, never a payload field.
    commerceProvisioning: { mode: "new_store" },
  }
  const withVariantId: OrvenixSiteCreationActionInput = {
    message: "x",
    // @ts-expect-error -- product facts cannot carry store ids.
    business: { products: [{ name: "Taza", variants: [{ label: "U", priceMxn: 1, variantId: "v" }] }] },
  }
  void withBinding
  void withIntent
  void withVariantId

  const source = fs.readFileSync(path.join(process.cwd(), "app/actions/ai.ts"), "utf8")
  assert.equal(source.includes("commerceStore"), false)
  assert.ok(source.includes('...(commerceProvisioningAllowed ? { commerceProvisioning: { mode: "new_store" as const } } : {})'))
  assert.ok(/commerceProvisioningAllowed = Boolean\(access\?\.isActive && canUseEcommerce\(access\.plan\?\.id\)\)/.test(source))
})

// ---------------------------------------------------------------- 7) checkout authority regression on provisioned rows

test("checkout stays DB-authoritative for provisioned rows (display card price is not the charge)", async () => {
  const repository = new InMemoryProvisioningRepository()
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const provisioned = await executeCommerceProvisioningV1({ repository, siteId: "site_c", previewId: "prev_c", plan: run.plan.commerce!.provisioning })
  const finalPlan = bindProvisionedCommerceIntoPlanV1(run.plan, provisioned.products)
  const card = cardsOf(finalPlan.pages.find((page) => page.slug === "productos")!.tree)[0]
  const dbVariant = repository.variants.find((variant) => variant.id === card.props.variantId)!
  const parsed = StoreCheckoutSchemaV1.parse({ customerEmail: "c@example.com", items: [{ variantId: dbVariant.id, quantity: 1, priceMxn: 1 }] })
  const pricing = buildStoreCheckoutBaseItemsV1({
    siteId: "site_c",
    requestedItems: parsed.items,
    variants: [{ id: dbVariant.id, productId: dbVariant.productId, name: dbVariant.name, sku: dbVariant.sku, priceMxn: dbVariant.priceMxn, stock: dbVariant.stock, product: { name: "x", siteId: "site_c", status: "active" } }],
  })
  assert.ok(pricing.ok)
  if (pricing.ok) assert.equal(pricing.totalMxn, 549900)
})

// ---------------------------------------------------------------- 8) FINAL TRUST + TRANSACTION REVIEW

test("review/runtime: hostile public payload -> only bounded facts survive into the provisioning plan", async () => {
  const hostile = {
    name: "Tienda hostil",
    plan: "enterprise",
    hasEcommerce: true,
    commerceStore: { siteId: "victim", records: [] },
    commerceProvisioning: { mode: "new_store" },
    repository: { createProduct: () => { throw new Error("must never be called") } },
    products: [{
      name: "Taza",
      description: "Ceramica",
      category: "Hogar",
      productId: "forged_p", storeBinding: { productId: "forged_p" }, pendingProvisioning: { sourceIndex: 5, variantIndex: 2 },
      provisioningRef: "orv-prov:5:2", sourceIndex: 5, previewId: "forged_prev", siteId: "victim",
      status: "draft", metadata: { orvenixProvisioning: { version: 1, previewId: "forged_prev", sourceIndex: 0, variants: [] } }, mode: "existing",
      variants: [{
        label: "Blanca", priceMxn: 19900, comparePriceMxn: 24900, initialStock: 3, sku: "TAZA-B",
        variantId: "forged_v", variantIndex: 7, stock: 999, attributes: { color: "<script>" }, productId: "forged_p",
      }],
    }],
  }
  const business = normalizeSiteCreationBusiness(hostile as never, "Crea una tienda")
  assert.deepEqual(business.products, [{
    name: "Taza", description: "Ceramica", category: "Hogar",
    variants: [{ label: "Blanca", priceMxn: 19900, comparePriceMxn: 24900, availability: "in_stock", sku: "TAZA-B", initialStock: 3 }],
  }])
  assert.equal("commerceStore" in business || "commerceProvisioning" in business || "repository" in business || "plan" in business, false)

  const run = await runAutonomousMultiPageSiteBuilder({
    request: "Crea una tienda en linea",
    business: { name: business.name, industry: "tienda en linea", products: business.products },
    forceFreshComposition: true,
    commerceProvisioning: { mode: "new_store" },
  })
  const planText = JSON.stringify(run.plan)
  for (const forbidden of ["forged", "victim", "<script>", "\"status\"", "\"attributes\"", "\"metadata\""]) assert.equal(planText.includes(forbidden), false, forbidden)
  assert.deepEqual(run.plan.commerce?.provisioning.products, [{
    sourceIndex: 0, name: "Taza", description: "Ceramica", category: "Hogar",
    variants: [{ variantIndex: 0, label: "Blanca", sku: "TAZA-B", priceMxn: 19900, comparePriceMxn: 24900, initialStock: 3 }],
  }])
})

test("review/bounds: prices, compare price, stock, sku, strings and counts are bounded at runtime", () => {
  const normalize = (variant: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
    normalizeSiteCreationBusiness({ products: [{ name: "P", ...extra, variants: [{ label: "V", ...variant } as never] }] } as never, "x").products?.[0]
  assert.equal(normalize({ priceMxn: -1 })?.variants, undefined, "negative price dropped")
  assert.equal(normalize({ priceMxn: 0 })?.variants, undefined, "zero price dropped")
  assert.equal(normalize({ priceMxn: 1.5 })?.variants, undefined, "non-integer cents dropped")
  assert.equal(normalize({ priceMxn: 1_000_000_001 })?.variants, undefined, "above maxPriceMxn dropped")
  assert.equal(normalize({ priceMxn: Number.MAX_SAFE_INTEGER })?.variants, undefined)
  assert.equal(normalize({ priceMxn: 1000, comparePriceMxn: 900 })?.variants?.[0].comparePriceMxn, undefined, "compare <= price dropped")
  assert.equal(normalize({ priceMxn: 1000, initialStock: -5 })?.variants?.[0].initialStock, undefined, "negative stock dropped -> plan uses 0")
  assert.equal(normalize({ priceMxn: 1000, initialStock: 1_000_001 })?.variants?.[0].initialStock, undefined)
  assert.equal(normalize({ priceMxn: 1000, initialStock: 2.5 })?.variants?.[0].initialStock, undefined)

  const unsafeSku = buildCommerceProvisioningPlanV1([{ name: "P", variants: [{ label: "V", priceMxn: 1000, availability: "in_stock", sku: "bad sku; DROP" }] }])!
  assert.equal(unsafeSku.products[0].variants[0].sku, "ORV-001-1", "unsafe SKU replaced by deterministic fallback")
  const dupSku = buildCommerceProvisioningPlanV1([
    { name: "A", variants: [{ label: "V", priceMxn: 1000, availability: "in_stock", sku: "SAME" }] },
    { name: "B", variants: [{ label: "V", priceMxn: 1000, availability: "in_stock", sku: "SAME" }] },
  ])!
  assert.deepEqual(dupSku.products.map((product) => product.variants[0].sku), ["SAME", "ORV-002-1"])

  const long = normalizeSiteCreationBusiness({ products: [{ name: "N".repeat(500), description: "D".repeat(5000), category: "C".repeat(500), variants: [{ label: "L".repeat(500), priceMxn: 100 }] }] } as never, "x").products![0]
  assert.equal(long.name.length, 90)
  assert.equal(long.description.length, 180)
  assert.ok((long.category ?? "").length <= 60)
  assert.ok(long.variants![0].label.length <= 60)

  const many = normalizeSiteCreationBusiness({ products: Array.from({ length: 50 }, (_, index) => ({ name: `P${index}`, variants: Array.from({ length: 20 }, (_, v) => ({ label: `V${v}`, priceMxn: 100 })) })) } as never, "x").products!
  assert.equal(many.length, 8, "explicit products capped at 8")
  assert.ok(many.every((product) => (product.variants?.length ?? 0) <= 8), "variants capped at 8")
})

test("review/entitlement: confirm independently re-checks ecommerce inside the transaction (revoked -> no site, no products)", async () => {
  const harness = createHarness()
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const { service, preview, previewHash } = await persistPreview(harness, run)
  const entitlements = getPlanEntitlements("pro")!
  const original = entitlements.features.ecommerce
  ;(entitlements.features as { ecommerce: string }).ecommerce = "none"
  try {
    await assert.rejects(service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash }), (error: Error) => /ecommerce|e-commerce|tienda/i.test(error.message))
  } finally {
    ;(entitlements.features as { ecommerce: string }).ecommerce = original
  }
  assert.equal(harness.websites.size, 0)
  assert.equal(harness.products.size, 0)
  assert.equal(harness.jobs.get(preview.id)!.status, "completed")
})

test("review/entitlement: preview plan read uses ONLY the authenticated session user and fails closed", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/actions/ai.ts"), "utf8")
  const start = source.indexOf("let commerceProvisioningAllowed = false;")
  const block = source.slice(start, source.indexOf("let generated:", start))
  assert.ok(block.includes("await getUserPlanAccess(session.user.id);"))
  assert.equal((block.match(/getUserPlanAccess\(/g) ?? []).length, 1)
  assert.ok(block.includes("canUseEcommerce(access.plan?.id)") && block.includes("access?.isActive"))
  assert.ok(block.includes("commerceProvisioningAllowed = false; // fail closed"))
  const sessionGuard = source.indexOf('if (!session?.user?.id) {', source.indexOf("export async function runOrvenixSiteCreationAction"))
  assert.ok(sessionGuard > 0 && sessionGuard < start, "unauthenticated requests return before any plan read")
})

test("review/transaction: every confirm read/write uses the interactive tx client -- global editorPrisma models are never touched", async () => {
  const harness = createHarness()
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const { service, preview, previewHash } = await persistPreview(harness, run)

  const editorDb = await import("../../lib/editor-db")
  const globalClient = editorDb.editorPrisma as unknown as Record<string, unknown>
  const escaped: string[] = []
  const tripwire = (model: string) => new Proxy({}, { get: (_target, method) => () => { escaped.push(`${model}.${String(method)}`); throw new Error(`global editorPrisma.${model} used during confirm`) } })
  const saved: Record<string, unknown> = {}
  for (const model of ["product", "productVariant", "editorWebsite", "sitePage", "siteTheme", "subscription"]) {
    saved[model] = globalClient[model]
    globalClient[model] = tripwire(model)
  }
  try {
    await service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash })
  } finally {
    for (const [model, value] of Object.entries(saved)) globalClient[model] = value
  }
  assert.deepEqual(escaped, [])
  assert.equal(harness.products.size, 24)
  assert.equal(harness.jobs.get(preview.id)!.status, "consumed")

  const adapterSource = fs.readFileSync(path.join(process.cwd(), "lib/commerce/prisma-commerce-provisioning-repository.ts"), "utf8")
  assert.equal(/editor-db|editorPrisma/.test(adapterSource.replace(/\/\*[\s\S]*?\*\//g, "")), false, "adapter only uses the injected client")
})

test("review/idempotency: forged or inconsistent provisioning metadata fails closed, never binds another product's variant", async () => {
  const plan = buildCommerceProvisioningPlanV1([
    { name: "A", variants: [{ label: "A1", priceMxn: 100, availability: "in_stock", initialStock: 1 }] },
    { name: "B", variants: [{ label: "B1", priceMxn: 200, availability: "in_stock", initialStock: 1 }] },
  ])!
  const seed = async () => {
    const repository = new InMemoryProvisioningRepository()
    await executeCommerceProvisioningV1({ repository, siteId: "site_x", previewId: "prev_x", plan: { ...plan, products: plan.products.slice(0, 1) } })
    // an unrelated manual product on the same site (owner CRUD can write arbitrary metadata)
    repository.products.push({ id: "manual_prod", siteId: "site_x", name: "Manual", description: "", status: "active", metadata: {} })
    repository.variants.push({ id: "manual_var", productId: "manual_prod", sku: "M", name: "M", priceMxn: 1, stock: 5 })
    return repository
  }
  const forge = (repository: InMemoryProvisioningRepository, metadata: unknown) => { repository.products.find((product) => product.id === "manual_prod")!.metadata = metadata }

  // 1) manual product claims sourceIndex 1 but maps a variant that belongs to ANOTHER product
  let repository = await seed()
  forge(repository, { orvenixProvisioning: { version: 1, previewId: "prev_x", sourceIndex: 1, variants: [{ variantIndex: 0, variantId: repository.variants[0].id }] } })
  await assert.rejects(executeCommerceProvisioningV1({ repository, siteId: "site_x", previewId: "prev_x", plan }), /no pertenece/)

  // 2) duplicate claim for an existing sourceIndex
  repository = await seed()
  forge(repository, { orvenixProvisioning: { version: 1, previewId: "prev_x", sourceIndex: 0, variants: [{ variantIndex: 0, variantId: "manual_var" }] } })
  await assert.rejects(executeCommerceProvisioningV1({ repository, siteId: "site_x", previewId: "prev_x", plan }), /duplicado/)

  // 3) incomplete / unexpected variant mapping
  repository = await seed()
  forge(repository, { orvenixProvisioning: { version: 1, previewId: "prev_x", sourceIndex: 1, variants: [] } })
  await assert.rejects(executeCommerceProvisioningV1({ repository, siteId: "site_x", previewId: "prev_x", plan }), /incompleto o inesperado/)

  // 4) sourceIndex outside the approved plan
  repository = await seed()
  forge(repository, { orvenixProvisioning: { version: 1, previewId: "prev_x", sourceIndex: 9, variants: [{ variantIndex: 0, variantId: "manual_var" }] } })
  await assert.rejects(executeCommerceProvisioningV1({ repository, siteId: "site_x", previewId: "prev_x", plan }), /fuera del plan/)

  // 5) another preview id / another site never matches (a new product is created instead)
  repository = await seed()
  forge(repository, { orvenixProvisioning: { version: 1, previewId: "prev_other", sourceIndex: 1, variants: [{ variantIndex: 0, variantId: "manual_var" }] } })
  const result = await executeCommerceProvisioningV1({ repository, siteId: "site_x", previewId: "prev_x", plan })
  assert.equal(result.createdProducts, 1)
  assert.notEqual(result.products[1].productId, "manual_prod")

  // 6) a correctly owned, complete mapping IS reused (exact site + preview + sourceIndex + owned variants)
  repository = await seed()
  forge(repository, { orvenixProvisioning: { version: 1, previewId: "prev_x", sourceIndex: 1, variants: [{ variantIndex: 0, variantId: "manual_var" }] } })
  const reused = await executeCommerceProvisioningV1({ repository, siteId: "site_x", previewId: "prev_x", plan })
  assert.equal(reused.reusedProducts, 2)
  assert.equal(reused.products[1].productId, "manual_prod")

  // 7) a candidate from another site is rejected even if a repository returned it
  const leaky: CommerceProvisioningRepositoryV1 = {
    ...new InMemoryProvisioningRepository(),
    findProvisionedProducts: async () => [{ productId: "p", siteId: "other_site", sourceIndex: 0, variants: [{ variantIndex: 0, variantId: "v" }], ownedVariantIds: ["v"] }],
  } as never
  await assert.rejects(executeCommerceProvisioningV1({ repository: leaky, siteId: "site_x", previewId: "prev_x", plan }), /otro sitio/)
})

const HASH_MUTATIONS: Array<[string, (plan: SiteCreationPlanV2) => void]> = [
  ["price", (plan) => { plan.commerce!.provisioning.products[0].variants[0].priceMxn += 1 }],
  ["compare price", (plan) => { plan.commerce!.provisioning.products[0].variants[0].comparePriceMxn = 999_999 }],
  ["initial stock", (plan) => { plan.commerce!.provisioning.products[0].variants[0].initialStock = 999 }],
  ["sku", (plan) => { plan.commerce!.provisioning.products[0].variants[0].sku = "TAMPERED-SKU" }],
  ["category", (plan) => { plan.commerce!.provisioning.products[0].category = "Gaming" }],
  ["product order/source index", (plan) => { const products = plan.commerce!.provisioning.products; [products[0], products[1]] = [products[1], products[0]] }],
  ["variant order/index", (plan) => { const variants = plan.commerce!.provisioning.products[0].variants; [variants[0], variants[1]] = [variants[1], variants[0]] }],
]

for (const [field, mutate] of HASH_MUTATIONS) {
  test(`review/hash: mutating the approved ${field} invalidates the preview (confirm rejects, 0 products)`, async () => {
    const harness = createHarness()
    const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
    const { service, preview, previewHash, approvedPlan } = await persistPreview(harness, run)

    const mutated = structuredClone(approvedPlan)
    mutate(mutated)
    const validation = validateSiteCreationPlanV2(mutated, { maxPages: 12, maxBytes: 1_000_000 })
    assert.ok(!validation.ok || validation.planHash !== previewHash, `${field}: hash must change or plan must be invalid`)

    ;(harness.jobs.get(preview.id)!.input as { plan: SiteCreationPlanV2 }).plan = mutated
    await assert.rejects(service.createDraftSiteFromPersistedPreview({ userId: "user_1", previewId: preview.id, expectedPreviewHash: previewHash }))
    assert.equal(harness.products.size, 0)
    assert.equal(harness.websites.size, 0)
  })
}

test("review/binder: only card binding props + one cart shell change; every other node and prop is byte-identical", async () => {
  const run = await runAutonomousMultiPageSiteBuilder(buildNovaMarketNewStorePreviewInputV1())
  const repository = new InMemoryProvisioningRepository()
  const provisioned = await executeCommerceProvisioningV1({ repository, siteId: "site_bind", previewId: "prev_bind", plan: run.plan.commerce!.provisioning })
  const approved = validateSiteCreationPlanV2(run.plan, { maxPages: 12, maxBytes: 1_000_000 })
  assert.ok(approved.ok)
  if (!approved.ok) return
  const finalPlan = bindProvisionedCommerceIntoPlanV1(approved.plan, provisioned.products)

  assert.deepEqual({ ...finalPlan, pages: undefined }, { ...approved.plan, pages: undefined }, "identity/theme/navigation/quality/commerce unchanged")
  for (const [index, page] of finalPlan.pages.entries()) {
    const before = approved.plan.pages[index]
    assert.deepEqual({ slug: page.slug, name: page.name, isHome: page.isHome, seo: page.seo }, { slug: before.slug, name: before.name, isHome: before.isHome, seo: before.seo })
    const beforeRoot = before.tree.nodes[before.tree.rootId]
    const afterRoot = page.tree.nodes[page.tree.rootId]
    const added = Object.keys(page.tree.nodes).filter((id) => !(id in before.tree.nodes))
    const shellCount = cardsOf(before.tree).length > 0 ? 4 : 0
    assert.equal(added.length, shellCount, `${page.slug}: only the 4 cart-shell nodes are added`)
    assert.deepEqual(afterRoot.children.filter((id) => !added.includes(id)), beforeRoot.children, `${page.slug}: section order unchanged`)
    const afterNodes = page.tree.nodes as Record<string, EditorNode>
    for (const [id, beforeNode] of Object.entries(before.tree.nodes as Record<string, EditorNode>)) {
      const afterNode = afterNodes[id]
      assert.ok(afterNode, `${page.slug}: node ${id} kept`)
      if (id === before.tree.rootId) {
        assert.deepEqual({ ...afterNode, children: [] }, { ...beforeNode, children: [] })
        continue
      }
      if (beforeNode.type === "store-product-card") {
        const { provisioningRef, ...beforeProps } = beforeNode.props as Record<string, unknown>
        const { productId, variantId, ...afterProps } = afterNode.props as Record<string, unknown>
        assert.deepEqual(afterProps, beforeProps, `${page.slug}: card props other than the binding are unchanged`)
        const ref = String(provisioningRef).split(":")
        const expected = provisioned.products.find((product) => product.sourceIndex === Number(ref[1]))!
        assert.equal(productId, expected.productId)
        assert.equal(variantId, expected.variants.find((variant) => variant.variantIndex === Number(ref[2]))!.variantId)
        assert.deepEqual({ ...afterNode, props: {} }, { ...beforeNode, props: {} })
      } else {
        assert.deepEqual(afterNode, beforeNode, `${page.slug}: node ${id} (${beforeNode.type}) byte-identical`)
      }
    }
  }
})

test("review/stock: omitted initialStock provisions stock 0 and checkout rejects buying it", async () => {
  const plan = buildCommerceProvisioningPlanV1([{ name: "Sin stock", variants: [{ label: "U", priceMxn: 1000, availability: "in_stock" }] }])!
  assert.equal(plan.products[0].variants[0].initialStock, 0)
  const repository = new InMemoryProvisioningRepository()
  const result = await executeCommerceProvisioningV1({ repository, siteId: "site_s", previewId: "prev_s", plan })
  const variant = repository.variants[0]
  assert.equal(variant.stock, 0)
  const pricing = buildStoreCheckoutBaseItemsV1({
    siteId: "site_s",
    requestedItems: [{ variantId: variant.id, quantity: 1 }],
    variants: [{ id: variant.id, productId: result.products[0].productId, name: "U", sku: variant.sku, priceMxn: 1000, stock: variant.stock, product: { name: "Sin stock", siteId: "site_s", status: "active" } }],
  })
  assert.deepEqual(pricing, { ok: false, error: "INSUFFICIENT_STOCK", variantId: variant.id })
})

test("zz) zero network attempts across the COMMERCE-2A suite", () => {
  assert.equal(networkAttempts, 0)
})
