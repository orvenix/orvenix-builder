import assert from "node:assert/strict"
import test from "node:test"

import { getPublicCheckoutStatusNotice } from "../../lib/commerce/funnel-checkout-status"

test("checkout status notice returns null for unknown status", () => {
  assert.equal(getPublicCheckoutStatusNotice(null, "order_123"), null)
  assert.equal(getPublicCheckoutStatusNotice("other", "order_123"), null)
})

test("checkout status notice formats success state with short order id", () => {
  const result = getPublicCheckoutStatusNotice("success", "order_12345678", {
    primaryHref: "/p/site/funnel/thankyou",
    primaryLabel: "Ir al thank you",
    offerType: "discount",
    offerLabel: "Promo VIP",
    offerValue: "20%",
  })
  assert.ok(result)
  assert.equal(result?.tone, "emerald")
  assert.match(result?.title ?? "", /#12345678/)
  assert.equal(result?.ctaLabel, "Ir al thank you")
  assert.match(result?.detail ?? "", /Promo VIP/)
  assert.match(result?.detail ?? "", /20%/)
})

test("checkout status notice covers pending and failure", () => {
  const pending = getPublicCheckoutStatusNotice("pending", "order_abc", {
    primaryHref: "/p/site/checkout",
    primaryLabel: "Volver al checkout",
    offerType: "free_gift",
    offerLabel: "Regalo sorpresa",
  })
  const failure = getPublicCheckoutStatusNotice("failure", "order_def", {
    secondaryHref: "/p/site?cart=open",
    secondaryLabel: "Abrir carrito",
    offerType: "product",
    offerLabel: "Pack express",
    offerValue: "$99.00 MXN",
  })

  assert.equal(pending?.tone, "amber")
  assert.equal(failure?.tone, "red")
  assert.equal(pending?.ctaLabel, "Volver al checkout")
  assert.equal(failure?.secondaryLabel, "Abrir carrito")
  assert.match(pending?.detail ?? "", /regalo/i)
  assert.match(failure?.detail ?? "", /99\.00/)
})
