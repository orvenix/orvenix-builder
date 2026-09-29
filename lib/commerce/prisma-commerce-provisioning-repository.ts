import type { Prisma } from "@/generated/editor-prisma"
import {
  readOrvenixProvisioningMetadataV1,
  type CommerceProvisioningRepositoryV1,
} from "@/lib/orvenix-ai/commerce/provisioning-executor"

/**
 * COMMERCE-2A: the ONLY Prisma implementation of
 * CommerceProvisioningRepositoryV1. Server-only; always constructed with
 * the Site Creation `$transaction` client so every write shares that one
 * transaction (site + pages + theme + products + variants + preview
 * consumption commit or roll back together). Mirrors the existing owner
 * CRUD conventions (app/api/store/[siteId]/products*): type "physical",
 * media `[]`, integer-cent prices, stock >= 0, attributes `{}`. Status is
 * "active" so the existing checkout route accepts the provisioned
 * variants. Never exposed to browser/server-action inputs.
 */
type ProvisioningDb = Pick<Prisma.TransactionClient, "product" | "productVariant">

export function createPrismaCommerceProvisioningRepositoryV1(db: ProvisioningDb): CommerceProvisioningRepositoryV1 {
  return {
    async findProvisionedProducts({ siteId, previewId }) {
      const products = await db.product.findMany({
        where: { siteId },
        select: { id: true, siteId: true, metadata: true, variants: { select: { id: true } } },
      })
      return products.flatMap((product) => {
        const provisioning = readOrvenixProvisioningMetadataV1(product.metadata)
        return provisioning && provisioning.previewId === previewId
          ? [{
              productId: product.id,
              siteId: product.siteId,
              sourceIndex: provisioning.sourceIndex,
              variants: provisioning.variants,
              // Real ownership, re-verified by the executor (metadata alone is never trusted).
              ownedVariantIds: product.variants.map((variant) => variant.id),
            }]
          : []
      })
    },

    async createProduct({ siteId, name, description, metadata }) {
      return db.product.create({
        data: {
          siteId,
          name,
          description,
          type: "physical",
          status: "active",
          media: [] as Prisma.InputJsonValue,
          metadata: metadata as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      })
    },

    async createVariant({ productId, sku, name, priceMxn, comparePriceMxn, stock }) {
      return db.productVariant.create({
        data: {
          productId,
          sku,
          name,
          priceMxn,
          ...(comparePriceMxn !== undefined ? { comparePriceMxn } : {}),
          stock,
          attributes: {} as Prisma.InputJsonValue,
        },
        select: { id: true },
      })
    },

    async updateProductMetadata({ productId, metadata }) {
      await db.product.update({ where: { id: productId }, data: { metadata: metadata as unknown as Prisma.InputJsonValue } })
    },

    async loadStoreProducts(siteId) {
      const products = await db.product.findMany({
        where: { siteId },
        include: { variants: true },
        orderBy: { createdAt: "asc" },
      })
      return products.map((product) => ({
        id: product.id,
        siteId: product.siteId,
        name: product.name,
        description: product.description,
        status: product.status,
        metadata: product.metadata,
        media: product.media,
        variants: product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          priceMxn: variant.priceMxn,
          comparePriceMxn: variant.comparePriceMxn,
          stock: variant.stock,
        })),
      }))
    },
  }
}
