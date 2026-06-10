import assert from "node:assert/strict"
import test from "node:test"

import {
  buildStoreProductsViewQuery,
  parseStoreProductAttributeFilters,
  parseStoreProductsViewState,
  serializeStoreProductAttributeFilters,
} from "../../lib/store/product-view-state"

test("store product view state builds compact query strings", () => {
  const query = buildStoreProductsViewQuery({
    q: " camiseta ",
    status: "active",
    stock: "low_stock",
    sort: "price_desc",
    attributes: [
      { key: " color ", value: " negro " },
      { key: " talla ", value: " M " },
    ],
    facetKey: " color ",
  })

  assert.equal(
    query,
    "productQ=camiseta&productStatus=active&productStock=low_stock&productSort=price_desc&productAttrs=color%3Anegro%7Ctalla%3AM&productFacetKey=color"
  )
})

test("store product view state omits default filters", () => {
  const query = buildStoreProductsViewQuery({
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [],
    facetKey: "",
  })

  assert.equal(query, "")
})

test("store product view state parses and validates search params", () => {
  const state = parseStoreProductsViewState(
    new URLSearchParams(
      "productQ=sku+negro&productStatus=draft&productStock=out_of_stock&productSort=name_asc&productAttrs=color%3Anegro%7Ctalla%3AM"
      + "&productFacetKey=color"
    )
  )
  const fallback = parseStoreProductsViewState(
    new URLSearchParams("productStatus=weird&productStock=bad&productSort=nope")
  )

  assert.equal(state.q, "sku negro")
  assert.equal(state.status, "draft")
  assert.equal(state.stock, "out_of_stock")
  assert.equal(state.sort, "name_asc")
  assert.deepEqual(state.attributes, [
    { key: "color", value: "negro" },
    { key: "talla", value: "M" },
  ])
  assert.equal(state.facetKey, "color")
  assert.equal(fallback.status, "all")
  assert.equal(fallback.stock, "all")
  assert.equal(fallback.sort, "newest")
  assert.deepEqual(fallback.attributes, [])
  assert.equal(fallback.facetKey, "")
})

test("store product attribute filters serialize and dedupe cleanly", () => {
  assert.equal(
    serializeStoreProductAttributeFilters([
      { key: " color ", value: " negro " },
      { key: " talla ", value: " M " },
    ]),
    "color:negro|talla:M"
  )

  assert.deepEqual(
    parseStoreProductAttributeFilters("color:negro|talla:M|color:negro|badtoken"),
    [
      { key: "color", value: "negro" },
      { key: "talla", value: "M" },
    ]
  )
})
