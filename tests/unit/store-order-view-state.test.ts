import assert from "node:assert/strict"
import test from "node:test"

import {
  buildStoreOrdersViewQuery,
  parseStoreOrdersViewState,
} from "../../lib/store/order-view-state"

test("store order view state builds compact query strings", () => {
  const query = buildStoreOrdersViewQuery({
    q: " maria ",
    status: "paid",
    context: "offer",
    step: " upsell ",
    offerType: " discount ",
    facetKey: " step ",
  })

  assert.equal(query, "q=maria&status=paid&context=offer&orderStep=upsell&orderOfferType=discount&orderFacetKey=step")
})

test("store order view state omits default filters", () => {
  const query = buildStoreOrdersViewQuery({
    q: "",
    status: "all",
    context: "all",
    step: "",
    offerType: "",
    facetKey: "",
  })

  assert.equal(query, "")
})

test("store order view state parses and validates search params", () => {
  const state = parseStoreOrdersViewState(
    new URLSearchParams("q=pedido+vip&status=fulfilled&context=funnel&orderStep=checkout&orderOfferType=discount&orderFacetKey=offerType")
  )
  const fallback = parseStoreOrdersViewState(new URLSearchParams("status=weird&context=bad"))

  assert.equal(state.q, "pedido vip")
  assert.equal(state.status, "fulfilled")
  assert.equal(state.context, "funnel")
  assert.equal(state.step, "checkout")
  assert.equal(state.offerType, "discount")
  assert.equal(state.facetKey, "offerType")
  assert.equal(fallback.status, "all")
  assert.equal(fallback.context, "all")
  assert.equal(fallback.step, "")
  assert.equal(fallback.offerType, "")
  assert.equal(fallback.facetKey, "")
})
