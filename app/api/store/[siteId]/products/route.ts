import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { z } from "zod"
import type { Prisma } from "@/generated/editor-prisma"

const ProductSchema = z.object({
  name:        z.string().min(1).max(191),
  description: z.string().default(""),
  type:        z.enum(["physical", "digital", "subscription", "service"]).default("physical"),
  status:      z.enum(["draft", "active", "archived"]).default("draft"),
  media:       z.array(z.string()).default([]),
  metadata:    z.record(z.string(), z.unknown()).default({}),
})

// GET /api/store/[siteId]/products
export async function GET(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  try {
    await requireEcommercePlan(session.user.id)
  } catch (error) {
    return NextResponse.json(
      {
        error: "PLAN_REQUIRED",
        message: error instanceof Error ? error.message : "El e-commerce no esta incluido en tu plan.",
      },
      { status: 403 }
    )
  }

  const url = new URL(req.url)
  const status = url.searchParams.get("status")

  const products = await editorPrisma.product.findMany({
    where: { siteId, ...(status ? { status } : {}) },
    include: { variants: true, _count: { select: { variants: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ products })
}

// POST /api/store/[siteId]/products
export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  try {
    await requireEcommercePlan(session.user.id)
  } catch (error) {
    return NextResponse.json(
      {
        error: "PLAN_REQUIRED",
        message: error instanceof Error ? error.message : "El e-commerce no esta incluido en tu plan.",
      },
      { status: 403 }
    )
  }

  const body = ProductSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const product = await editorPrisma.product.create({
    data: {
      siteId,
      name:        body.data.name,
      description: body.data.description,
      type:        body.data.type,
      status:      body.data.status,
      media:       body.data.media as Prisma.InputJsonValue,
      metadata:    body.data.metadata as Prisma.InputJsonValue,
    },
    include: { variants: true },
  })

  return NextResponse.json({ product }, { status: 201 })
}
