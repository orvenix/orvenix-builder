import { NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@/generated/editor-prisma"
import { editorPrisma } from "@/lib/editor-db"
import { authzErrorResponse, requireManagedSite, requireSessionUser, requireSiteVariant, type SessionUserV1 } from "@/lib/authz"
import { requireEcommercePlan } from "@/lib/plan-guard"

type Ctx = { params: Promise<{ siteId: string; productId: string; variantId: string }> }

const UpdateVariantSchema = z.object({
  sku: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(191).optional(),
  priceMxn: z.number().int().min(0).optional(),
  comparePriceMxn: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
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

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireSessionUser()
  if (session.ok === false) return authzErrorResponse(session)

  const { siteId, productId, variantId } = await params
  const accessError = await requireStoreAccess(siteId, session.value)
  if (accessError) return accessError

  const variant = await requireSiteVariant(siteId, productId, variantId)
  if (variant.ok === false) return authzErrorResponse(variant)

  const body = UpdateVariantSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const updated = await editorPrisma.productVariant.update({
    where: { id: variant.value.variantId },
    data: {
      ...(body.data.sku !== undefined ? { sku: body.data.sku } : {}),
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(body.data.priceMxn !== undefined ? { priceMxn: body.data.priceMxn } : {}),
      ...(body.data.comparePriceMxn !== undefined ? { comparePriceMxn: body.data.comparePriceMxn } : {}),
      ...(body.data.stock !== undefined ? { stock: body.data.stock } : {}),
      ...(body.data.attributes !== undefined ? { attributes: body.data.attributes as Prisma.InputJsonValue } : {}),
    },
  })

  return NextResponse.json({ variant: updated })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await requireSessionUser()
  if (session.ok === false) return authzErrorResponse(session)

  const { siteId, productId, variantId } = await params
  const accessError = await requireStoreAccess(siteId, session.value)
  if (accessError) return accessError

  const variant = await requireSiteVariant(siteId, productId, variantId)
  if (variant.ok === false) return authzErrorResponse(variant)

  await editorPrisma.productVariant.delete({ where: { id: variant.value.variantId } })
  return NextResponse.json({ ok: true })
}
