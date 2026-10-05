import type { RealTemplate } from "@/lib/realTemplates"

/**
 * CV1-1: single decision point for "Usar este diseño".
 *
 * A catalog template backed by a CommercialDesignV1 (commercialDesignId +
 * commercialDesignVersion) starts the commercial flow at
 * /templates/[id]/comenzar. Every other template returns null and keeps the
 * legacy selfEditTemplateAction path unchanged.
 *
 * Client-safe on purpose (no registry/compiler import): the start page
 * re-checks the design against the registry on the server.
 */
export interface CommercialTemplateStart {
  designId: string
  version: number
  href: string
}

export function getCommercialTemplateStart(
  template: Pick<RealTemplate, "id" | "commercialDesignId" | "commercialDesignVersion"> | null | undefined,
): CommercialTemplateStart | null {
  const designId = template?.commercialDesignId
  const version = template?.commercialDesignVersion
  if (!template || !designId || typeof version !== "number" || !Number.isSafeInteger(version)) return null
  return {
    designId,
    version,
    href: `/templates/${encodeURIComponent(template.id)}/comenzar`,
  }
}
