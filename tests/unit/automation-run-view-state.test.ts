import assert from "node:assert/strict"
import test from "node:test"

import {
  buildAutomationRunsViewQuery,
  parseAutomationRunsViewState,
} from "../../lib/automation/run-view-state"

test("automation run view state builds compact query strings", () => {
  const query = buildAutomationRunsViewQuery({
    automationId: " auto_1 ",
    result: "failed",
    trigger: "store_checkout_started",
  })

  assert.equal(query, "runAutomationId=auto_1&runResult=failed&runTrigger=store_checkout_started")
})

test("automation run view state omits default filters", () => {
  const query = buildAutomationRunsViewQuery({
    automationId: "",
    result: "all",
    trigger: "all",
  })

  assert.equal(query, "")
})

test("automation run view state parses and validates search params", () => {
  const state = parseAutomationRunsViewState(
    new URLSearchParams("runAutomationId=auto_9&runResult=processed&runTrigger=cms_record_created")
  )
  const fallback = parseAutomationRunsViewState(
    new URLSearchParams("runResult=weird&runTrigger=bad")
  )

  assert.equal(state.automationId, "auto_9")
  assert.equal(state.result, "processed")
  assert.equal(state.trigger, "cms_record_created")
  assert.equal(fallback.result, "all")
  assert.equal(fallback.trigger, "all")
})
