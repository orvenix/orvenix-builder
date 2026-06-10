import assert from "node:assert/strict"
import test from "node:test"

import {
  duplicateFunnelDraftStep,
  moveFunnelDraftStep,
  type EditableFunnelDraftStep,
} from "../../lib/commerce/funnel-draft-steps"

const baseSteps: EditableFunnelDraftStep[] = [
  { id: "step_1", kind: "landing", position: 0, pageId: "page_1", settings: { headline: "Hola" } },
  { id: "step_2", kind: "checkout", position: 1, pageId: "page_2", settings: { checkoutMode: "store" } },
  { id: "step_3", kind: "thankyou", position: 2, pageId: "page_3", settings: { message: "Gracias" } },
]

test("funnel draft steps move up/down and normalize positions", () => {
  const movedDown = moveFunnelDraftStep(baseSteps, 0, 1)
  assert.deepEqual(
    movedDown.map((step) => [step.id, step.position]),
    [["step_2", 0], ["step_1", 1], ["step_3", 2]]
  )

  const movedUp = moveFunnelDraftStep(baseSteps, 2, -1)
  assert.deepEqual(
    movedUp.map((step) => [step.id, step.position]),
    [["step_1", 0], ["step_3", 1], ["step_2", 2]]
  )
})

test("funnel draft steps ignore invalid move indexes", () => {
  assert.equal(moveFunnelDraftStep(baseSteps, 0, -1), baseSteps)
  assert.equal(moveFunnelDraftStep(baseSteps, 2, 1), baseSteps)
  assert.equal(moveFunnelDraftStep(baseSteps, 9, 1), baseSteps)
})

test("funnel draft steps duplicate the selected step after itself", () => {
  const duplicated = duplicateFunnelDraftStep(baseSteps, 1, () => "step_2_copy")

  assert.deepEqual(
    duplicated.map((step) => [step.id, step.kind, step.position]),
    [
      ["step_1", "landing", 0],
      ["step_2", "checkout", 1],
      ["step_2_copy", "checkout", 2],
      ["step_3", "thankyou", 3],
    ]
  )
  assert.notEqual(duplicated[2]?.settings, baseSteps[1]?.settings)
  assert.deepEqual(duplicated[2]?.settings, baseSteps[1]?.settings)
})
