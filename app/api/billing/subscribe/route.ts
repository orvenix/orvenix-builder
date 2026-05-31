import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { buildBillingSubscribeResponse } from "@/lib/billing/route-logic"
import { editorPrisma } from "@/lib/editor-db"
import {
  createStripeCheckoutSession,
  getStripePriceId,
  isStripeConfigured,
} from "@/lib/stripe"

// POST /api/billing/subscribe
// Body: { planId: "starter"|"pro"|"commerce", interval: "month"|"year" }
export async function POST(request: Request) {
  let body: { planId?: string; interval?: string }
  try {
    body = await request.json() as { planId?: string; interval?: string }
  } catch {
    return NextResponse.json({ error: "Body JSON inválido", code: "INVALID_JSON" }, { status: 400 })
  }

  const session = await getAuthSession()
  const result = await buildBillingSubscribeResponse({
    session,
    body,
    findPlan: (planId) => editorPrisma.plan.findUnique({ where: { id: planId } }),
    findSubscription: (userId) => editorPrisma.subscription.findUnique({ where: { userId } }),
    getStripePriceId,
    isStripeConfigured,
    createStripeCheckoutSession,
    upsertSubscription: (params) => editorPrisma.subscription.upsert(params as never),
  })

  return NextResponse.json(result.body, { status: result.status })
}
