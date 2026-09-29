import type { SectionRole } from "@/lib/orvenix-ai/architect"
import {
  ROLE_TREATMENT_VOCABULARY,
  ROLE_VISUAL_PRIMITIVE_VOCABULARY,
  selectGroundedIndexes,
  selectGroundedItems,
  type SectionInstancePlan,
} from "@/lib/orvenix-ai/architect/composition-plan"
import {
  visualLayoutForRole,
  visualLayoutMirrorsContent,
  visualLayoutRhythmToScale,
  visualLayoutToPrimitive,
  visualPrimitiveToLayout,
} from "@/lib/orvenix-ai/composer/visual-layout-plan"
import type { SectionCompositionContext } from "@/lib/orvenix-ai/composer"

/**
 * V2-6.1: which SectionCompositionContext array field holds the real,
 * repeatable business data for a given role -- the ONLY fields a
 * SectionInstancePlan's `selection` is currently allowed to slice.
 * Deliberately partial: a role with no entry here (eg. "gallery", which
 * has no business-data array today -- see architecture research) simply
 * never has its context sliced, regardless of `selection.mode` -- the
 * instance still applies its `composition` directives. Extending this
 * table is how a future role gains grounded per-item selection; it never
 * requires touching the CompositionPlan contract itself.
 */
const REPEATABLE_ROLE_SOURCE_FIELD: Partial<Record<SectionRole, "services" | "products" | "testimonials" | "trustPeople">> = {
  services: "services",
  products: "products",
  testimonials: "testimonials",
  trust: "trustPeople",
}

/**
 * Translates one SectionInstancePlan's `composition.treatment` onto the
 * ONE existing composer field that role's treatment vocabulary actually
 * maps to (see ROLE_TREATMENT_VOCABULARY / composition-context.ts). A
 * treatment that isn't valid for this role's vocabulary is silently
 * ignored rather than guessed -- same "absent -> unchanged" safety as
 * every other AI-hint field already in SectionCompositionContext.
 */
function applyTreatment(role: SectionRole, treatment: string, ctx: SectionCompositionContext): SectionCompositionContext {
  const vocabulary = ROLE_TREATMENT_VOCABULARY[role]
  if (!vocabulary || !vocabulary.includes(treatment)) return ctx

  if (role === "hero") return { ...ctx, richComposition: true, aiPreferredHeroTreatment: treatment as SectionCompositionContext["aiPreferredHeroTreatment"] }
  if (role === "trust") return { ...ctx, richComposition: true, aiPreferredTrustTreatment: treatment as SectionCompositionContext["aiPreferredTrustTreatment"] }
  if (role === "testimonials") return { ...ctx, richComposition: true, aiPreferredTestimonialTreatment: treatment as SectionCompositionContext["aiPreferredTestimonialTreatment"] }
  if (role === "contact") return { ...ctx, richComposition: true, aiPreferredBookingPresentation: treatment as SectionCompositionContext["aiPreferredBookingPresentation"] }
  if (role === "pricing") return { ...ctx, richComposition: true, aiPreferredPricingTreatment: treatment as SectionCompositionContext["aiPreferredPricingTreatment"] }
  return { ...ctx, richComposition: true, aiPremiumCompositionTreatment: treatment as SectionCompositionContext["aiPremiumCompositionTreatment"] }
}

/**
 * Builds the isolated, per-instance SectionCompositionContext for one
 * SectionInstancePlan. Pure: never mutates `baseContext` (every branch
 * returns a NEW object via spread), so the canonical
 * architecture.services/products/etc. arrays this context was built from
 * are never touched -- each instance gets its own bounded view, and a
 * sibling instance of the same role composed right after it starts from
 * the same untouched baseContext again.
 */
export function applySectionInstanceToContext(
  baseContext: SectionCompositionContext,
  instance: SectionInstancePlan,
): SectionCompositionContext {
  let context: SectionCompositionContext = { ...baseContext }

  const sourceField = REPEATABLE_ROLE_SOURCE_FIELD[instance.role]
  if (sourceField && instance.selection.mode !== "all") {
    const source = baseContext[sourceField] as unknown[] | undefined
    const selected = selectGroundedItems(source, instance.selection)
    context = { ...context, [sourceField]: selected } as SectionCompositionContext
  }

  const composition = instance.composition

  // COMMERCE-5B: detail targets are keyed by source product index; align them with the selected products.
  if (instance.role === "products" && composition?.productDetailLinks?.length) {
    const hrefByIndex = new Map(composition.productDetailLinks.map((link) => [link.productIndex, link.href]))
    const indexes = selectGroundedIndexes(baseContext.products?.length ?? 0, instance.selection)
    const hrefs = indexes.map((index) => hrefByIndex.get(index))
    if (hrefs.some(Boolean)) context = { ...context, commerceProductDetailHrefs: hrefs }
  }
  if (composition) {
    if (composition.treatment) context = applyTreatment(instance.role, composition.treatment, context)
    if (composition.backgroundStrategy) {
      context = { ...context, richComposition: true, aiSectionToneStrategy: composition.backgroundStrategy }
      if (instance.role === "contact" && composition.backgroundStrategy === "contrast-led") {
        context = { ...context, instanceContrastBackground: true }
      }
    }
    if (composition.scale) context = { ...context, instanceScale: composition.scale }
    if (composition.alignment) context = { ...context, instanceAlignment: composition.alignment }
    if (composition.mediaStrategy) context = { ...context, instanceMediaStrategy: composition.mediaStrategy }
    if (composition.navigationSlugs?.length) {
      const wanted = new Set(composition.navigationSlugs)
      const bySlug = new Map((baseContext.sitePages ?? []).map((page) => [page.slug, page]))
      const ordered = composition.navigationSlugs.map((slug) => bySlug.get(slug)).filter((page): page is NonNullable<SectionCompositionContext["sitePages"]>[number] => Boolean(page))
      const home = bySlug.get("home")
      context = { ...context, sitePages: home && !wanted.has("home") ? [home, ...ordered] : ordered }
    }
    if (composition.ctaAction) context = { ...context, commerceCtaAction: composition.ctaAction }
    if (composition.omitCta) context = { ...context, instanceOmitCta: true }
    if (composition.narrativeIntent) context = { ...context, instanceNarrativeIntent: composition.narrativeIntent }
    if (composition.categoryLinks?.length) context = { ...context, commerceCategoryLinks: composition.categoryLinks }
    if (composition.emphasis === "opening" && instance.role === "hero") context = { ...context, instanceOmitCta: true }

    /*
     * V2-6.2: "Unknown primitive -> standard/fallback. Never execute
     * arbitrary input." -- a visualPrimitive not listed as valid for
     * THIS instance's role is silently dropped (context.instanceVisualPrimitive
     * stays unset, every composer function's "standard" default applies)
     * rather than guessed or forwarded as-is.
     */
    const explicitLayout = visualLayoutForRole(instance.role, composition.layout)
    const legacyLayout = !explicitLayout && composition.visualPrimitive
      ? visualPrimitiveToLayout(composition.visualPrimitive, composition.alignment)
      : undefined
    const instanceVisualLayout = explicitLayout ?? (legacyLayout && visualLayoutForRole(instance.role, legacyLayout))

    if (instanceVisualLayout) {
      const primitive = visualLayoutToPrimitive(instanceVisualLayout)
      const scaleFromRhythm = visualLayoutRhythmToScale(instanceVisualLayout)
      context = {
        ...context,
        instanceVisualLayout,
        ...(primitive ? { instanceVisualPrimitive: primitive } : {}),
        ...(visualLayoutMirrorsContent(instanceVisualLayout) ? { instanceAlignment: "right" as const } : {}),
        ...(scaleFromRhythm ? { instanceScale: scaleFromRhythm } : {}),
      }
    } else if (composition.visualPrimitive && composition.visualPrimitive !== "standard") {
      const allowedPrimitives = ROLE_VISUAL_PRIMITIVE_VOCABULARY[instance.role]
      if (allowedPrimitives?.includes(composition.visualPrimitive)) {
        context = { ...context, instanceVisualPrimitive: composition.visualPrimitive }
      }
    }
  }

  if (instance.selection.mode === "single-item") context = { ...context, singleItemInstance: true }
  // COMMERCE-3C: an explicit curated selection must not be re-truncated by archetype teaser rules downstream.
  if (instance.selection.mode !== "all") context = { ...context, instanceSelectionApplied: true }

  return context
}
