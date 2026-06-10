import assert from "node:assert/strict"
import test from "node:test"

import { getAutomationRunPayloadDetails } from "../../lib/automation/run-payload"

test("automation run payload prefers customer email in summary", () => {
  const result = getAutomationRunPayloadDetails({
    orderId: "order_123",
    customerEmail: "cliente@orvenix.com",
    funnelId: "fn_1",
    funnelStep: "upsell",
  })

  assert.equal(result.summary, "Cliente: cliente@orvenix.com")
  assert.equal(result.orderId, "order_123")
  assert.equal(result.customerEmail, "cliente@orvenix.com")
  assert.equal(result.funnelId, "fn_1")
  assert.equal(result.funnelStep, "upsell")
})

test("automation run payload falls back to collection or event labels", () => {
  const cms = getAutomationRunPayloadDetails({ collectionSlug: "blog", recordId: "rec_1" })
  const event = getAutomationRunPayloadDetails({ eventLabel: "checkout_timeout" })

  assert.equal(cms.summary, "Colección: blog")
  assert.equal(cms.recordId, "rec_1")
  assert.equal(event.summary, "Evento: checkout_timeout")
})

test("automation run payload handles empty payloads safely", () => {
  const result = getAutomationRunPayloadDetails(null)

  assert.equal(result.summary, "Sin contexto adicional")
  assert.equal(result.email, null)
  assert.equal(result.customerEmail, null)
})
