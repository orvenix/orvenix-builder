import { getFunnelOfferApplyLabel, getFunnelOfferSkipLabel, getFunnelStepActionLabel } from "./funnel-step-copy"
import type { EditableFunnelDraftStep } from "./funnel-draft-steps"

export type FunnelDraftTransitionSummary = {
  currentStepId: string
  currentKind: EditableFunnelDraftStep["kind"]
  advanceLabel: string
  nextStepId: string | null
  nextStepKind: EditableFunnelDraftStep["kind"] | null
  offerAcceptLabel?: string
  offerSkipLabel?: string
}

export function getFunnelDraftTransitionSummary(
  steps: EditableFunnelDraftStep[],
  stepId: string
): FunnelDraftTransitionSummary | null {
  const orderedSteps = steps.slice().sort((left, right) => left.position - right.position)
  const currentIndex = orderedSteps.findIndex((step) => step.id === stepId)
  if (currentIndex < 0) return null

  const currentStep = orderedSteps[currentIndex]
  const nextStep = orderedSteps[currentIndex + 1] ?? null

  return {
    currentStepId: currentStep.id,
    currentKind: currentStep.kind,
    advanceLabel: getFunnelStepActionLabel(nextStep?.kind ?? null, "advance"),
    nextStepId: nextStep?.id ?? null,
    nextStepKind: nextStep?.kind ?? null,
    offerAcceptLabel: currentStep.kind === "upsell" || currentStep.kind === "downsell"
      ? getFunnelOfferApplyLabel(currentStep.kind)
      : undefined,
    offerSkipLabel: currentStep.kind === "upsell" || currentStep.kind === "downsell"
      ? getFunnelOfferSkipLabel(currentStep.kind)
      : undefined,
  }
}
