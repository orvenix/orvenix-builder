import type { CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts"
import type { NodeProps } from "@/types/editor"
import type { PageArchetype, SectionRole } from "@/lib/orvenix-ai/architect"
import type { NormalizedSiteCreationBusinessEvidenceV1 } from "@/lib/orvenix-ai/site-creation/evidence-normalization"
import type { SectionVisualLayoutPlan } from "./visual-layout-plan"
import type {
  SectionInstanceAlignment,
  SectionInstanceMediaStrategy,
  SectionInstanceScale,
  SectionInstanceVisualPrimitive,
} from "./composition-context"

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
  /** V2-S1: parallel optional collection to `services` -- eg. restaurant dishes, store products. COMMERCE-1: optional grounded commerce facts (see commerce/product-facts.ts). */
  products?: CommerceProductFactV1[]
  location?: string
  businessEvidence?: NormalizedSiteCreationBusinessEvidenceV1
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

  /**
   * V2-5C: bounded, ALREADY-VALIDATED-AND-SANITIZED Creative Director
   * overrides for the V2-5B executable vocabulary -- same "absent ->
   * existing weighted/deterministic selection, never a lock" contract
   * as aiPreferredHeroVariant above. Each is defensively re-checked
   * against its composition-context.ts source-of-truth array at the
   * point of use (never trusted blindly), matching the existing
   * aiPreferredHeroVariant re-check pattern.
   */
  aiPreferredHeroTreatment?: "standard" | "abstract-glow"
  aiPreferredProcessTreatment?: "cards" | "numbered"
  aiPreferredTwoItemLayoutTreatment?: "paired" | "cards"
  /** V2-5C: a STRATEGY, never a color/class -- Orvenix resolves the actual per-section tone pool from it (see SECTION_TONE_POOLS). */
  aiSectionToneStrategy?: "standard" | "soft-rhythm" | "contrast-led"

  /**
   * V2-5C.1: bounded, ALREADY-VALIDATED-AND-SANITIZED Creative Director
   * navigation overrides, site-level (spread into every section's
   * context alongside aiDensity, so every page's siteNav sees the same
   * choice -- see NAVIGATION_* vocabulary, composition-context.ts).
   * Absent -> composeNavigation's existing pre-V2-5C.1 defaults,
   * unchanged. The header's light/dark color pairing itself is never
   * one of these -- see aiPreferredHeroTreatment/aiPreferredHeroVariant
   * above, which resolveNavigationSurface (section-composer.ts) reads
   * to derive it safely.
   */
  aiPreferredNavigationSurfaceStyle?: "glass" | "solid"
  aiPreferredNavigationContainment?: "integrated" | "floating"
  aiPreferredNavigationLinkStyle?: "pill" | "minimal"
  aiPreferredNavigationCtaEmphasis?: "prominent" | "none"

  /** V2-5D: bounded trust/conversion presentation hints. Enums only, never content or claims. */
  aiPreferredTrustTreatment?: "standard" | "credibility-strip" | "person-cards" | "logo-strip"
  aiPreferredTestimonialTreatment?: "standard" | "rating-led"
  aiPreferredBookingPresentation?: "standard" | "booking-card"
  /** V2-5E: bounded premium composition intent. Presentation only; never CSS/copy/facts. */
  aiPremiumCompositionTreatment?: "standard-grid" | "featured-asymmetric" | "editorial-alternating" | "bento" | "media-led"
  /** V2-5G: bounded pricing presentation intent only -- never a real price, discount, billing claim, or performance/popularity claim. */
  aiPreferredPricingTreatment?: "standard" | "tier-highlight"
  /** Internal, already-resolved usable asset source. Empty/absent means media-dependent geometry must not render. */
  resolvedMediaAsset?: { src: string; alt?: string }
  resolvedGalleryAssets?: Array<{ src: string; alt?: string }>

  /**
   * V2-5B: real, structured, caller-supplied content ONLY -- consumed
   * exactly like `services`/`products` above (same shape, same
   * "absent/empty -> deterministic generic fallback, never fabricated"
   * rule). Nothing in this phase populates these yet (no Creative
   * Director/retrieval wiring), so composing without them is the
   * current, unchanged default behavior everywhere.
   */
  processSteps?: Array<{
    name: string
    description?: string
  }>
  /** Real numeric/stat facts only -- e.g. a caller-verified years-active count. Never invented by the composer itself. */
  credibilityStats?: Array<{
    value: string
    label: string
  }>
  /** V2-5D: real structured trust data only. The composer never fabricates these. */
  trustPeople?: Array<{
    name: string
    role?: string
    detail?: string
  }>
  trustOrganizations?: Array<{
    name: string
  }>
  testimonials?: Array<{
    quote: string
    author?: string
    role?: string
    rating?: string
  }>

  /**
   * V2-5B: explicit opt-in for the new hero-treatment/background-rhythm/
   * paired-layout/numbered-process capabilities. Absent/false ->
   * byte-identical to pre-V2-5B output (this is what every existing
   * caller/test gets, unchanged). No Creative Director/retrieval wires
   * this yet in this phase -- it exists so the new capabilities are
   * real and independently exercisable/testable without silently
   * changing the current deterministic pipeline's default output.
   */
  richComposition?: boolean

  /**
   * V2-5B refinement: the ONE resolved theme value composition
   * currently has any reason to need -- not the whole GlobalTheme
   * object, which nothing upstream of composeSection currently passes
   * through anyway. Optional and additive: absent -> the existing
   * neutral (non-blue-presuming) fallback. Used only by SectionTone's
   * "accent-soft" background.
   */
  accentColor?: string

  /**
   * V2-6.1: bounded, purely additive Composition Plan instance directives
   * -- set ONLY by the deterministic compiler translation of a
   * SectionInstancePlan (see architect/composition-plan.ts and
   * compiler/section-instance-context.ts), never directly by an AI/user
   * choice. Absent on every existing caller -> byte-identical pre-V2-6.1
   * behavior; this is the same "absent means unchanged" contract every
   * other aiPreferred-style / richComposition field above already follows.
   */
  instanceScale?: SectionInstanceScale
  instanceAlignment?: SectionInstanceAlignment
  instanceMediaStrategy?: SectionInstanceMediaStrategy
  /**
   * True only for a deliberately curated single-item CompositionPlan
   * instance (eg. one of several separately-composed "services"
   * instances, each bound to exactly one real item). Lets featured/
   * media-led treatments apply to a single real item instead of the
   * ordinary "needs >=2/3 items" guardrail meant for accidental short
   * real-business lists -- never set for a naturally-short collection.
   */
  singleItemInstance?: boolean
  /** True only when this instance's composition directive says "opening" emphasis for a hero-role instance -- suppresses the CTA row so a typographic opening can have no call-to-action. */
  instanceOmitCta?: boolean
  /** True only when a contact-role instance's backgroundStrategy directive is "contrast-led" -- lets a contact section match the CTA section's dark surface so the two visually read as one composed closing, without inventing a merged node type. */
  instanceContrastBackground?: boolean

  /**
   * V2-6.2: the bounded visual composition primitive this instance
   * requested (see composition-context.ts). Absent/"standard" -> every
   * composer function's exact pre-V2-6.2 rendering, unchanged. Only ever
   * set by the compiler's validated translation of a SectionInstancePlan
   * -- never a direct AI/user choice, never free text.
   */
  instanceVisualPrimitive?: SectionInstanceVisualPrimitive
  /** VisualLayoutPlan V1: canonical bounded executable visual grammar for this section instance. */
  instanceVisualLayout?: SectionVisualLayoutPlan
}
