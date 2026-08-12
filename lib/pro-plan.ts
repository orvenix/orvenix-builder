import {
  normalizeOfficialPlanId,
  type OfficialPlanId,
} from "@/lib/orvenix-official-2026"

const ADVANCED_PLAN_IDS = new Set<OfficialPlanId>([
  "pro",
  "business",
  "enterprise",
])

export function isAdvancedBuilderPlan(
  planId: string | null | undefined,
): boolean {
  const normalizedPlanId = normalizeOfficialPlanId(planId)

  return normalizedPlanId
    ? ADVANCED_PLAN_IDS.has(normalizedPlanId)
    : false
}
