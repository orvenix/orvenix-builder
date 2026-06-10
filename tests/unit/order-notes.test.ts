import assert from "node:assert/strict"
import test from "node:test"

import {
  appendOrderNote,
  getOrderNoteFilterMeta,
  getOrderNoteSummary,
  parseOrderNotes,
} from "../../lib/commerce/order-notes"

test("appendOrderNote preserves previous metadata when adding payment notes", () => {
  const result = appendOrderNote(
    "checkout_created|funnel:fn_1|step:upsell|offer_type:discount|offer_discount:200",
    "paid:12345:2026-06-04T10:00:00.000Z"
  )

  assert.match(result, /funnel:fn_1/)
  assert.match(result, /offer_discount:200/)
  assert.match(result, /paid:12345/)
})

test("parseOrderNotes extracts funnel and offer metadata", () => {
  const result = parseOrderNotes(
    "checkout_created|funnel:fn_1|step:downsell|step_id:step_123|offer_type:discount|offer_discount:250|paid:999:2026-06-04T10:00:00.000Z"
  )

  assert.equal(result.funnelId, "fn_1")
  assert.equal(result.step, "downsell")
  assert.equal(result.stepId, "step_123")
  assert.equal(result.offerType, "discount")
  assert.equal(result.offerDiscountMxn, 250)
  assert.equal(result.paidPaymentId, "999")
})

test("getOrderNoteSummary formats chips for dashboard orders", () => {
  const discount = getOrderNoteSummary(
    "checkout_created|funnel:fn_1|step:upsell|offer_type:discount|offer_discount:200"
  )
  const gift = getOrderNoteSummary(
    "checkout_created|funnel:fn_2|step:downsell|offer_type:free_gift|paid:123:2026-06-04T10:00:00.000Z"
  )

  assert.equal(discount.funnelLabel, "Funnel · upsell")
  assert.match(discount.offerLabel ?? "", /Descuento/)
  assert.equal(gift.funnelLabel, "Funnel · downsell")
  assert.equal(gift.offerLabel, "Regalo activo")
  assert.equal(gift.paidLabel, "Pago confirmado")
})

test("getOrderNoteFilterMeta exposes operational flags for dashboard filters", () => {
  const result = getOrderNoteFilterMeta(
    "checkout_created|funnel:fn_1|step:upsell|step_id:step_123|offer_type:discount|offer_discount:200|paid:123:2026-06-04T10:00:00.000Z"
  )

  assert.equal(result.hasFunnel, true)
  assert.equal(result.hasOffer, true)
  assert.equal(result.isPaidTracked, true)
  assert.equal(result.offerType, "discount")
  assert.equal(result.step, "upsell")
  assert.equal(result.stepId, "step_123")
})
