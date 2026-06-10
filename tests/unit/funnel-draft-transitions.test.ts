import assert from "node:assert/strict"
import test from "node:test"

import { getFunnelDraftTransitionSummary } from "../../lib/commerce/funnel-draft-transitions"
import type { EditableFunnelDraftStep } from "../../lib/commerce/funnel-draft-steps"

const steps: EditableFunnelDraftStep[] = [
  { id: "step_1", kind: "landing", position: 0, pageId: "page_1", settings: {} },
  { id: "step_2", kind: "checkout", position: 1, pageId: "page_2", settings: {} },
  { id: "step_3", kind: "upsell", position: 2, pageId: "page_3", settings: {} },
  { id: "step_4", kind: "thankyou", position: 3, pageId: "page_4", settings: {} },
]

test("funnel draft transitions describe the next step action", () => {
  const summary = getFunnelDraftTransitionSummary(steps, "step_2")

  assert.deepEqual(summary, {
    currentStepId: "step_2",
    currentKind: "checkout",
    advanceLabel: "Ver oferta upsell",
    nextStepId: "step_3",
    nextStepKind: "upsell",
    offerAcceptLabel: undefined,
    offerSkipLabel: undefined,
  })
})

test("funnel draft transitions expose semantic offer actions for upsells", () => {
  const summary = getFunnelDraftTransitionSummary(steps, "step_3")

  assert.deepEqual(summary, {
    currentStepId: "step_3",
    currentKind: "upsell",
    advanceLabel: "Ver confirmacion final",
    nextStepId: "step_4",
    nextStepKind: "thankyou",
    offerAcceptLabel: "Aplicar upsell",
    offerSkipLabel: "Seguir sin upsell",
  })
})

test("funnel draft transitions fall back to generic continue on terminal step", () => {
  const summary = getFunnelDraftTransitionSummary(steps, "step_4")

  assert.deepEqual(summary, {
    currentStepId: "step_4",
    currentKind: "thankyou",
    advanceLabel: "Continuar",
    nextStepId: null,
    nextStepKind: null,
    offerAcceptLabel: undefined,
    offerSkipLabel: undefined,
  })
})
