import { NextResponse } from "next/server"
import { editorPrisma } from "@/lib/editor-db"
import { authzErrorResponse, requireManagedSite, requireSessionUser, requireSiteProduct, type SessionUserV1 } from "@/lib/authz"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { z } from "zod"
import type { Prisma } from "@/generated/editor-prisma"
import { generateVariantMatrix, parseVariantMatrixDimensions } from "@/lib/commerce/variant-matrix"

type Ctx = { params: Promise<{ siteId: string; productId: string }> }

const UpdateSchema = z.object({
  name:        z.string().min(1).max(191).optional(),
  description: z.string().optional(),
  type:        z.enum(["physical", "digital", "subscription", "service"]).optional(),
  status:      z.enum(["draft", "active", "archived"]).optional(),
  media:       z.array(z.string()).optional(),
  metadata:    z.record(z.string(), z.unknown()).optional(),
})

const VariantSchema = z.object({
  sku:             z.string().min(1).max(128),
  name:            z.string().min(1).max(191),
  priceMxn:        z.number().int().min(0),
  comparePriceMxn: z.number().int().min(0).optional(),
  stock:           z.number().int().min(0).default(0),
  attributes:      z.record(z.string(), z.string()).default({}),
})

const VariantMatrixSchema = z.object({
  _action: z.literal("generate_variant_matrix"),
  dimensionsText: z.string().min(1),
  skuPrefix: z.string().min(1).max(80),
  priceMxn: z.number().int().min(0),
  comparePriceMxn: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
})

async function requireStoreAccess(siteId: string, user: SessionUserV1) {
  const site = await requireManagedSite(user, siteId)
  if (site.ok === false) return authzErrorResponse(site)

  try {
    await requireEcommercePlan(user.id)
  } catch (error) {
    return NextResponse.json(
      {
        error: "PLAN_REQUIRED",
        message: error instanceof Error ? error.message : "El e-commerce no esta incluido en tu plan.",
      },
      { status: 403 }
    )
  }

  return null
}

// GET /api/store/[siteId]/products/[productId]
export async function GET(_req: Request, { params }: Ctx) {
  const session = await requireSessionUser()
  if (session.ok === false) return authzErrorResponse(session)

  const { siteId, productId } = await params
  const accessError = await requireStoreAccess(siteId, session.value)
  if (accessError) return accessError

  const product = await editorPrisma.product.findFirst({
    where: { id: productId, siteId },
    include: { variants: { orderBy: { createdAt: "asc" } } },
  })
  if (!product) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ product })
}

// PATCH /api/store/[siteId]/products/[productId]
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireSessionUser()
  if (session.ok === false) return authzErrorResponse(session)

  const { siteId, productId } = await params
  const accessError = await requireStoreAccess(siteId, session.value)
  if (accessError) return accessError

  // SEC-1 (SEC0-01): the product must belong to the authorized site; a foreign id is NOT_FOUND.
  const owned = await requireSiteProduct(siteId, productId)
  if (owned.ok === false) return authzErrorResponse(owned)

  const body = UpdateSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { media, metadata, ...rest } = body.data
  // The mutation itself is tenant-scoped too (id AND siteId), not only the pre-check.
  const updated = await editorPrisma.product.updateMany({
    where: { id: owned.value.productId, siteId },
    data: {
      ...rest,
      ...(media    ? { media:    media    as Prisma.InputJsonValue } : {}),
      ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  })
  if (updated.count !== 1) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const product = await editorPrisma.product.findFirst({
    where: { id: owned.value.productId, siteId },
    include: { variants: true },
  })
  if (!product) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ product })
}

// DELETE /api/store/[siteId]/products/[productId]
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await requireSessionUser()
  if (session.ok === false) return authzErrorResponse(session)

  const { siteId, productId } = await params
  const accessError = await requireStoreAccess(siteId, session.value)
  if (accessError) return accessError

  const owned = await requireSiteProduct(siteId, productId)
  if (owned.ok === false) return authzErrorResponse(owned)

  const deleted = await editorPrisma.product.deleteMany({ where: { id: owned.value.productId, siteId } })
  if (deleted.count !== 1) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

// PUT /api/store/[siteId]/products/[productId] — añadir variante
// Reutilizamos POST en la misma ruta con body { _action: "add_variant" }
export async function PUT(req: Request, { params }: Ctx) {
  const session = await requireSessionUser()
  if (session.ok === false) return authzErrorResponse(session)

  const { siteId, productId } = await params
  const accessError = await requireStoreAccess(siteId, session.value)
  if (accessError) return accessError

  // SEC-1 (SEC0-02): ONE boundary for both branches -- prove product ∈ site before any variant write.
  const owned = await requireSiteProduct(siteId, productId)
  if (owned.ok === false) return authzErrorResponse(owned)

  const rawBody = await req.json()
  const matrixBody = VariantMatrixSchema.safeParse(rawBody)
  if (matrixBody.success) {
    const product = await editorPrisma.product.findFirst({
      where: { id: productId, siteId },
      include: { variants: { select: { sku: true } } },
    })
    if (!product) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

    const dimensions = parseVariantMatrixDimensions(matrixBody.data.dimensionsText)
    if (dimensions.length === 0) {
      return NextResponse.json(
        { error: "INVALID_VARIANT_MATRIX", message: "Agrega al menos una dimension con valores." },
        { status: 400 },
      )
    }

    let rows
    try {
      rows = generateVariantMatrix({
        dimensions,
        skuPrefix: matrixBody.data.skuPrefix,
        existingSkus: product.variants.map((variant) => variant.sku),
        limit: matrixBody.data.limit,
      })
    } catch (error) {
      return NextResponse.json(
        { error: "INVALID_VARIANT_MATRIX", message: error instanceof Error ? error.message : "No se pudo generar la matriz." },
        { status: 400 },
      )
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "NO_NEW_VARIANTS", message: "Todas las combinaciones ya existen como SKU." },
        { status: 409 },
      )
    }

    const variants = await editorPrisma.$transaction(
      rows.map((row) => editorPrisma.productVariant.create({
        data: {
          productId: owned.value.productId,
          sku: row.sku,
          name: row.name,
          priceMxn: matrixBody.data.priceMxn,
          comparePriceMxn: matrixBody.data.comparePriceMxn,
          stock: matrixBody.data.stock,
          attributes: row.attributes as Prisma.InputJsonValue,
        },
      })),
    )

    return NextResponse.json({ variants }, { status: 201 })
  }

  const body = VariantSchema.safeParse(rawBody)
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const variant = await editorPrisma.productVariant.create({
    data: {
      productId:        owned.value.productId,
      sku:              body.data.sku,
      name:             body.data.name,
      priceMxn:         body.data.priceMxn,
      comparePriceMxn:  body.data.comparePriceMxn,
      stock:            body.data.stock,
      attributes:       body.data.attributes as Prisma.InputJsonValue,
    },
  })

  return NextResponse.json({ variant }, { status: 201 })
}
