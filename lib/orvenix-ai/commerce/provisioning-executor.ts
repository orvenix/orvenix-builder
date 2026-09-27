import {
  validateSiteCreationPlanV2CommerceV1,
  type CommerceProvisioningPlanV1,
} from "./provisioning-plan"
import type { StoreProductRecordV1 } from "./product-facts"

/**
 * COMMERCE-2A: turns an APPROVED CommerceProvisioningPlanV1 into real store
 * rows through a narrow repository (Prisma implementation:
 * lib/commerce/prisma-commerce-provisioning-repository.ts, always bound to
 * the site-creation transaction client; tests use an in-memory fake).
 *
 * Idempotency without a schema change: every provisioned Product carries
 * `metadata.orvenixProvisioning = { version, previewId, sourceIndex,
 * variants: [{ variantIndex, variantId }] }` (Product.metadata is an
 * existing Json column). A re-run for the same (siteId, previewId) reuses
 * every product already recorded for a sourceIndex and only creates the
 * missing ones -- never a second row for the same source product. Keys
 * are (previewId, sourceIndex), never names.
 *
 * `category` is persisted at `metadata.category`, the exact field COMMERCE-1's
 * bindStoreProductRecordsV1 already reads. Media stays `[]` (no asset
 * ingestion in this phase).
 */

export const ORVENIX_PROVISIONING_METADATA_VERSION_V1 = 1

export type ProvisionedVariantRefV1 = { variantIndex: number; variantId: string }

export type OrvenixProvisioningMetadataV1 = {
  version: typeof ORVENIX_PROVISIONING_METADATA_VERSION_V1
  previewId: string
  sourceIndex: number
  variants: ProvisionedVariantRefV1[]
}

export type ProvisionedProductMetadataV1 = {
  category?: string
  orvenixProvisioning: OrvenixProvisioningMetadataV1
}

export type ProvisionedProductRefV1 = {
  productId: string
  sourceIndex: number
  variants: ProvisionedVariantRefV1[]
}

/**
 * A candidate for reuse as read from the store: the metadata-claimed
 * mapping PLUS the facts the executor re-verifies it against (the row's
 * real siteId and the ids of the variants that REALLY belong to it).
 * Metadata alone is never trusted -- an owner can write arbitrary
 * Product.metadata through the existing store CRUD.
 */
export type ProvisionedProductCandidateV1 = ProvisionedProductRefV1 & {
  siteId: string
  ownedVariantIds: string[]
}

export interface CommerceProvisioningRepositoryV1 {
  /** Products of `siteId` whose metadata.orvenixProvisioning.previewId === previewId, with their real owned variant ids. */
  findProvisionedProducts(params: { siteId: string; previewId: string }): Promise<ProvisionedProductCandidateV1[]>
  createProduct(params: {
    siteId: string
    name: string
    description: string
    metadata: ProvisionedProductMetadataV1
  }): Promise<{ id: string }>
  createVariant(params: {
    productId: string
    sku: string
    name: string
    priceMxn: number
    comparePriceMxn?: number
    stock: number
  }): Promise<{ id: string }>
  updateProductMetadata(params: { productId: string; metadata: ProvisionedProductMetadataV1 }): Promise<void>
  /** EXISTING-store flow: every Product (+ variants) of exactly `siteId`. */
  loadStoreProducts(siteId: string): Promise<StoreProductRecordV1[]>
}

export type CommerceProvisioningResultV1 = {
  siteId: string
  products: ProvisionedProductRefV1[]
  createdProducts: number
  reusedProducts: number
}

export class CommerceProvisioningErrorV1 extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CommerceProvisioningErrorV1"
  }
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,191}$/

function assertId(value: unknown, what: string): string {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) throw new CommerceProvisioningErrorV1(`${what} invalido devuelto por el repositorio.`)
  return value
}

export function readOrvenixProvisioningMetadataV1(metadata: unknown): OrvenixProvisioningMetadataV1 | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const raw = (metadata as Record<string, unknown>).orvenixProvisioning
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const record = raw as Record<string, unknown>
  if (record.version !== ORVENIX_PROVISIONING_METADATA_VERSION_V1 || typeof record.previewId !== "string") return null
  if (!Number.isInteger(record.sourceIndex) || (record.sourceIndex as number) < 0) return null
  if (!Array.isArray(record.variants)) return null
  const variants: ProvisionedVariantRefV1[] = []
  for (const entry of record.variants) {
    if (!entry || typeof entry !== "object") return null
    const { variantIndex, variantId } = entry as Record<string, unknown>
    if (!Number.isInteger(variantIndex) || typeof variantId !== "string" || !ID_PATTERN.test(variantId)) return null
    variants.push({ variantIndex: variantIndex as number, variantId })
  }
  return { version: ORVENIX_PROVISIONING_METADATA_VERSION_V1, previewId: record.previewId, sourceIndex: record.sourceIndex as number, variants }
}

export async function executeCommerceProvisioningV1(params: {
  repository: CommerceProvisioningRepositoryV1
  siteId: string
  previewId: string
  plan: CommerceProvisioningPlanV1
}): Promise<CommerceProvisioningResultV1> {
  const siteId = assertId(params.siteId, "siteId")
  const previewId = assertId(params.previewId, "previewId")
  const planErrors = validateSiteCreationPlanV2CommerceV1({ version: 1, provisioning: params.plan })
  if (planErrors.length) throw new CommerceProvisioningErrorV1(`Plan de tienda invalido: ${planErrors.join(" ")}`)

  const plannedBySource = new Map(params.plan.products.map((product) => [product.sourceIndex, product]))
  const existing = await params.repository.findProvisionedProducts({ siteId, previewId })
  const existingBySource = new Map<number, ProvisionedProductCandidateV1>()
  const claimedVariantIds = new Set<string>()
  for (const candidate of existing) {
    // Re-verify EVERY reuse fact; any inconsistency fails closed (never "pick one").
    if (candidate.siteId !== siteId) throw new CommerceProvisioningErrorV1("Producto aprovisionado de otro sitio.")
    assertId(candidate.productId, "productId")
    if (existingBySource.has(candidate.sourceIndex)) {
      throw new CommerceProvisioningErrorV1(`Producto aprovisionado duplicado para sourceIndex ${candidate.sourceIndex}.`)
    }
    const planned = plannedBySource.get(candidate.sourceIndex)
    if (!planned) throw new CommerceProvisioningErrorV1(`Producto aprovisionado fuera del plan (sourceIndex ${candidate.sourceIndex}).`)

    const owned = new Set(candidate.ownedVariantIds)
    const mappedIndexes = candidate.variants.map((variant) => variant.variantIndex).sort((a, b) => a - b)
    const plannedIndexes = planned.variants.map((variant) => variant.variantIndex).sort((a, b) => a - b)
    if (mappedIndexes.join(",") !== plannedIndexes.join(",")) {
      throw new CommerceProvisioningErrorV1(`Mapeo de variantes incompleto o inesperado para sourceIndex ${candidate.sourceIndex}.`)
    }
    for (const variant of candidate.variants) {
      assertId(variant.variantId, "variantId")
      if (!owned.has(variant.variantId)) throw new CommerceProvisioningErrorV1("Una variante aprovisionada no pertenece a su producto.")
      if (claimedVariantIds.has(variant.variantId)) throw new CommerceProvisioningErrorV1("Una variante aprovisionada esta asignada mas de una vez.")
      claimedVariantIds.add(variant.variantId)
    }
    existingBySource.set(candidate.sourceIndex, candidate)
  }

  const results: ProvisionedProductRefV1[] = []
  let createdProducts = 0
  let reusedProducts = 0

  for (const planned of params.plan.products) {
    const reused = existingBySource.get(planned.sourceIndex)
    if (reused) {
      results.push({ productId: assertId(reused.productId, "productId"), sourceIndex: planned.sourceIndex, variants: reused.variants.map((variant) => ({ ...variant })) })
      reusedProducts += 1
      continue
    }

    const baseMetadata: ProvisionedProductMetadataV1 = {
      ...(planned.category ? { category: planned.category } : {}),
      orvenixProvisioning: { version: ORVENIX_PROVISIONING_METADATA_VERSION_V1, previewId, sourceIndex: planned.sourceIndex, variants: [] },
    }
    const product = await params.repository.createProduct({ siteId, name: planned.name, description: planned.description, metadata: baseMetadata })
    const productId = assertId(product.id, "productId")

    const variants: ProvisionedVariantRefV1[] = []
    for (const variant of planned.variants) {
      const created = await params.repository.createVariant({
        productId,
        sku: variant.sku,
        name: variant.label,
        priceMxn: variant.priceMxn,
        ...(variant.comparePriceMxn !== undefined ? { comparePriceMxn: variant.comparePriceMxn } : {}),
        stock: variant.initialStock,
      })
      variants.push({ variantIndex: variant.variantIndex, variantId: assertId(created.id, "variantId") })
    }

    await params.repository.updateProductMetadata({
      productId,
      metadata: { ...baseMetadata, orvenixProvisioning: { ...baseMetadata.orvenixProvisioning, variants } },
    })
    results.push({ productId, sourceIndex: planned.sourceIndex, variants })
    createdProducts += 1
  }

  return { siteId, products: results, createdProducts, reusedProducts }
}

/**
 * EXISTING-store flow: the authoritative rows of exactly `siteId`, ready for
 * the builder's trusted `commerceStore` input (COMMERCE-1
 * bindStoreProductRecordsV1 then keeps only active products with valid
 * variants). Ids come from the DB, never from AI or customer input, and
 * nothing is created.
 */
export async function loadExistingStoreBindingV1(repository: CommerceProvisioningRepositoryV1, siteId: string): Promise<{ siteId: string; records: StoreProductRecordV1[] }> {
  const boundSiteId = assertId(siteId, "siteId")
  const records = (await repository.loadStoreProducts(boundSiteId)).filter((record) => record.siteId === boundSiteId)
  return { siteId: boundSiteId, records }
}
