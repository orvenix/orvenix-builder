import assert from "node:assert/strict"
import test from "node:test"

import { buildFunnelOfferPreviewLinks } from "../../lib/commerce/funnel-offer-preview-links"

test("funnel offer preview links build accept and decline URLs for checkout offers", () => {
  const result = buildFunnelOfferPreviewLinks("/p/site?noop=1".replace("?noop=1", ""), "checkout", {
    offer: {
      enabled: true,
      type: "order_bump",
      label: "Kit express",
      price: { priceMxn: 9900 },
    },
  })

  assert.ok(result)
  assert.equal(
    result?.acceptHref,
    "/p/site?cart=open&offerStepKind=checkout&offerType=order_bump&offerLabel=Kit+express&offerValue=%2499.00+MXN&offerPriceMxn=9900"
  )
  assert.equal(result?.declineHref, "/p/site")
})

test("funnel offer preview links return null when the step has no active offer", () => {
  const result = buildFunnelOfferPreviewLinks("/p/site", "upsell", {
    offer: { enabled: false, type: "discount" },
  })

  assert.equal(result, null)
})
