import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type {
  SectionInstanceAlignment,
  SectionInstanceMediaStrategy,
  SectionInstanceScale,
  SectionToneStrategy,
} from "@/lib/orvenix-ai/composer/composition-context"
import type { SectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import type { SectionInstanceSelection, SectionInstanceTreatment } from "@/lib/orvenix-ai/architect/composition-plan"

export const ASSISTED_SITE_GENERATION_CONTRACT_V1_VERSION = 1
export const ASSISTED_SITE_GENERATION_ROLE_KEY_V1 = "assisted_site_generation_v1"
export const ASSISTED_SITE_GENERATION_STRATEGY_KEY_V1 = "composition_layout_advisory_v1"

export const ASSISTED_SITE_GENERATION_SECTION_ROLES_V1 = [
  "navigation",
  "hero",
  "trust",
  "services",
  "features",
  "gallery",
  "products",
  "pricing",
  "testimonials",
  "process",
  "faq",
  "contact",
  "cta",
  "footer",
  "content",
] as const satisfies readonly SectionRole[]

export type AssistedSiteGenerationSelectionV1 = SectionInstanceSelection

export type AssistedSiteGenerationCompositionV1 = {
  treatment?: SectionInstanceTreatment
  alignment?: SectionInstanceAlignment
  scale?: SectionInstanceScale
  mediaStrategy?: SectionInstanceMediaStrategy
  backgroundStrategy?: SectionToneStrategy
  layout?: SectionVisualLayoutPlan
}

export type AssistedSiteGenerationInstanceV1 = {
  role: SectionRole
  selection?: AssistedSiteGenerationSelectionV1
  composition?: AssistedSiteGenerationCompositionV1
}

export type AssistedSiteGenerationPageV1 = {
  slug: string
  sectionOrder?: SectionRole[]
  instances?: AssistedSiteGenerationInstanceV1[]
}

export type AssistedSiteGenerationProposalV1 = {
  version: typeof ASSISTED_SITE_GENERATION_CONTRACT_V1_VERSION
  roleKey: typeof ASSISTED_SITE_GENERATION_ROLE_KEY_V1
  strategyKey: typeof ASSISTED_SITE_GENERATION_STRATEGY_KEY_V1
  siteNarrative?: string
  pages: AssistedSiteGenerationPageV1[]
}

export interface AssistedSiteGenerationProviderV1 {
  request(input: unknown): Promise<unknown>
}

export type AssistedSiteGenerationValidationResultV1 =
  | { ok: true; value: AssistedSiteGenerationProposalV1; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] }
