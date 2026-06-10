import assert from "node:assert/strict"
import test from "node:test"

import {
  applyFunnelStepOfferDraft,
  DEFAULT_FUNNEL_STEP_OFFER_DRAFT,
  getFunnelStepOfferDraft,
  getFunnelStepOfferSummary,
  validateFunnelStepOfferDraft,
} from "../../lib/commerce/funnel-offer-draft"

test("funnel offer draft returns disabled defaults when step has no offer", () => {
  assert.deepEqual(getFunnelStepOfferDraft({ headline: "Hola" }), DEFAULT_FUNNEL_STEP_OFFER_DRAFT)
})

test("funnel offer draft reads an existing discount offer", () => {
  const draft = getFunnelStepOfferDraft({
    offer: {
      enabled: true,
      type: "discount",
      label: "Promo cierre",
      price: { discountPercent: 15 },
    },
  })

  assert.equal(draft.enabled, true)
  assert.equal(draft.type, "discount")
  assert.equal(draft.label, "Promo cierre")
  assert.equal(draft.discountPercent, "15")
})

test("funnel offer draft preserves unrelated settings on write", () => {
  const result = applyFunnelStepOfferDraft(
    { pageId: "page-123", checkoutMode: "store" },
    {
      ...DEFAULT_FUNNEL_STEP_OFFER_DRAFT,
      enabled: true,
      type: "product",
      productId: "prod_1",
      priceMxn: "29900",
    }
  )

  assert.equal(result.pageId, "page-123")
  assert.equal(result.checkoutMode, "store")
  assert.deepEqual(result.offer, {
    enabled: true,
    type: "product",
    label: undefined,
    productId: "prod_1",
    imageUrl: undefined,
    acceptLabel: undefined,
    declineLabel: undefined,
    price: { priceMxn: 29900 },
  })
})

test("funnel offer draft writes disabled offers as minimal payload", () => {
  const result = applyFunnelStepOfferDraft(
    { pageId: "page-123", offer: { enabled: true, type: "discount" } },
    DEFAULT_FUNNEL_STEP_OFFER_DRAFT
  )

  assert.deepEqual(result.offer, { enabled: false })
})

test("funnel offer draft summary describes active offers", () => {
  assert.equal(
    getFunnelStepOfferSummary({
      offer: { enabled: true, type: "discount", price: { discountPercent: 20 } },
    }),
    "20% de descuento"
  )

  assert.equal(
    getFunnelStepOfferSummary({
      offer: { enabled: true, type: "free_gift" },
    }),
    "Regalo activo"
  )
})

test("funnel offer draft validation requires a concrete discount value", () => {
  const errors = validateFunnelStepOfferDraft({
    ...DEFAULT_FUNNEL_STEP_OFFER_DRAFT,
    enabled: true,
    type: "discount",
  })

  assert.deepEqual(errors, [
    {
      field: "discountPercent",
      message: "Configura descuento porcentual o descuento fijo para esta oferta.",
    },
  ])
})

test("funnel offer draft validation requires product and price for paid upsells", () => {
  const errors = validateFunnelStepOfferDraft({
    ...DEFAULT_FUNNEL_STEP_OFFER_DRAFT,
    enabled: true,
    type: "order_bump",
    productId: "",
    priceMxn: "0",
  })

  assert.deepEqual(errors, [
    {
      field: "productId",
      message: "Selecciona el producto que se agregara en esta oferta.",
    },
    {
      field: "priceMxn",
      message: "Define un precio mayor a 0 centavos para esta oferta.",
    },
  ])
})

test("funnel offer draft validation requires a known product for gifts", () => {
  const errors = validateFunnelStepOfferDraft({
    ...DEFAULT_FUNNEL_STEP_OFFER_DRAFT,
    enabled: true,
    type: "free_gift",
    productId: "prod_missing",
  }, {
    knownProductIds: ["prod_1", "prod_2"],
  })

  assert.deepEqual(errors, [
    {
      field: "productId",
      message: "El producto seleccionado ya no existe en este catalogo.",
    },
  ])
})
