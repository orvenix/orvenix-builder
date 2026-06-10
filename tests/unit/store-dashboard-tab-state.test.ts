import assert from "node:assert/strict"
import test from "node:test"

import {
  buildStoreDashboardTabQuery,
  parseStoreDashboardTab,
} from "../../lib/store/dashboard-tab-state"

test("store dashboard tab query omits default products tab", () => {
  assert.equal(buildStoreDashboardTabQuery("products"), "")
  assert.equal(buildStoreDashboardTabQuery("orders"), "tab=orders")
})

test("store dashboard tab parser validates allowed tabs", () => {
  const parsed = parseStoreDashboardTab(new URLSearchParams("tab=automations"))
  const fallback = parseStoreDashboardTab(new URLSearchParams("tab=weird"))

  assert.equal(parsed, "automations")
  assert.equal(fallback, "products")
})
