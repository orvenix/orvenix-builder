/**
 * V2-4 section 4/19: bounded section-ORDER authority (no presence removal
 * in this MVP -- see OPTIONAL_SECTION_PRESENCE=deferred in the report).
 * Pure, deterministic, no dependency on architect/composer types -- takes
 * plain role-string arrays so it stays trivially testable in isolation.
 *
 * Applied at the ARCHITECTURE stage (before compileSiteBlueprint runs),
 * never as a post-hoc reorder of a finished EditorTree -- "AI is planning,
 * not mutating" (section 19).
 */

/**
 * Validates `preferredOrder` against `defaultOrder` and returns the order
 * to actually use. Invalid input NEVER throws and NEVER fails the caller
 * -- it silently returns `defaultOrder` unchanged, so one page's invalid
 * ordering can never take down another page's valid guidance (section 8).
 *
 * Invariants enforced (all local, never AI-overridable):
 * - same role SET as defaultOrder (no invented roles, no duplicates, no
 *   missing roles -- presence is 100% preserved in this MVP)
 * - navigation stays first, footer stays last, when either role is present
 */
export function resolveCreativeDirectorSectionOrderV1(
  defaultOrder: readonly string[],
  preferredOrder: readonly string[] | undefined,
): string[] {
  const fallback = [...defaultOrder]
  if (!preferredOrder || preferredOrder.length !== defaultOrder.length) return fallback

  const defaultSet = new Set(defaultOrder)
  const preferredSet = new Set(preferredOrder)
  if (preferredSet.size !== preferredOrder.length) return fallback // duplicates
  if (preferredSet.size !== defaultSet.size) return fallback
  for (const role of preferredOrder) {
    if (!defaultSet.has(role)) return fallback // invented/unregistered role
  }

  if (defaultSet.has("navigation") && preferredOrder[0] !== "navigation") return fallback
  if (defaultSet.has("footer") && preferredOrder[preferredOrder.length - 1] !== "footer") return fallback

  return [...preferredOrder]
}
