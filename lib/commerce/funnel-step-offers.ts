import { z } from "zod"

const FUNNEL_STEP_OFFER_TYPES = ["product", "order_bump", "discount", "free_gift"] as const

const FunnelStepOfferPriceSchema = z.object({
  priceMxn: z.number().finite().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  discountFixed: z.number().min(0).optional(),
}).optional()

const FunnelStepOfferSchema = z.object({
  type: z.enum(FUNNEL_STEP_OFFER_TYPES),
  enabled: z.boolean().optional(),
  label: z.string().optional(),
  acceptLabel: z.string().optional(),
  declineLabel: z.string().optional(),
  imageUrl: z.string().optional(),
  productId: z.string().optional(),
  price: FunnelStepOfferPriceSchema,
})

const FunnelStepSettingsSchema = z.object({
  offer: FunnelStepOfferSchema.optional(),
}).catchall(z.unknown())

export type FunnelStepOffer = z.infer<typeof FunnelStepOfferSchema>
export type ResolvedFunnelStepOffer = FunnelStepOffer & {
  enabled: boolean
  label: string
  acceptLabel: string
  declineLabel: string
  imageUrl: string | null
  productId: string | null
  priceMxn: number | null
  discountPercent: number | null
  discountFixed: number | null
}

function defaultLabel(type: FunnelStepOffer["type"]): string {
  if (type === "free_gift") return "Regalo incluido"
  if (type === "discount") return "Descuento especial"
  if (type === "order_bump") return "Agrega este extra"
  return "Oferta especial"
}

export function parseFunnelStepOffer(input: unknown): FunnelStepOffer | null {
  const parsed = FunnelStepOfferSchema.safeParse(input)
  return parsed.success ? parsed.data : null
}

export function parseFunnelStepSettings(input: unknown): Record<string, unknown> & { offer?: FunnelStepOffer } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {}
  const parsed = FunnelStepSettingsSchema.safeParse(input)
  if (!parsed.success) return {}

  const result = { ...parsed.data } as Record<string, unknown> & { offer?: FunnelStepOffer }
  if (result.offer) {
    const offer = parseFunnelStepOffer(result.offer)
    if (offer) result.offer = offer
    else delete result.offer
  }
  return result
}

export function getStepOffer(settings: unknown): FunnelStepOffer | null {
  const parsed = parseFunnelStepSettings(settings)
  return parsed.offer ?? null
}

export function resolveStepOffer(offer: FunnelStepOffer): ResolvedFunnelStepOffer {
  return {
    ...offer,
    enabled: offer.enabled ?? false,
    label: offer.label?.trim() || defaultLabel(offer.type),
    acceptLabel: offer.acceptLabel?.trim() || "Sí, agregar",
    declineLabel: offer.declineLabel?.trim() || "No, gracias",
    imageUrl: offer.imageUrl?.trim() || null,
    productId: offer.productId?.trim() || null,
    priceMxn: offer.price?.priceMxn ?? null,
    discountPercent: offer.price?.discountPercent ?? null,
    discountFixed: offer.price?.discountFixed ?? null,
  }
}

export function applyOfferDiscount(total: number, offer: ResolvedFunnelStepOffer): number {
  if (offer.type !== "discount") return total
  if (typeof offer.discountPercent === "number") {
    return Math.max(0, Math.round(total * (1 - (offer.discountPercent / 100))))
  }
  if (typeof offer.discountFixed === "number") {
    return Math.max(0, total - offer.discountFixed)
  }
  return total
}
