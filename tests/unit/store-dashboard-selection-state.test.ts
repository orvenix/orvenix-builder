import assert from "node:assert/strict"
import test from "node:test"

import {
  buildStoreDashboardSelectionQuery,
  parseStoreDashboardSelectionState,
} from "../../lib/store/dashboard-selection-state"

test("store dashboard selection query includes selected ids", () => {
  const query = buildStoreDashboardSelectionQuery({
    selectedOrderId: " order_123 ",
    expandedProductId: " product_8 ",
    editAutomationId: " auto_9 ",
    editFunnelId: " funnel_1 ",
    editExperimentId: " exp_4 ",
  })

  assert.equal(
    query,
    "selectedOrderId=order_123&expandedProductId=product_8&editAutomationId=auto_9&editFunnelId=funnel_1&editExperimentId=exp_4"
  )
})

test("store dashboard selection parser defaults to empty strings", () => {
  const parsed = parseStoreDashboardSelectionState(
    new URLSearchParams(
      "selectedOrderId=order_77&expandedProductId=product_2&editAutomationId=auto_5&editFunnelId=funnel_2&editExperimentId=exp_7"
    )
  )
  const fallback = parseStoreDashboardSelectionState(new URLSearchParams(""))

  assert.equal(parsed.selectedOrderId, "order_77")
  assert.equal(parsed.expandedProductId, "product_2")
  assert.equal(parsed.editAutomationId, "auto_5")
  assert.equal(parsed.editFunnelId, "funnel_2")
  assert.equal(parsed.editExperimentId, "exp_7")
  assert.equal(fallback.selectedOrderId, "")
  assert.equal(fallback.expandedProductId, "")
  assert.equal(fallback.editAutomationId, "")
  assert.equal(fallback.editFunnelId, "")
  assert.equal(fallback.editExperimentId, "")
})
