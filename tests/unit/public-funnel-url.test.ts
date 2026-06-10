import assert from "node:assert/strict"
import test from "node:test"

import { buildPublicFunnelActionHref } from "../../lib/commerce/public-funnel-url"

test("public funnel url adds and removes params predictably", () => {
  const href = buildPublicFunnelActionHref("/p/site", {
    funnelId: "fn_1",
    storeCheckout: "failure",
    orderId: "order_123",
  }, {
    cart: "open",
    storeCheckout: null,
    orderId: null,
  })

  assert.equal(href, "/p/site?funnelId=fn_1&cart=open")
})

test("public funnel url preserves offer context when opening the cart", () => {
  const href = buildPublicFunnelActionHref("/p/site", {
    funnelId: "fn_1",
    funnelStep: "upsell",
  }, {
    cart: "open",
    offerStepKind: "upsell",
    offerType: "discount",
    offerLabel: "Promo VIP",
    offerValue: "20%",
    offerDiscountPercent: "20",
  })

  assert.equal(
    href,
    "/p/site?funnelId=fn_1&funnelStep=upsell&cart=open&offerStepKind=upsell&offerType=discount&offerLabel=Promo+VIP&offerValue=20%25&offerDiscountPercent=20"
  )
})
