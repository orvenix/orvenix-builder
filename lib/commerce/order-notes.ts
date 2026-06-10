type ParsedOrderNotes = {
  funnelId: string | null
  step: string | null
  stepId: string | null
  offerType: string | null
  offerDiscountMxn: number | null
  paidPaymentId: string | null
}

export function appendOrderNote(existingNotes: string | null | undefined, note: string) {
  const parts = [existingNotes?.trim(), note.trim()].filter(Boolean)
  return parts.join("|")
}

export function parseOrderNotes(notes: string | null | undefined): ParsedOrderNotes {
  const result: ParsedOrderNotes = {
    funnelId: null,
    step: null,
    stepId: null,
    offerType: null,
    offerDiscountMxn: null,
    paidPaymentId: null,
  }

  for (const rawPart of (notes ?? "").split("|")) {
    const part = rawPart.trim()
    if (!part) continue

    if (part.startsWith("funnel:")) result.funnelId = part.slice("funnel:".length) || null
    else if (part.startsWith("step:")) result.step = part.slice("step:".length) || null
    else if (part.startsWith("step_id:")) result.stepId = part.slice("step_id:".length) || null
    else if (part.startsWith("offer_type:")) result.offerType = part.slice("offer_type:".length) || null
    else if (part.startsWith("offer_discount:")) {
      const value = Number(part.slice("offer_discount:".length))
      result.offerDiscountMxn = Number.isFinite(value) ? value : null
    } else if (part.startsWith("paid:")) {
      const segments = part.split(":")
      result.paidPaymentId = segments[1] || null
    }
  }

  return result
}

export function getOrderNoteDetails(notes: string | null | undefined) {
  return parseOrderNotes(notes)
}

export function getOrderNoteSummary(notes: string | null | undefined) {
  const parsed = getOrderNoteDetails(notes)
  return {
    hasFunnel: Boolean(parsed.funnelId),
    hasOffer: Boolean(parsed.offerType),
    funnelLabel: parsed.step ? `Funnel · ${parsed.step}` : (parsed.funnelId ? "Funnel activo" : null),
    offerLabel: parsed.offerType
      ? parsed.offerType === "discount"
        ? parsed.offerDiscountMxn && parsed.offerDiscountMxn > 0
          ? `Descuento · $${(parsed.offerDiscountMxn / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`
          : "Descuento activo"
        : parsed.offerType === "free_gift"
          ? "Regalo activo"
          : parsed.offerType === "order_bump"
            ? "Order bump"
            : "Oferta activa"
      : null,
    paidLabel: parsed.paidPaymentId ? "Pago confirmado" : null,
  }
}

export function getOrderNoteFilterMeta(notes: string | null | undefined) {
  const parsed = getOrderNoteDetails(notes)
  return {
    hasFunnel: Boolean(parsed.funnelId),
    hasOffer: Boolean(parsed.offerType),
    isPaidTracked: Boolean(parsed.paidPaymentId),
    offerType: parsed.offerType,
    step: parsed.step,
    stepId: parsed.stepId,
  }
}
