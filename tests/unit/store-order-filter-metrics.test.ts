import assert from "node:assert/strict"
import test from "node:test"

import {
  filterStoreOrders,
  getStoreOrderFilterCounts,
  getStoreOrderMetaFacetGroups,
  getStoreOrderMetaFacetValues,
  getStoreOrderSummaryMetrics,
} from "../../lib/store/order-filter-metrics"

const orders = [
  {
    id: "ord_1",
    customerEmail: "ana@example.com",
    customerName: "Ana",
    status: "pending",
    notes: "funnel:f_1|step:checkout|step_id:step_checkout_1",
    totalMxn: 3200,
  },
  {
    id: "ord_2",
    customerEmail: "mario@example.com",
    customerName: "Mario",
    status: "paid",
    notes: "offer_type:discount|offer_discount:1500|paid:mp_123",
    totalMxn: 8900,
  },
  {
    id: "ord_3",
    customerEmail: "sofia@example.com",
    customerName: "Sofia",
    status: "fulfilled",
    notes: "funnel:f_2|step:upsell|offer_type:free_gift",
    totalMxn: 12400,
  },
]

test("store order filters apply query, status and context together", () => {
  const filtered = filterStoreOrders(orders, {
    q: "upsell",
    status: "fulfilled",
    context: "offer",
    step: "",
    offerType: "",
    facetKey: "",
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0]?.id, "ord_3")
})

test("store order filter counts preserve the complementary filters", () => {
  const counts = getStoreOrderFilterCounts(orders, {
    q: "",
    status: "all",
    context: "offer",
    step: "",
    offerType: "",
    facetKey: "",
  })

  assert.equal(counts.status.all, 2)
  assert.equal(counts.status.paid, 1)
  assert.equal(counts.status.fulfilled, 1)
  assert.equal(counts.context.all, 3)
  assert.equal(counts.context.funnel, 2)
  assert.equal(counts.context.offer, 2)
  assert.equal(counts.context.paid, 2)
})

test("store order filter counts also respect active query text", () => {
  const counts = getStoreOrderFilterCounts(orders, {
    q: "mario",
    status: "all",
    context: "all",
    step: "",
    offerType: "",
    facetKey: "",
  })

  assert.equal(counts.status.all, 1)
  assert.equal(counts.status.paid, 1)
  assert.equal(counts.context.offer, 1)
  assert.equal(counts.context.funnel, 0)
})

test("store order summary metrics aggregate the filtered set", () => {
  const summary = getStoreOrderSummaryMetrics([
    orders[0],
    orders[2],
  ])

  assert.equal(summary.totalOrders, 2)
  assert.equal(summary.totalRevenueMxn, 15600)
  assert.equal(summary.pendingOrders, 1)
  assert.equal(summary.paidOrders, 1)
  assert.equal(summary.offerOrders, 1)
  assert.equal(summary.funnelOrders, 2)
})

test("store order filters can match a specific step id from order notes", () => {
  const filtered = filterStoreOrders(orders, {
    q: "step_checkout_1",
    status: "all",
    context: "all",
    step: "",
    offerType: "",
    facetKey: "",
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0]?.id, "ord_1")
})

test("store order meta facet groups derive steps and offer types from the current view", () => {
  const groups = getStoreOrderMetaFacetGroups(orders, {
    q: "",
    status: "all",
    context: "all",
    step: "",
    offerType: "",
    facetKey: "",
  })

  assert.deepEqual(groups, [
    {
      key: "step",
      label: "Paso funnel",
      values: [
        { value: "checkout", count: 1 },
        { value: "upsell", count: 1 },
      ],
    },
    {
      key: "offerType",
      label: "Tipo de oferta",
      values: [
        { value: "discount", count: 1 },
        { value: "free_gift", count: 1 },
      ],
    },
  ])
})

test("store order filters can match structured step and offer type", () => {
  const filtered = filterStoreOrders(orders, {
    q: "",
    status: "all",
    context: "all",
    step: "upsell",
    offerType: "free_gift",
    facetKey: "",
  })

  assert.equal(filtered.length, 1)
  assert.equal(filtered[0]?.id, "ord_3")
})

test("store order meta facet groups can switch values within the same dimension", () => {
  const groups = getStoreOrderMetaFacetGroups(orders, {
    q: "",
    status: "all",
    context: "all",
    step: "upsell",
    offerType: "",
    facetKey: "",
  })

  assert.deepEqual(groups, [
    {
      key: "step",
      label: "Paso funnel",
      values: [
        { value: "checkout", count: 1 },
      ],
    },
    {
      key: "offerType",
      label: "Tipo de oferta",
      values: [
        { value: "free_gift", count: 1 },
      ],
    },
  ])
})

test("store order expanded facet values expose more values for the selected dimension", () => {
  const values = getStoreOrderMetaFacetValues(orders, {
    q: "",
    status: "all",
    context: "all",
    step: "",
    offerType: "",
    facetKey: "offerType",
  }, "offerType")

  assert.deepEqual(values, [
    { value: "discount", count: 1 },
    { value: "free_gift", count: 1 },
  ])
})

test("store order expanded facet values ignore their own dimension while preserving the others", () => {
  const values = getStoreOrderMetaFacetValues(orders, {
    q: "",
    status: "all",
    context: "all",
    step: "upsell",
    offerType: "free_gift",
    facetKey: "offerType",
  }, "offerType")

  assert.deepEqual(values, [])

  const alternateSteps = getStoreOrderMetaFacetValues(orders, {
    q: "",
    status: "all",
    context: "all",
    step: "upsell",
    offerType: "",
    facetKey: "step",
  }, "step")

  assert.deepEqual(alternateSteps, [
    { value: "checkout", count: 1 },
  ])
})
