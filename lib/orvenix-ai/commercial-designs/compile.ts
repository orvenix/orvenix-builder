import { createHash } from "crypto"

import { runAutonomousMultiPageSiteBuilder } from "@/lib/orvenix-ai/autonomous/site-builder"
import type { AutonomousMultiPageSiteBuilderResult } from "@/lib/orvenix-ai/autonomous/types"
import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2"
import type { AssetProvider } from "@/lib/orvenix-ai/assets/types"

import { normalizeBusinessFactsV1, type BusinessFactsInputV1, type BusinessFactsV1 } from "./business-facts"
import { getDemoFactsV1 } from "./demo-facts"
import { getCommercialDesignV1 } from "./registry"
import { resolveCommercialDesignV1, type ResolvedCommercialDesignV1 } from "./resolver"
import { validateCommercialDesignV1 } from "./validator"

export type CommercialCompileModeV1 = "customer" | "demo"

export type CommercialCompileInputV1 =
  | {
      mode: "customer"
      designId: string
      version: number
      facts: BusinessFactsInputV1 | BusinessFactsV1
      request?: string
    }
  | {
      mode: "demo"
      designId: string
      version: number
    }

export interface CommercialCompileResultV1 {
  mode: CommercialCompileModeV1
  design: { id: string; version: number }
  facts: BusinessFactsV1
  resolved: ResolvedCommercialDesignV1
  generated: AutonomousMultiPageSiteBuilderResult
  plan: SiteCreationPlanV2
  planHash: string
  structuralFingerprint: string
}

const DISABLED_ASSET_PROVIDER_V1: AssetProvider = {
  name: "commercial-design-disabled-provider",
  isAvailable: () => false,
  search: async () => [],
}

function isBusinessFactsV1(value: unknown): value is BusinessFactsV1 {
  return Boolean(value) && typeof value === "object" && "kind" in value && "businessName" in value && "evidence" in value
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stable(entry)]),
    )
  }
  return value
}

export function calculateCommercialStructuralFingerprintV1(resolved: ResolvedCommercialDesignV1): string {
  const payload = {
    version: 1,
    designSource: resolved.designSource,
    siteType: resolved.architecture.siteType,
    theme: resolved.theme,
    direction: {
      density: resolved.direction.density,
      navigationSurfaceStyle: resolved.direction.navigationSurfaceStyle,
      navigationContainment: resolved.direction.navigationContainment,
      navigationLinkStyle: resolved.direction.navigationLinkStyle,
      navigationCtaEmphasis: resolved.direction.navigationCtaEmphasis,
      pricingTreatment: resolved.direction.pricingTreatment,
      trustTreatment: resolved.direction.trustTreatment,
      pageDirections: resolved.direction.pageDirections.map((page) => ({
        slug: page.slug,
        heroTreatment: page.heroTreatment,
        preferredHeroVariant: page.preferredHeroVariant,
        processTreatment: page.processTreatment,
        sectionToneStrategy: page.sectionToneStrategy,
      })),
    },
    skeleton: resolved.skeleton,
  }

  return createHash("sha256")
    .update(JSON.stringify(stable(payload)))
    .digest("hex")
}

function resolveFacts(input: CommercialCompileInputV1): BusinessFactsV1 {
  if (input.mode === "demo") {
    const demo = getDemoFactsV1(input.designId)
    if (!demo) throw new Error(`DemoFactsPack no registrado para ${input.designId}.`)
    return demo
  }

  if (isBusinessFactsV1(input.facts)) {
    if (input.facts.kind !== "customer") {
      throw new Error("Los DemoFactsPack no pueden compilar un sitio real de cliente.")
    }
    return input.facts
  }

  const normalized = normalizeBusinessFactsV1(input.facts, "customer")
  if (!normalized.ok) {
    const errors = "errors" in normalized ? normalized.errors : ["unknown"]
    throw new Error(`BusinessFactsV1 invalido: ${errors.join(",")}`)
  }
  return normalized.facts
}

export async function compileCommercialDesignV1(input: CommercialCompileInputV1): Promise<CommercialCompileResultV1> {
  const design = getCommercialDesignV1(input.designId, input.version)
  if (!design) throw new Error("CommercialDesignV1 no encontrado.")

  const validation = validateCommercialDesignV1(design)
  if (!validation.ok) {
    const diagnostics = "diagnostics" in validation ? validation.diagnostics : []
    throw new Error(`CommercialDesignV1 invalido: ${diagnostics.map((diagnostic) => `${diagnostic.path}:${diagnostic.code}`).join("; ")}`)
  }

  const facts = resolveFacts(input)
  if (input.mode === "customer" && facts.kind !== "customer") {
    throw new Error("Los DemoFactsPack no pueden compilar un sitio real de cliente.")
  }

  const resolved = resolveCommercialDesignV1(validation.design, facts)
  const request = input.mode === "demo"
    ? `Showcase demo de ${validation.design.catalog.name}.`
    : input.request?.trim() || `Crear sitio comercial ${validation.design.catalog.name} para ${facts.businessName}.`

  const generated = await runAutonomousMultiPageSiteBuilder({
    request,
    business: {
      name: facts.businessName,
      industry: validation.design.catalog.name,
      description: facts.description,
      location: facts.location,
      objective: "Conseguir solicitudes de servicio",
      services: facts.services,
      businessEvidence: facts.evidence,
    },
    forceFreshComposition: true,
    minimumQuality: 55,
    commercialDesign: resolved,
    assetProvider: DISABLED_ASSET_PROVIDER_V1,
    assistedGeneration: { mode: "off" },
  })

  return {
    mode: input.mode,
    design: { id: validation.design.id, version: validation.design.version },
    facts,
    resolved,
    generated,
    plan: generated.plan,
    planHash: generated.planHash,
    structuralFingerprint: calculateCommercialStructuralFingerprintV1(resolved),
  }
}
