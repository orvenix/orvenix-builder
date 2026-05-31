import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { buildBillingCancelResponse } from "@/lib/billing/route-logic"
import { editorPrisma } from "@/lib/editor-db"
import { cancelMpSubscription, isMpConfigured } from "@/lib/mercadopago"
import { cancelStripeSubscription, isStripeConfigured } from "@/lib/stripe"

// POST /api/billing/cancel — cancela la suscripción activa del usuario
export async function POST() {
  const result = await buildBillingCancelResponse({
    session: await getAuthSession(),
    findSubscription: (userId) =>
      editorPrisma.subscription.findUnique({
        where: { userId },
      }),
    isStripeConfigured,
    cancelStripeSubscription,
    isMpConfigured,
    cancelMpSubscription,
    updateSubscription: (params) =>
      editorPrisma.subscription.update({
        where: params.where,
        data: params.data,
      }),
  })

  return NextResponse.json(result.body, { status: result.status })
}
