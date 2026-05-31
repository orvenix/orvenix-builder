import { NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@/generated/editor-prisma"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
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

async function requireStoreAccess(siteId: string, user: { id: string; role?: string | null }) {
  const allowed = await canManageSite(siteId, user.id, (user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

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
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, productId, variantId } = await params
  const accessError = await requireStoreAccess(siteId, session.user)
  if (accessError) return accessError

  const variant = await editorPrisma.productVariant.findFirst({
    where: { id: variantId, productId, product: { siteId } },
    select: { id: true },
  })
  if (!variant) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const body = UpdateVariantSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const updated = await editorPrisma.productVariant.update({
    where: { id: variantId },
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
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, productId, variantId } = await params
  const accessError = await requireStoreAccess(siteId, session.user)
  if (accessError) return accessError

  const variant = await editorPrisma.productVariant.findFirst({
    where: { id: variantId, productId, product: { siteId } },
    select: { id: true },
  })
  if (!variant) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  await editorPrisma.productVariant.delete({ where: { id: variantId } })
  return NextResponse.json({ ok: true })
}
