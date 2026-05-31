export interface PlanSnapshot {
  isActive: boolean
  plan: {
    id: string
    name: string
    maxWebsites: number
    maxVisits: number
    hasEcommerce: boolean
    hasAI: boolean
    hasExport: boolean
  } | null
}

export function getWebsiteLimitMessage(access: Pick<PlanSnapshot, "isActive" | "plan">) {
  if (!access.isActive || !access.plan) {
    return "Necesitas un plan activo para crear sitios. Actualiza tu plan en /precios."
  }

  const limit = access.plan.maxWebsites
  return `Has alcanzado el límite de ${limit} sitio${limit === 1 ? "" : "s"} de tu plan. Actualiza tu plan en /precios.`
}

export function getFeatureLimitMessage(feature: "ecommerce" | "export" | "ai") {
  if (feature === "ecommerce") return "El e-commerce requiere un plan con tienda incluida. Actualiza tu plan en /precios."
  if (feature === "export") return "La exportacion requiere un plan Pro o superior. Actualiza tu plan en /precios."
  return "Orvenix AI requiere un plan con IA incluida. Actualiza tu plan en /precios."
}
