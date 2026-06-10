import assert from "node:assert/strict"
import test from "node:test"

import {
  getStoreProductAttributeFacetGroups,
  getStoreProductAttributeFacetValues,
  getStoreProductAttributeFacets,
  filterStoreProducts,
  getStoreProductFilterCounts,
  getStoreProductSummaryMetrics,
} from "../../lib/store/product-filter-metrics"

const products = [
  {
    id: "prod_1",
    name: "Camiseta Base",
    description: "Playera de algodon",
    status: "active",
    variants: [
      { sku: "CAM-NEG-M", name: "Negra M", priceMxn: 500, stock: 3, attributes: { color: "negro", talla: "M" } },
      { sku: "CAM-BLA-G", name: "Blanca G", priceMxn: 650, stock: 0, attributes: { color: "blanco", talla: "G" } },
    ],
  },
  {
    id: "prod_2",
    name: "Sudadera Pro",
    description: "Sudadera premium",
    status: "draft",
    variants: [
      { sku: "SUD-AZU-L", name: "Azul L", priceMxn: 1200, stock: 7, attributes: { color: "azul", talla: "L" } },
    ],
  },
  {
    id: "prod_3",
    name: "Sticker Pack",
    description: "Accesorio promocional",
    status: "archived",
    variants: [
      { sku: "STI-001", name: "Pack", priceMxn: 100, stock: 0, attributes: { tipo: "accesorio" } },
    ],
  },
]

test("store product filters apply query, status and stock together", () => {
  const filtered = filterStoreProducts(products, {
    q: "negra",
    status: "active",
    stock: "low_stock",
    sort: "newest",
    attributes: [],
    facetKey: "",
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0]?.id, "prod_1")
})

test("store product filter counts preserve complementary filters", () => {
  const counts = getStoreProductFilterCounts(products, {
    q: "",
    status: "all",
    stock: "out_of_stock",
    sort: "newest",
    attributes: [],
    facetKey: "",
  })

  assert.equal(counts.status.all, 2)
  assert.equal(counts.status.active, 1)
  assert.equal(counts.status.archived, 1)
  assert.equal(counts.stock.all, 3)
  assert.equal(counts.stock.in_stock, 2)
  assert.equal(counts.stock.low_stock, 1)
  assert.equal(counts.stock.out_of_stock, 2)
})

test("store product filter counts respect active query text", () => {
  const counts = getStoreProductFilterCounts(products, {
    q: "sudadera",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [],
    facetKey: "",
  })

  assert.equal(counts.status.all, 1)
  assert.equal(counts.status.draft, 1)
  assert.equal(counts.stock.in_stock, 1)
  assert.equal(counts.stock.low_stock, 0)
})

test("store product summary metrics aggregate the filtered set", () => {
  const summary = getStoreProductSummaryMetrics([products[0], products[1]])

  assert.equal(summary.totalProducts, 2)
  assert.equal(summary.activeProducts, 1)
  assert.equal(summary.draftProducts, 1)
  assert.equal(summary.lowStockProducts, 1)
  assert.equal(summary.outOfStockProducts, 1)
  assert.equal(summary.totalUnits, 10)
})

test("store product filters can sort by highest price", () => {
  const filtered = filterStoreProducts(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "price_desc",
    attributes: [],
    facetKey: "",
  })

  assert.equal(filtered[0]?.id, "prod_2")
  assert.equal(filtered[1]?.id, "prod_1")
})

test("store product filters can match structured attributes", () => {
  const filtered = filterStoreProducts(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [{ key: "color", value: "negro" }],
    facetKey: "",
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0]?.id, "prod_1")
})

test("store product attribute facets respect current non-attribute filters", () => {
  const facets = getStoreProductAttributeFacets(products, {
    q: "",
    status: "active",
    stock: "all",
    sort: "newest",
    attributes: [],
    facetKey: "",
  })

  assert.deepEqual(facets.slice(0, 3), [
    { key: "color", value: "blanco", count: 1 },
    { key: "color", value: "negro", count: 1 },
    { key: "talla", value: "G", count: 1 },
  ])
})

test("store product attribute facets omit the active attribute chip", () => {
  const facets = getStoreProductAttributeFacets(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [{ key: "color", value: "negro" }],
    facetKey: "",
  })

  assert.equal(facets.some((facet) => facet.key === "color" && facet.value === "negro"), false)
})

test("store product attribute facets narrow to matching variants in the current subset", () => {
  const facets = getStoreProductAttributeFacets(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [{ key: "color", value: "negro" }],
    facetKey: "",
  }, 20)

  assert.equal(facets.some((facet) => facet.key === "talla" && facet.value === "G"), false)
  assert.equal(facets.some((facet) => facet.key === "talla" && facet.value === "M"), true)
})

test("store product attribute facet groups cluster values by key", () => {
  const groups = getStoreProductAttributeFacetGroups(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [],
    facetKey: "",
  })

  assert.deepEqual(groups[0], {
    key: "color",
    values: [
      { key: "color", value: "azul", count: 1 },
      { key: "color", value: "blanco", count: 1 },
      { key: "color", value: "negro", count: 1 },
    ],
  })
})

test("store product attribute facet values can expand one key", () => {
  const values = getStoreProductAttributeFacetValues(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [],
    facetKey: "",
  }, "talla")

  assert.deepEqual(values, [
    { key: "talla", value: "G", count: 1 },
    { key: "talla", value: "L", count: 1 },
    { key: "talla", value: "M", count: 1 },
  ])
})

test("store product expanded facet values can switch within the same key", () => {
  const values = getStoreProductAttributeFacetValues(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [{ key: "color", value: "negro" }],
    facetKey: "color",
  }, "color")

  assert.deepEqual(values, [
    { key: "color", value: "azul", count: 1 },
    { key: "color", value: "blanco", count: 1 },
    { key: "color", value: "negro", count: 1 },
  ])
})

test("store product filters can combine multiple structured attributes", () => {
  const filtered = filterStoreProducts(products, {
    q: "",
    status: "all",
    stock: "all",
    sort: "newest",
    attributes: [
      { key: "color", value: "negro" },
      { key: "talla", value: "M" },
    ],
    facetKey: "",
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0]?.id, "prod_1")
})
