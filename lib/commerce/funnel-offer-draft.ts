import {
  parseFunnelStepSettings,
  resolveStepOffer,
  type FunnelStepOffer,
} from "./funnel-step-offers"

export type FunnelStepOfferDraft = {
  enabled: boolean
  type: FunnelStepOffer["type"]
  label: string
  productId: string
  imageUrl: string
  priceMxn: string
  discountPercent: string
  discountFixed: string
  acceptLabel: string
  declineLabel: string
}

export const DEFAULT_FUNNEL_STEP_OFFER_DRAFT: FunnelStepOfferDraft = {
  enabled: false,
  type: "product",
  label: "",
  productId: "",
  imageUrl: "",
  priceMxn: "",
  discountPercent: "",
  discountFixed: "",
  acceptLabel: "",
  declineLabel: "",
}

export type FunnelStepOfferDraftValidationError = {
  field: "productId" | "priceMxn" | "discountPercent" | "discountFixed"
  message: string
}

function formatNumber(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : ""
}

export function getFunnelStepOfferDraft(settings: unknown): FunnelStepOfferDraft {
  const parsed = parseFunnelStepSettings(settings)
  const offer = parsed.offer
  if (!offer) return { ...DEFAULT_FUNNEL_STEP_OFFER_DRAFT }

  const resolved = resolveStepOffer(offer)
  return {
    enabled: resolved.enabled,
    type: resolved.type,
    label: resolved.label === "Oferta especial"
      || resolved.label === "Agrega este extra"
      || resolved.label === "Descuento especial"
      || resolved.label === "Regalo incluido"
      ? ""
      : resolved.label,
    productId: resolved.productId ?? "",
    imageUrl: resolved.imageUrl ?? "",
    priceMxn: formatNumber(resolved.priceMxn),
    discountPercent: formatNumber(resolved.discountPercent),
    discountFixed: formatNumber(resolved.discountFixed),
    acceptLabel: resolved.acceptLabel === "Sí, agregar" ? "" : resolved.acceptLabel,
    declineLabel: resolved.declineLabel === "No, gracias" ? "" : resolved.declineLabel,
  }
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function applyFunnelStepOfferDraft(
  settings: unknown,
  draft: FunnelStepOfferDraft
): Record<string, unknown> {
  const parsed = parseFunnelStepSettings(settings)
  const next: Record<string, unknown> = { ...parsed }

  if (!draft.enabled) {
    next.offer = { enabled: false }
    return next
  }

  const priceMxn = parseOptionalNumber(draft.priceMxn)
  const discountPercent = parseOptionalNumber(draft.discountPercent)
  const discountFixed = parseOptionalNumber(draft.discountFixed)

  next.offer = {
    enabled: true,
    type: draft.type,
    label: draft.label.trim() || undefined,
    productId: draft.productId.trim() || undefined,
    imageUrl: draft.imageUrl.trim() || undefined,
    acceptLabel: draft.acceptLabel.trim() || undefined,
    declineLabel: draft.declineLabel.trim() || undefined,
    price: draft.type === "discount"
      ? {
          discountPercent,
          discountFixed,
        }
      : {
          priceMxn,
        },
  }

  return next
}

export function getFunnelStepOfferSummary(settings: unknown): string | null {
  const draft = getFunnelStepOfferDraft(settings)
  if (!draft.enabled) return null

  if (draft.type === "discount") {
    if (draft.discountPercent) return `${draft.discountPercent}% de descuento`
    if (draft.discountFixed) return `$${draft.discountFixed} MXN de descuento`
    return "Descuento activo"
  }

  if (draft.type === "free_gift") return "Regalo activo"
  if (draft.type === "order_bump") return draft.productId ? `Order bump: ${draft.productId}` : "Order bump activo"
  return draft.productId ? `Producto extra: ${draft.productId}` : "Oferta de producto activa"
}

export function validateFunnelStepOfferDraft(
  draft: FunnelStepOfferDraft,
  options?: {
    knownProductIds?: Iterable<string>
  }
): FunnelStepOfferDraftValidationError[] {
  if (!draft.enabled) return []

  const errors: FunnelStepOfferDraftValidationError[] = []
  const knownProductIds = options?.knownProductIds ? new Set(options.knownProductIds) : null
  const productId = draft.productId.trim()
  const priceMxn = parseOptionalNumber(draft.priceMxn)
  const discountPercent = parseOptionalNumber(draft.discountPercent)
  const discountFixed = parseOptionalNumber(draft.discountFixed)

  if (draft.type === "discount") {
    if (typeof discountPercent !== "number" && typeof discountFixed !== "number") {
      errors.push({
        field: "discountPercent",
        message: "Configura descuento porcentual o descuento fijo para esta oferta.",
      })
    }

    if (typeof discountPercent === "number" && (discountPercent < 0 || discountPercent > 100)) {
      errors.push({
        field: "discountPercent",
        message: "El descuento porcentual debe estar entre 0 y 100.",
      })
    }

    if (typeof discountFixed === "number" && discountFixed < 0) {
      errors.push({
        field: "discountFixed",
        message: "El descuento fijo no puede ser negativo.",
      })
    }

    return errors
  }

  if (!productId) {
    errors.push({
      field: "productId",
      message: draft.type === "free_gift"
        ? "Selecciona el producto que se entregara como regalo."
        : "Selecciona el producto que se agregara en esta oferta.",
    })
  } else if (knownProductIds && !knownProductIds.has(productId)) {
    errors.push({
      field: "productId",
      message: "El producto seleccionado ya no existe en este catalogo.",
    })
  }

  if (draft.type === "free_gift") {
    return errors
  }

  if (typeof priceMxn !== "number" || priceMxn <= 0) {
    errors.push({
      field: "priceMxn",
      message: "Define un precio mayor a 0 centavos para esta oferta.",
    })
  }

  return errors
}
