import { editorPrisma } from "@/lib/editor-db"
import { getMpSubscription, parseSubscriptionReference } from "@/lib/mercadopago"
import { serverDebug, serverWarn } from "@/lib/server-log"
import { mapMercadoPagoSubscriptionStatus } from "@/lib/subscription-status"

export async function processMercadoPagoSubscription(mpSubscriptionId: string): Promise<void> {
  const mpSub = await getMpSubscription(mpSubscriptionId)
  const mpStatus = typeof mpSub.status === "string" ? mpSub.status : null
  const internalStatus = mapMercadoPagoSubscriptionStatus(mpStatus)

  const { userId, planId } = parseSubscriptionReference(
    typeof mpSub.external_reference === "string" ? mpSub.external_reference : null
  )

  if (!userId) {
    serverWarn("[webhook:sub] No userId en external_reference", mpSub.external_reference)
    return
  }

  // Calcular fin del período actual (MP devuelve next_payment_date)
  const nextPayment = mpSub.next_payment_date
  const currentPeriodEnd = nextPayment ? new Date(nextPayment) : null

  await editorPrisma.subscription.upsert({
    where: { mpSubscriptionId },
    update: {
      provider: "mercadopago",
      status: internalStatus,
      currentPeriodEnd,
      ...(planId ? { planId } : {}),
    },
    create: {
      userId,
      planId: planId ?? "starter",
      provider: "mercadopago",
      mpSubscriptionId,
      status: internalStatus,
      currentPeriodEnd,
    },
  })

  serverDebug(`[webhook:sub] userId=${userId} status=${internalStatus} plan=${planId}`)
}
