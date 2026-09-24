import type { SectionCompositionContext } from "./types"

/**
 * V2-3: deterministic, weighted structural-variant selection.
 *
 * Extends the same word-boundary-free, pure hash approach the pre-existing
 * `compositionVariant` in section-composer.ts already used (same hash
 * algorithm, same normalized-input philosophy) -- this module generalizes
 * it into a reusable, per-role, FAMILY-WEIGHTED selector instead of a flat
 * `hash % N`. VisualFamily remains the sole visual-styling authority (see
 * theme/visual-direction.ts, untouched); this module only decides which
 * STRUCTURAL treatment a section gets, never colors/fonts/radius.
 */

export function stableHash(source: string): number {
  let hash = 0
  for (let index = 0; index < source.length; index++) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }
  return hash
}

/**
 * Coarse business/page/section facts already present on
 * SectionCompositionContext, plus visualFamily and an explicit role tag
 * so two different roles on the SAME page never collide on the same hash
 * bucket by accident. No business name, no raw freeform description/
 * request text, no Math.random() -- identical normalized inputs always
 * produce the identical hash.
 *
 * Deliberately EXCLUDES pageSlug/pageName/compositionSeed: an
 * already-accepted invariant (see the "Independencia de slug" test in
 * autonomous-multipage-site-builder.test.ts) is that two pages with the
 * SAME archetype/purpose but different slugs/display names (eg.
 * "servicios" vs a business's own "tratamientos-clinicos") must behave
 * identically -- structure must be driven by semantic facts
 * (archetype/purpose/industry), never by what a business happened to
 * name its page. `role` alone already prevents different roles on the
 * same page from colliding, so dropping the page-identity fields loses
 * no real cross-role variety.
 */
function hashSource(context: SectionCompositionContext, role: string): string {
  return [
    role,
    context.visualFamily,
    context.siteType,
    context.industry,
    context.objective,
    context.audience,
    context.pagePurpose,
    context.archetype,
    context.preferredStyle,
  ]
    .filter(Boolean)
    .join("|")
}

/** family -> variant -> weight. Missing entries default to 1 (never 0 -- every family can still land on every variant, just less often). */
export type VariantWeightTable<TVariant extends string> = Partial<Record<string, Partial<Record<TVariant, number>>>>

/**
 * Weighted-but-not-locked deterministic pick: each variant is repeated
 * `weight` times in an expanded pool (minimum 1, so no variant is ever
 * fully unreachable for a family), then the pure hash of the normalized
 * context picks an index into that pool. Two businesses in the SAME
 * family with different industry/page/content facts hash to different
 * indices and can land on different variants; the SAME normalized facts
 * always land on the SAME variant (see V2-3 determinism tests).
 */
export function selectVariant<TVariant extends string>(
  context: SectionCompositionContext,
  role: string,
  variants: readonly TVariant[],
  weightTable: VariantWeightTable<TVariant> = {},
): TVariant {
  if (variants.length === 0) throw new Error(`selectVariant: no variants provided for role "${role}"`)
  if (variants.length === 1) return variants[0]

  const family = context.visualFamily ?? "professional"
  const familyWeights: Partial<Record<TVariant, number>> = weightTable[family] ?? {}

  const pool: TVariant[] = []
  for (const variant of variants) {
    const weight = Math.max(1, Math.round(familyWeights[variant] ?? 1))
    for (let i = 0; i < weight; i += 1) pool.push(variant)
  }

  const hash = stableHash(hashSource(context, role))
  return pool[hash % pool.length]
}

export type ContentDensity = "sparse" | "medium" | "dense"

/**
 * Derived, not threaded: content density comes from data already on the
 * context (structured services count today; extend here, not by adding
 * a new plumbed field, if another density signal is needed later).
 */
export function resolveContentDensity(context: SectionCompositionContext): ContentDensity {
  const count = context.services?.length ?? 0
  if (count >= 6) return "dense"
  if (count >= 3) return "medium"
  return "sparse"
}
