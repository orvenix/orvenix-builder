import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"

type Ctx = { params: Promise<{ siteId: string }> }

// GET /api/store/[siteId]/orders
export async function GET(req: Request, { params }: Ctx) {
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
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10))
  const limit  = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10))

  const where = { siteId, ...(status ? { status } : {}) }

  const [orders, total] = await Promise.all([
    editorPrisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    editorPrisma.order.count({ where }),
  ])

  return NextResponse.json({ orders, total, page, limit })
}

// PATCH /api/store/[siteId]/orders/[id] — actualizar estado
// (usamos ruta dinámica en otro archivo)
