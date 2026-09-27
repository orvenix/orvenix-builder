import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type { OrvenixSiteArchitecture } from "@/lib/orvenix-ai/architect/site-architect"
import {
  ROLE_TREATMENT_VOCABULARY,
  type SectionInstanceSelectionMode,
} from "@/lib/orvenix-ai/architect/composition-plan"
import { ROLE_VISUAL_LAYOUT_VOCABULARY, type VisualLayoutKind } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import {
  SECTION_INSTANCE_ALIGNMENTS,
  SECTION_INSTANCE_MEDIA_STRATEGIES,
  SECTION_INSTANCE_SCALES,
  SECTION_TONE_STRATEGIES,
} from "@/lib/orvenix-ai/composer/composition-context"
import { ASSISTED_SITE_GENERATION_LIMITS_V1 } from "./validator"
import type { CreativeSiteDirectionV1 } from "@/lib/orvenix-ai/creative-director/contract"
import type { CreativeDesignReferenceV1 } from "@/lib/orvenix-ai/creative-director/reference-context"

/**
 * ASSISTED-3A: the bounded, sanitized, provider-neutral REQUEST shape sent
 * to a real Assisted Generation provider (Anthropic, in this phase --
 * never invoked yet, see anthropic-provider.ts). This module never depends
 * on any provider SDK -- it only turns already-resolved, already-real
 * Orvenix facts into the small closed vocabulary a provider is allowed to
 * choose from.
 *
 * Deliberately excludes:
 *   - business name (this provider never writes copy/narrative that would
 *     need it -- see anthropic-provider.ts's system prompt)
 *   - raw user prompt / request string (normalized facts only, per the
 *     ASSISTED-3A mission's explicit instruction to audit whether it is
 *     actually necessary -- it is not)
 *   - contact evidence (phone/whatsapp/email/address), pricing figures,
 *     testimonials, any PII
 *   - EditorTree, raw HTML/CSS, DB records, credentials
 *   - Creative Director's per-page copy suggestions (heroTitleSuggestion/
 *     heroDescriptionSuggestion/highlightedOfferings/etc.) -- composition
 *     advice, never copy, is this provider's only job
 *
 * `capabilities` is built ONLY from roles that actually appear in the
 * supplied architecture, and only from Orvenix's OWN existing bounded
 * vocabulary tables (composition-plan.ts / visual-layout-plan.ts /
 * composition-context.ts / validator.ts's own limits) -- there is no
 * field here a provider could use to request something the compiler
 * cannot already execute.
 */

export const ASSISTED_SITE_GENERATION_SELECTION_MODES_V1 = [
  "all",
  "single-item",
  "subset",
] as const satisfies readonly SectionInstanceSelectionMode[]

export type AssistedSiteGenerationOfferingContextV1 = { name: string; description?: string }

export type AssistedSiteGenerationBusinessContextV1 = {
  industry?: string
  objective?: string
  location?: string
}

export type AssistedSiteGenerationPageContextV1 = {
  slug: string
  purpose: string
  archetype: string
  roles: SectionRole[]
}

export type AssistedSiteGenerationCapabilitiesV1 = {
  selectionModes: readonly SectionInstanceSelectionMode[]
  /** Only roles actually present in the supplied architecture. */
  roleTreatments: Partial<Record<SectionRole, readonly string[]>>
  roleLayouts: Partial<Record<SectionRole, readonly VisualLayoutKind[]>>
  alignments: readonly string[]
  scales: readonly string[]
  mediaStrategies: readonly string[]
  backgroundStrategies: readonly string[]
  maxSubsetIndexes: number
}

/**
 * Deliberately a NARROW subset of CreativeSiteDirectionV1 -- site-level
 * character/tone signals only, never the per-page pageDirections (those
 * are COPY suggestions; this provider only ever proposes composition, per
 * the ASSISTED-3A mission's explicit "Claude is NOT ... an EditorTree/copy
 * generator" boundary).
 */
export type AssistedSiteGenerationCreativeDirectionContextV1 = {
  siteNarrative?: string
  tone?: CreativeSiteDirectionV1["tone"]
  density?: CreativeSiteDirectionV1["density"]
  premiumCompositionTreatment?: CreativeSiteDirectionV1["premiumCompositionTreatment"]
  pricingTreatment?: CreativeSiteDirectionV1["pricingTreatment"]
}

export type AssistedSiteGenerationRequestContextV1 = {
  business: AssistedSiteGenerationBusinessContextV1
  pages: AssistedSiteGenerationPageContextV1[]
  offerings: {
    services?: AssistedSiteGenerationOfferingContextV1[]
    products?: AssistedSiteGenerationOfferingContextV1[]
  }
  creativeDirection?: AssistedSiteGenerationCreativeDirectionContextV1
  designReferences?: CreativeDesignReferenceV1[]
  capabilities: AssistedSiteGenerationCapabilitiesV1
}

function narrowCreativeDirectionContext(
  direction: CreativeSiteDirectionV1 | null | undefined,
): AssistedSiteGenerationCreativeDirectionContextV1 | undefined {
  if (!direction) return undefined

  const narrowed: AssistedSiteGenerationCreativeDirectionContextV1 = {}
  if (direction.siteNarrative) narrowed.siteNarrative = direction.siteNarrative
  if (direction.tone) narrowed.tone = direction.tone
  if (direction.density) narrowed.density = direction.density
  if (direction.premiumCompositionTreatment) narrowed.premiumCompositionTreatment = direction.premiumCompositionTreatment
  if (direction.pricingTreatment) narrowed.pricingTreatment = direction.pricingTreatment

  return Object.keys(narrowed).length > 0 ? narrowed : undefined
}

function buildCapabilities(usedRoles: ReadonlySet<SectionRole>): AssistedSiteGenerationCapabilitiesV1 {
  const roleTreatments: Partial<Record<SectionRole, readonly string[]>> = {}
  const roleLayouts: Partial<Record<SectionRole, readonly VisualLayoutKind[]>> = {}

  for (const role of usedRoles) {
    const treatments = ROLE_TREATMENT_VOCABULARY[role]
    if (treatments) roleTreatments[role] = treatments

    const layouts = ROLE_VISUAL_LAYOUT_VOCABULARY[role]
    if (layouts) roleLayouts[role] = layouts
  }

  return {
    selectionModes: ASSISTED_SITE_GENERATION_SELECTION_MODES_V1,
    roleTreatments,
    roleLayouts,
    alignments: SECTION_INSTANCE_ALIGNMENTS,
    scales: SECTION_INSTANCE_SCALES,
    mediaStrategies: SECTION_INSTANCE_MEDIA_STRATEGIES,
    backgroundStrategies: SECTION_TONE_STRATEGIES,
    maxSubsetIndexes: ASSISTED_SITE_GENERATION_LIMITS_V1.maxSubsetIndexes,
  }
}

export function buildAssistedSiteGenerationRequestContextV1(params: {
  architecture: OrvenixSiteArchitecture
  creativeDirection?: CreativeSiteDirectionV1 | null
  designReferences?: CreativeDesignReferenceV1[]
}): AssistedSiteGenerationRequestContextV1 {
  const { architecture } = params
  const usedRoles = new Set<SectionRole>()

  const pages: AssistedSiteGenerationPageContextV1[] = architecture.pages.map((page) => {
    const roles = page.sections.map((section) => section.role)
    for (const role of roles) usedRoles.add(role)
    return { slug: page.slug, purpose: page.purpose, archetype: page.archetype, roles }
  })

  const objective = architecture.businessObjective?.trim() || architecture.objective?.trim() || undefined
  const industry = architecture.industry?.trim() || undefined
  const location = architecture.location?.trim() || undefined

  const narrowedDirection = narrowCreativeDirectionContext(params.creativeDirection)
  const designReferences = params.designReferences?.length ? params.designReferences : undefined

  return {
    business: {
      ...(industry ? { industry } : {}),
      ...(objective ? { objective } : {}),
      ...(location ? { location } : {}),
    },
    pages,
    offerings: {
      ...(architecture.services?.length ? { services: architecture.services } : {}),
      ...(architecture.products?.length ? { products: architecture.products } : {}),
    },
    ...(narrowedDirection ? { creativeDirection: narrowedDirection } : {}),
    ...(designReferences ? { designReferences } : {}),
    capabilities: buildCapabilities(usedRoles),
  }
}
