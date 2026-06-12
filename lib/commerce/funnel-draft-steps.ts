export type EditableFunnelDraftStep = {
  id: string
  kind: "landing" | "checkout" | "upsell" | "downsell" | "thankyou"
  position: number
  pageId: string | null
  settings?: Record<string, unknown> | null
}

function normalizeStepPositions<T extends EditableFunnelDraftStep>(steps: T[]) {
  return steps.map((step, index) => ({
    ...step,
    position: index,
  }))
}

export function moveFunnelDraftStep<T extends EditableFunnelDraftStep>(
  steps: T[],
  fromIndex: number,
  direction: -1 | 1
): T[] {
  const targetIndex = fromIndex + direction
  if (fromIndex < 0 || fromIndex >= steps.length) return steps
  if (targetIndex < 0 || targetIndex >= steps.length) return steps

  const nextSteps = steps.slice()
  const [step] = nextSteps.splice(fromIndex, 1)
  nextSteps.splice(targetIndex, 0, step)
  return normalizeStepPositions(nextSteps)
}

export function duplicateFunnelDraftStep<T extends EditableFunnelDraftStep>(
  steps: T[],
  index: number,
  createId: () => string
): T[] {
  if (index < 0 || index >= steps.length) return steps

  const source = steps[index]
  const clone = {
    ...source,
    id: createId(),
    settings: source.settings ? { ...source.settings } : source.settings ?? {},
  } as T

  const nextSteps = steps.slice()
  nextSteps.splice(index + 1, 0, clone)
  return normalizeStepPositions(nextSteps)
}
