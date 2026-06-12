export type FunnelSequenceStepKind = "landing" | "checkout" | "upsell" | "downsell" | "thankyou"

export type FunnelStepSequenceLike = {
  id: string
  kind: FunnelSequenceStepKind
  position: number
}

function getSortedFunnelSteps(steps: readonly FunnelStepSequenceLike[]) {
  return steps.slice().sort((a, b) => a.position - b.position)
}

export function isFunnelStepKind(value: string | null | undefined): value is FunnelSequenceStepKind {
  return value === "landing"
    || value === "checkout"
    || value === "upsell"
    || value === "downsell"
    || value === "thankyou"
}

export function resolveCurrentFunnelStep<TStep extends FunnelStepSequenceLike>(
  steps: readonly TStep[],
  input: { stepId?: string | null; stepKind?: FunnelSequenceStepKind | null }
) {
  const orderedSteps = getSortedFunnelSteps(steps)
  if (input.stepId) {
    const byId = orderedSteps.find((entry) => entry.id === input.stepId)
    if (byId) return byId
  }

  if (input.stepKind) {
    return orderedSteps.find((entry) => entry.kind === input.stepKind) ?? null
  }

  return null
}

export function resolveNextFunnelStep<TStep extends FunnelStepSequenceLike>(
  steps: readonly TStep[],
  input: { stepId?: string | null; stepKind?: FunnelSequenceStepKind | null }
) {
  const orderedSteps = getSortedFunnelSteps(steps)
  const currentStep = resolveCurrentFunnelStep(orderedSteps, input)
  if (!currentStep) return null

  const currentIndex = orderedSteps.findIndex((entry) => entry.id === currentStep.id)
  if (currentIndex < 0) return null

  return orderedSteps[currentIndex + 1] ?? null
}
