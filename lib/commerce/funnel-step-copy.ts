import type { FunnelSequenceStepKind } from "@/lib/commerce/funnel-step-sequence"

type FunnelStepActionMode = "advance" | "return"

export function getFunnelStepActionLabel(
  stepKind: FunnelSequenceStepKind | null | undefined,
  mode: FunnelStepActionMode
) {
  if (mode === "advance") {
    switch (stepKind) {
      case "checkout":
        return "Ir al checkout"
      case "upsell":
        return "Ver oferta upsell"
      case "downsell":
        return "Ver oferta downsell"
      case "thankyou":
        return "Ver confirmacion final"
      case "landing":
        return "Volver al inicio del funnel"
      default:
        return "Continuar"
    }
  }

  switch (stepKind) {
    case "checkout":
      return "Volver al checkout"
    case "upsell":
      return "Volver al upsell"
    case "downsell":
      return "Volver al downsell"
    case "thankyou":
      return "Volver a la confirmacion"
    case "landing":
      return "Volver al inicio"
    default:
      return "Continuar"
  }
}

export function getFunnelOfferApplyLabel(stepKind: FunnelSequenceStepKind | null | undefined) {
  switch (stepKind) {
    case "upsell":
      return "Aplicar upsell"
    case "downsell":
      return "Aplicar downsell"
    default:
      return "Aplicar oferta"
  }
}

export function getFunnelOfferSkipLabel(stepKind: FunnelSequenceStepKind | null | undefined) {
  switch (stepKind) {
    case "upsell":
      return "Seguir sin upsell"
    case "downsell":
      return "Seguir sin downsell"
    default:
      return "Seguir sin oferta"
  }
}
