import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { createFunnel, isFunnelsReady, listFunnels } from "@/lib/commerce/funnels"

const FunnelStepSchema = z.object({
  pageId: z.string().optional().nullable(),
  kind: z.enum(["landing", "checkout", "upsell", "downsell", "thankyou"]),
  position: z.number().int().nonnegative(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

const FunnelSchema = z.object({
  name: z.string().min(1).max(191),
  slug: z.string().min(1).max(191).regex(/^[a-z0-9-]+$/),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  settings: z.record(z.string(), z.unknown()).default({}),
  steps: z.array(FunnelStepSchema).default([]),
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

  if (!isFunnelsReady()) {
    return NextResponse.json({ funnels: [], ready: false, error: "FUNNELS_NOT_READY" })
  }

  const funnels = await listFunnels(siteId)
  return NextResponse.json({ funnels, ready: true })
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

  if (!isFunnelsReady()) {
    return NextResponse.json(
      { error: "FUNNELS_NOT_READY", message: "Hace falta aplicar el schema nuevo para habilitar funnels." },
      { status: 503 }
    )
  }

  const body = FunnelSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const funnel = await createFunnel(siteId, body.data)
  return NextResponse.json({ funnel }, { status: 201 })
}
