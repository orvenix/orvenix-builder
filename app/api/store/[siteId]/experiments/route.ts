import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { createExperiment, isExperimentsReady, listExperiments } from "@/lib/commerce/experiments"

const ExperimentSchema = z.object({
  pageId: z.string().optional().nullable(),
  funnelId: z.string().optional().nullable(),
  name: z.string().min(1).max(191),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  targetType: z.enum(["page", "funnel"]),
  trafficSplit: z.object({
    a: z.number().int().min(1).max(99),
    b: z.number().int().min(1).max(99),
    variants: z.object({
      B: z.object({
        pageId: z.string().optional().nullable(),
        funnelId: z.string().optional().nullable(),
      }).optional(),
    }).optional(),
  }).default({ a: 50, b: 50 }),
})

type Ctx = { params: Promise<{ siteId: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId } = await params
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
    return NextResponse.json({ experiments: [], ready: false, error: "EXPERIMENTS_NOT_READY" })
  }

  const experiments = await listExperiments(siteId)
  return NextResponse.json({ experiments, ready: true })
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId } = await params
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

  const body = ExperimentSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const experiment = await createExperiment(siteId, body.data)
  return NextResponse.json({ experiment }, { status: 201 })
}
