import type { NodeProps } from "@/types/editor"
import type { PageArchetype, SectionRole } from "@/lib/orvenix-ai/architect"

export interface ComposedNode {
  tempId: string
  type: string
  displayName: string
  props: NodeProps
  children: string[]
}

export interface ComposedSection {
  role: SectionRole
  rootId: string
  nodes: Record<string, ComposedNode>
  purpose: string
}

export interface SectionCompositionContext {
  /** V2-3: structural-variant tendency input. Visual STYLING (color/font/radius) stays owned by theme/visual-direction.ts -- this only informs composition. */
  visualFamily?: string
  siteType?: string
  industry?: string
  objective?: string
  audience?: string
  businessName?: string
  services?: Array<{
    name: string
    description?: string
  }>
  /** V2-S1: parallel optional collection to `services` -- eg. restaurant dishes, store products. */
  products?: Array<{
    name: string
    description?: string
  }>
  location?: string
  /** The real, caller-supplied business objective -- see the identically
   * named field on OrvenixSiteArchitecture for why this is kept separate
   * from `objective` above. */
  businessObjective?: string
  sitePages?: Array<{
    name: string
    slug: string
    isHome?: boolean
  }>
  pageName?: string
  pageSlug?: string
  pagePurpose?: string
  archetype?: PageArchetype
  preferredStyle?: string
  sectionIndex?: number
  totalSections?: number
  compositionSeed?: string

  /**
   * V2-4: bounded, ALREADY-VALIDATED-AND-SANITIZED Creative Director hints
   * for THIS page specifically (matched by slug upstream in
   * blueprint-compiler.ts). Absent whenever Creative Director is disabled,
   * unavailable, or its proposal was rejected/sanitized-away for this
   * page -- every consumer of these fields must fall back to its existing
   * V2-1..V2-S3 deterministic behavior when they're undefined, so the
   * no-AI baseline is always byte/semantically unchanged.
   */
  aiHeroTitleSuggestion?: string
  aiHeroDescriptionSuggestion?: string
  aiPreferredHeroVariant?: string
  aiCtaIntent?: "appointment" | "quote" | "contact"
  aiHighlightedOfferings?: string[]
  aiAssetIntent?: { subject: string; mood?: string }
  /** V2-4: site-level (not per-page) -- reuses the SAME "lg"/"xl" paddingY tokens already used throughout section-composer.ts, never a new token. */
  aiDensity?: "compact" | "standard" | "spacious"
}
