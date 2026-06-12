export type PublicCheckoutStatusTone = "emerald" | "amber" | "red"
export type PublicCheckoutStatusKind = "success" | "pending" | "failure"

export type PublicCheckoutStatusNotice = {
  tone: PublicCheckoutStatusTone
  kind: PublicCheckoutStatusKind
  eyebrow: string
  title: string
  description: string
  detail?: string
  ctaLabel?: string
  ctaHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

function getShortOrderId(orderId: string | null | undefined) {
  if (!orderId) return ""
  const parts = orderId.split("_")
  return parts[parts.length - 1] || orderId
}

export function getPublicCheckoutStatusNotice(
  status: string | null | undefined,
  orderId?: string | null,
  actions?: {
    primaryHref?: string
    primaryLabel?: string
    secondaryHref?: string
    secondaryLabel?: string
    offerType?: string
    offerLabel?: string
    offerValue?: string
  }
): PublicCheckoutStatusNotice | null {
  const shortOrderId = getShortOrderId(orderId)
  const orderSuffix = shortOrderId ? ` #${shortOrderId}` : ""
  const offerLabel = actions?.offerLabel?.trim() || "la oferta activa"
  const offerValue = actions?.offerValue?.trim() || ""
  const offerType = actions?.offerType?.trim() || ""
  const offerDetail = offerType === "discount"
    ? (offerValue ? `${offerLabel} esperaba aplicar ${offerValue} en este paso.` : `${offerLabel} esperaba aplicar un descuento en este paso.`)
    : offerType === "free_gift"
      ? `${offerLabel} esperaba incluir un regalo en este checkout.`
      : offerType
        ? (offerValue ? `${offerLabel} esperaba sumar ${offerValue} en este checkout.` : `${offerLabel} seguia activa en este checkout.`)
        : undefined

  if (status === "success") {
    return {
      tone: "emerald",
      kind: "success",
      eyebrow: "Pago confirmado",
      title: `Tu pedido${orderSuffix} ya fue registrado`,
      description: "La confirmacion de pago se recibio correctamente. Puedes continuar con el siguiente paso del funnel.",
      detail: offerDetail,
      ctaLabel: actions?.primaryHref ? (actions.primaryLabel ?? "Continuar") : undefined,
      ctaHref: actions?.primaryHref,
      secondaryLabel: actions?.secondaryHref ? actions.secondaryLabel : undefined,
      secondaryHref: actions?.secondaryHref,
    }
  }

  if (status === "pending") {
    return {
      tone: "amber",
      kind: "pending",
      eyebrow: "Pago pendiente",
      title: `Tu pedido${orderSuffix} sigue en revision`,
      description: "La pasarela todavia no confirma el cobro. Puedes esperar la actualizacion o volver a intentar mas tarde.",
      detail: offerDetail,
      ctaLabel: actions?.primaryHref ? (actions.primaryLabel ?? "Continuar") : undefined,
      ctaHref: actions?.primaryHref,
      secondaryLabel: actions?.secondaryHref ? actions.secondaryLabel : undefined,
      secondaryHref: actions?.secondaryHref,
    }
  }

  if (status === "failure") {
    return {
      tone: "red",
      kind: "failure",
      eyebrow: "Pago no completado",
      title: `Tu pedido${orderSuffix} no pudo completarse`,
      description: "La pasarela devolvio un error o el pago fue cancelado. Puedes revisar la oferta y volver a intentar.",
      detail: offerDetail,
      ctaLabel: actions?.primaryHref ? (actions.primaryLabel ?? "Continuar") : undefined,
      ctaHref: actions?.primaryHref,
      secondaryLabel: actions?.secondaryHref ? actions.secondaryLabel : undefined,
      secondaryHref: actions?.secondaryHref,
    }
  }

  return null
}
