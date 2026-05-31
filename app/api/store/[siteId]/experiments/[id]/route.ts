import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { deleteExperiment, isExperimentsReady, updateExperiment } from "@/lib/commerce/experiments"

const UpdateExperimentSchema = z.object({
  pageId: z.string().optional().nullable(),
  funnelId: z.string().optional().nullable(),
  name: z.string().min(1).max(191).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  targetType: z.enum(["page", "funnel"]).optional(),
  trafficSplit: z.object({
    a: z.number().int().min(1).max(99),
    b: z.number().int().min(1).max(99),
    variants: z.object({
      B: z.object({
        pageId: z.string().optional().nullable(),
        funnelId: z.string().optional().nullable(),
      }).optional(),
    }).optional(),
  }).optional(),
})

type Ctx = { params: Promise<{ siteId: string; id: string }> }

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
      { error: "PLAN_REQUIRED", message: error instanceof Error ? error.message : "El e-commerce no esta incluido en tu plan." },
      { status: 403 }
    )
  }

  if (!isExperimentsReady()) {
    return NextResponse.json(
      { error: "EXPERIMENTS_NOT_READY", message: "Hace falta aplicar el schema nuevo para habilitar experimentos." },
      { status: 503 }
    )
  }

  const body = UpdateExperimentSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  try {
    const experiment = await updateExperiment(siteId, id, body.data)
    return NextResponse.json({ experiment })
  } catch (error) {
    if (error instanceof Error && error.message === "EXPERIMENT_NOT_FOUND") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }
    throw error
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, id } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  try {
    await requireEcommercePlan(session.user.id)
  } catch (error) {
    return NextResponse.json(
      { error: "PLAN_REQUIRED", message: error instanceof Error ? error.message : "El e-commerce no esta incluido en tu plan." },
      { status: 403 }
    )
  }

  if (!isExperimentsReady()) {
    return NextResponse.json(
      { error: "EXPERIMENTS_NOT_READY", message: "Hace falta aplicar el schema nuevo para habilitar experimentos." },
      { status: 503 }
    )
  }

  try {
    await deleteExperiment(siteId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "EXPERIMENT_NOT_FOUND") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }
    throw error
  }
}
