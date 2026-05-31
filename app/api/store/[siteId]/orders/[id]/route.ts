import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { z } from "zod"

type Ctx = { params: Promise<{ siteId: string; id: string }> }

const UpdateSchema = z.object({
  status: z.enum(["pending", "paid", "fulfilled", "refunded", "canceled"]).optional(),
  notes:  z.string().optional(),
})

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, id } = await params
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

  const body = UpdateSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const order = await editorPrisma.order.findFirst({ where: { id, siteId }, select: { id: true } })
  if (!order) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const updated = await editorPrisma.order.update({
    where: { id },
    data: body.data,
  })

  return NextResponse.json({ order: updated })
}
