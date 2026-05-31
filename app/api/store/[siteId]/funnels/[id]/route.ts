import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { deleteFunnel, isFunnelsReady, updateFunnel } from "@/lib/commerce/funnels"

const FunnelStepSchema = z.object({
  pageId: z.string().optional().nullable(),
  kind: z.enum(["landing", "checkout", "upsell", "downsell", "thankyou"]),
  position: z.number().int().nonnegative(),
  settings: z.record(z.string(), z.unknown()).optional(),
})

const UpdateFunnelSchema = z.object({
  name: z.string().min(1).max(191).optional(),
  slug: z.string().min(1).max(191).regex(/^[a-z0-9-]+$/).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  steps: z.array(FunnelStepSchema).optional(),
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

  if (!isFunnelsReady()) {
    return NextResponse.json(
      { error: "FUNNELS_NOT_READY", message: "Hace falta aplicar el schema nuevo para habilitar funnels." },
      { status: 503 }
    )
  }

  const body = UpdateFunnelSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  try {
    const funnel = await updateFunnel(siteId, id, body.data)
    return NextResponse.json({ funnel })
  } catch (error) {
    if (error instanceof Error && error.message === "FUNNEL_NOT_FOUND") {
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

  if (!isFunnelsReady()) {
    return NextResponse.json(
      { error: "FUNNELS_NOT_READY", message: "Hace falta aplicar el schema nuevo para habilitar funnels." },
      { status: 503 }
    )
  }

  try {
    await deleteFunnel(siteId, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "FUNNEL_NOT_FOUND") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
    }
    throw error
  }
}
