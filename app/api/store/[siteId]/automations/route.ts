import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { requireEcommercePlan } from "@/lib/plan-guard"
import { createAutomation, isAutomationsReady, listAutomations } from "@/lib/automation/runtime"
import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_CONDITION_OPERATORS,
  AUTOMATION_STATUSES,
  AUTOMATION_TRIGGER_TYPES,
} from "@/lib/automation/config"

const AutomationActionSchema = z.object({
  type: z.enum(AUTOMATION_ACTION_TYPES),
  config: z.record(z.string(), z.unknown()).optional(),
})

const AutomationConditionSchema = z.object({
  field: z.string().min(1).max(64),
  operator: z.enum(AUTOMATION_CONDITION_OPERATORS),
  value: z.string().min(1).max(191),
})

const AutomationSchema = z.object({
  name: z.string().min(1).max(191),
  triggerType: z.enum(AUTOMATION_TRIGGER_TYPES),
  status: z.enum(AUTOMATION_STATUSES).default("draft"),
  actionGraph: z.object({
    conditions: z.array(AutomationConditionSchema).default([]),
    actions: z.array(AutomationActionSchema).default([]),
  }).default({ conditions: [], actions: [] }),
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
      { error: "PLAN_REQUIRED", message: error instanceof Error ? error.message : "Las automatizaciones no estan incluidas en tu plan." },
      { status: 403 }
    )
  }

  if (!isAutomationsReady()) {
    return NextResponse.json({ automations: [], ready: false, error: "AUTOMATIONS_NOT_READY" })
  }

  const automations = await listAutomations(siteId)
  return NextResponse.json({ automations, ready: true })
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
      { error: "PLAN_REQUIRED", message: error instanceof Error ? error.message : "Las automatizaciones no estan incluidas en tu plan." },
      { status: 403 }
    )
  }

  if (!isAutomationsReady()) {
    return NextResponse.json(
      { error: "AUTOMATIONS_NOT_READY", message: "Hace falta aplicar el schema nuevo para habilitar automatizaciones." },
      { status: 503 }
    )
  }

  const body = AutomationSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const automation = await createAutomation(siteId, body.data)
  return NextResponse.json({ automation }, { status: 201 })
}
