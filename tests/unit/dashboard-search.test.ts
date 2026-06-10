import assert from "node:assert/strict"
import test from "node:test"

import { mergeDashboardViewQuery } from "../../lib/store/dashboard-search"

test("dashboard search merge preserves unrelated params while replacing scoped keys", () => {
  const query = mergeDashboardViewQuery(
    new URLSearchParams("q=pedido&status=paid&runResult=failed&tab=automations"),
    ["q", "status", "context"],
    "q=nuevo&context=offer"
  )

  assert.equal(query, "runResult=failed&tab=automations&q=nuevo&context=offer")
})

test("dashboard search merge can clear a scoped view completely", () => {
  const query = mergeDashboardViewQuery(
    new URLSearchParams("runAutomationId=auto_1&runResult=failed&tab=automations"),
    ["runAutomationId", "runResult", "runTrigger"],
    ""
  )

  assert.equal(query, "tab=automations")
})
