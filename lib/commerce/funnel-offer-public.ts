import { getStepOffer, resolveStepOffer } from "./funnel-step-offers"
import type { FunnelStepKind } from "./funnels"

export type PublicFunnelOfferCallout = {
  tone: "cyan" | "emerald" | "amber"
  eyebrow: string
  title: string
  description: string
  acceptLabel: string
  declineLabel: string
  ctaLabel?: string
  ctaHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type PublicCartOfferSummary = {
  tone: "cyan" | "emerald" | "amber"
  title: string
  description: string
  checkboxLabel: string
  estimatedLabel?: string
  estimatedValue?: string
  estimatedTotalLabel?: string
  estimatedTotalValue?: string
  finePrint?: string
}

function formatMxn(cents: number) {
  return `$${(cents / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
}

function getOfferAcceptCtaLabel(stepKind: FunnelStepKind, offerType: ReturnType<typeof resolveStepOffer>["type"]) {
  if (offerType === "discount") return "Abrir carrito con descuento"
  if (offerType === "free_gift") return "Continuar con regalo incluido"
  if (offerType === "order_bump") {
    return stepKind === "upsell" ? "Abrir carrito con extra" : "Abrir carrito con alternativa"
  }
  return stepKind === "upsell" ? "Abrir carrito con oferta" : "Abrir carrito con opcion alternativa"
}

function getOfferDeclineCtaLabel(stepKind: FunnelStepKind) {
  return stepKind === "upsell" ? "Seguir sin upsell" : "Seguir sin downsell"
}

function formatOfferValue(offer: ReturnType<typeof resolveStepOffer>) {
  if (typeof offer.discountPercent === "number") return `${offer.discountPercent}%`
  if (typeof offer.discountFixed === "number") {
    return `$${(offer.discountFixed / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`
  }
  if (typeof offer.priceMxn === "number") {
    return `$${(offer.priceMxn / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`
  }
  return ""
}

export function getPublicFunnelOfferQuery(
  stepKind: FunnelStepKind,
  settings: unknown
) {
  if (stepKind !== "checkout" && stepKind !== "upsell" && stepKind !== "downsell") return null

  const offer = getStepOffer(settings)
  if (!offer?.enabled) return null

  const resolved = resolveStepOffer(offer)
  return {
    offerStepKind: stepKind,
    offerType: resolved.type,
    offerLabel: resolved.label,
    offerValue: formatOfferValue(resolved),
    offerDiscountPercent: typeof resolved.discountPercent === "number" ? String(resolved.discountPercent) : undefined,
    offerDiscountFixed: typeof resolved.discountFixed === "number" ? String(resolved.discountFixed) : undefined,
    offerPriceMxn: typeof resolved.priceMxn === "number" ? String(resolved.priceMxn) : undefined,
  }
}

export function getPublicCartOfferSummary(input: {
  stepKind?: FunnelStepKind | null
  offerAccepted?: boolean
  offerType?: string | null
  offerLabel?: string | null
  offerValue?: string | null
  offerDiscountPercent?: string | null
  offerDiscountFixed?: string | null
  offerPriceMxn?: string | null
  totalMxn?: number | null
}): PublicCartOfferSummary | null {
  if (!input.offerAccepted) return null
  if (input.stepKind !== "checkout" && input.stepKind !== "upsell" && input.stepKind !== "downsell") return null

  const label = input.offerLabel?.trim() || "Oferta activa"
  const value = input.offerValue?.trim() || ""
  const totalMxn = typeof input.totalMxn === "number" && Number.isFinite(input.totalMxn) ? input.totalMxn : 0
  const discountPercent = input.offerDiscountPercent ? Number(input.offerDiscountPercent) : NaN
  const discountFixed = input.offerDiscountFixed ? Number(input.offerDiscountFixed) : NaN
  const priceMxn = input.offerPriceMxn ? Number(input.offerPriceMxn) : NaN

  if (input.offerType === "discount") {
    const estimatedDiscountMxn = Number.isFinite(discountPercent)
      ? Math.max(0, Math.round(totalMxn * (discountPercent / 100)))
      : Number.isFinite(discountFixed)
        ? Math.max(0, Math.min(totalMxn, discountFixed))
        : 0
    return {
      tone: "cyan",
      title: label,
      description: value
        ? `Este checkout aplicara ${value} a tu compra si mantienes la oferta activa.`
        : "Este checkout aplicara el descuento activo de este paso.",
      checkboxLabel: "Mantener el descuento activo al iniciar el pago.",
      estimatedLabel: estimatedDiscountMxn > 0 ? "Descuento estimado" : undefined,
      estimatedValue: estimatedDiscountMxn > 0
        ? formatMxn(estimatedDiscountMxn)
        : undefined,
      estimatedTotalLabel: estimatedDiscountMxn > 0 ? "Total estimado" : undefined,
      estimatedTotalValue: estimatedDiscountMxn > 0
        ? formatMxn(Math.max(0, totalMxn - estimatedDiscountMxn))
        : undefined,
      finePrint: estimatedDiscountMxn > 0
        ? "El descuento final se confirma en la pasarela antes de completar el pago."
        : undefined,
    }
  }

  if (input.offerType === "free_gift") {
    return {
      tone: "emerald",
      title: label,
      description: "Este checkout intentara incluir el regalo activo de este paso en tu compra.",
      checkboxLabel: "Mantener el regalo activo al iniciar el pago.",
      estimatedLabel: "Beneficio estimado",
      estimatedValue: "Regalo incluido",
      estimatedTotalLabel: totalMxn > 0 ? "Total estimado" : undefined,
      estimatedTotalValue: totalMxn > 0 ? formatMxn(totalMxn) : undefined,
      finePrint: "La disponibilidad del regalo se confirma al procesar el pago final.",
    }
  }

  return {
    tone: "amber",
    title: label,
    description: value
      ? `Este checkout agregara ${label} por ${value} si continúas con la oferta activa.`
      : "Este checkout agregara la oferta activa de este paso si la mantienes seleccionada.",
    checkboxLabel: input.stepKind === "upsell"
      ? "Mantener el upsell activo al iniciar el pago."
      : input.stepKind === "downsell"
        ? "Mantener el downsell activo al iniciar el pago."
        : "Mantener la oferta activa al iniciar el pago.",
    estimatedLabel: Number.isFinite(priceMxn) ? "Cargo estimado" : undefined,
    estimatedValue: Number.isFinite(priceMxn)
      ? formatMxn(priceMxn)
      : undefined,
    estimatedTotalLabel: Number.isFinite(priceMxn) ? "Total estimado" : undefined,
    estimatedTotalValue: Number.isFinite(priceMxn)
      ? formatMxn(totalMxn + priceMxn)
      : undefined,
    finePrint: Number.isFinite(priceMxn)
      ? "El cargo final de la oferta se confirma en la pasarela antes de pagar."
      : undefined,
  }
}

export function getPublicFunnelOfferCallout(
  stepKind: FunnelStepKind,
  settings: unknown,
  actions?: {
    acceptHref?: string
    acceptLabel?: string
    declineHref?: string
    declineLabel?: string
  }
): PublicFunnelOfferCallout | null {
  if (stepKind !== "checkout" && stepKind !== "upsell" && stepKind !== "downsell") return null

  const offer = getStepOffer(settings)
  if (!offer?.enabled) return null

  const resolved = resolveStepOffer(offer)

  if (resolved.type === "discount") {
    const amount = typeof resolved.discountPercent === "number"
      ? `${resolved.discountPercent}%`
      : typeof resolved.discountFixed === "number"
        ? `$${(resolved.discountFixed / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`
        : "un descuento especial"

    return {
      tone: "cyan",
      eyebrow: stepKind === "upsell" ? "Upsell activo" : stepKind === "downsell" ? "Downsell activo" : "Oferta de checkout",
      title: resolved.label,
      description: `Abre el carrito desde este paso para aplicar ${amount} a tu compra.`,
      acceptLabel: resolved.acceptLabel,
      declineLabel: resolved.declineLabel,
      ctaLabel: actions?.acceptHref ? (actions.acceptLabel ?? getOfferAcceptCtaLabel(stepKind, resolved.type)) : undefined,
      ctaHref: actions?.acceptHref,
      secondaryLabel: actions?.declineHref ? (actions.declineLabel ?? getOfferDeclineCtaLabel(stepKind)) : undefined,
      secondaryHref: actions?.declineHref,
    }
  }

  if (resolved.type === "free_gift") {
    return {
      tone: "emerald",
      eyebrow: stepKind === "upsell" ? "Regalo activo" : stepKind === "downsell" ? "Recuperación activa" : "Regalo de checkout",
      title: resolved.label,
      description: "Continua desde este paso para llevarte un regalo incluido en la compra.",
      acceptLabel: resolved.acceptLabel,
      declineLabel: resolved.declineLabel,
      ctaLabel: actions?.acceptHref ? (actions.acceptLabel ?? getOfferAcceptCtaLabel(stepKind, resolved.type)) : undefined,
      ctaHref: actions?.acceptHref,
      secondaryLabel: actions?.declineHref ? (actions.declineLabel ?? getOfferDeclineCtaLabel(stepKind)) : undefined,
      secondaryHref: actions?.declineHref,
    }
  }

  const amount = typeof resolved.priceMxn === "number"
    ? `$${(resolved.priceMxn / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`
    : "un extra especial"

  return {
    tone: "amber",
    eyebrow: stepKind === "upsell" ? "Oferta complementaria" : stepKind === "downsell" ? "Oferta alternativa" : "Oferta de checkout",
    title: resolved.label,
    description: resolved.type === "product"
      ? `Abre el carrito para sumar ${resolved.label} por ${amount}.`
      : `Abre el carrito para agregar ${resolved.label || amount} como complemento de tu compra.`,
    acceptLabel: resolved.acceptLabel,
    declineLabel: resolved.declineLabel,
    ctaLabel: actions?.acceptHref ? (actions.acceptLabel ?? getOfferAcceptCtaLabel(stepKind, resolved.type)) : undefined,
    ctaHref: actions?.acceptHref,
    secondaryLabel: actions?.declineHref ? (actions.declineLabel ?? getOfferDeclineCtaLabel(stepKind)) : undefined,
    secondaryHref: actions?.declineHref,
  }
}
