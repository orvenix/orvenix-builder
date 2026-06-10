import assert from "node:assert/strict"
import test from "node:test"

import {
  isFunnelStepKind,
  resolveCurrentFunnelStep,
  resolveNextFunnelStep,
} from "../../lib/commerce/funnel-step-sequence"

const steps = [
  { id: "step-checkout", kind: "checkout", position: 2, pageId: "page-checkout" },
  { id: "step-landing", kind: "landing", position: 1, pageId: "page-landing" },
  { id: "step-upsell", kind: "upsell", position: 3, pageId: "page-upsell" },
  { id: "step-thankyou", kind: "thankyou", position: 4, pageId: "page-thankyou" },
] as const

test("isFunnelStepKind validates known step kinds", () => {
  assert.equal(isFunnelStepKind("checkout"), true)
  assert.equal(isFunnelStepKind("upsell"), true)
  assert.equal(isFunnelStepKind("other"), false)
  assert.equal(isFunnelStepKind(null), false)
})

test("resolveCurrentFunnelStep prefers exact step id over kind", () => {
  const current = resolveCurrentFunnelStep(steps, {
    stepId: "step-upsell",
    stepKind: "checkout",
  })

  assert.ok(current)
  assert.equal(current?.id, "step-upsell")
  assert.equal(current?.kind, "upsell")
})

test("resolveCurrentFunnelStep falls back to ordered kind match", () => {
  const current = resolveCurrentFunnelStep(steps, {
    stepKind: "checkout",
  })

  assert.ok(current)
  assert.equal(current?.id, "step-checkout")
})

test("resolveNextFunnelStep advances by funnel position", () => {
  const next = resolveNextFunnelStep(steps, {
    stepId: "step-checkout",
  })

  assert.ok(next)
  assert.equal(next?.id, "step-upsell")
  assert.equal(next?.kind, "upsell")
})

test("resolveNextFunnelStep returns null on last step or unknown step", () => {
  assert.equal(resolveNextFunnelStep(steps, { stepId: "step-thankyou" }), null)
  assert.equal(resolveNextFunnelStep(steps, { stepId: "missing", stepKind: "downsell" }), null)
})
