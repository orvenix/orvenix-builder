import test from "node:test"
import assert from "node:assert/strict"
import {
  parseFunnelStepSettings,
  getStepOffer,
  resolveStepOffer,
  applyOfferDiscount,
  type FunnelStepOffer,
} from "../../lib/commerce/funnel-step-offers"
import {
  appendCheckoutOfferLineItem,
  buildStorePreferenceItemsFromOrder,
  resolveCheckoutFunnelOffer,
} from "../../lib/commerce/funnel-offer-checkout"

// ─── getStepOffer — from step settings ───────────────────────────────────────

test("funnel offer checkout getStepOffer reads from settings.offer", () => {
  const settings = {
    offer: { type: "discount", enabled: true, price: { discountPercent: 15 } },
  }
  const offer = getStepOffer(settings)
  assert.ok(offer !== null)
  assert.equal(offer!.type, "discount")
})

test("funnel offer checkout getStepOffer returns null for empty settings", () => {
  assert.equal(getStepOffer({}), null)
  assert.equal(getStepOffer(null), null)
})

test("funnel offer checkout getStepOffer ignores disabled offer", () => {
  const settings = { offer: { type: "discount", enabled: false } }
  const offer = getStepOffer(settings)
  // getStepOffer returns the raw offer; caller checks enabled
  assert.ok(offer !== null)
  assert.equal(offer!.enabled, false)
})

// ─── resolveStepOffer — defaults ─────────────────────────────────────────────

test("funnel offer checkout resolveStepOffer sets default labels", () => {
  const offer: FunnelStepOffer = { type: "discount", enabled: true }
  const resolved = resolveStepOffer(offer)
  assert.equal(resolved.acceptLabel, "Sí, agregar")
  assert.equal(resolved.declineLabel, "No, gracias")
  assert.equal(resolved.enabled, true)
})

test("funnel offer checkout resolveStepOffer maps price.discountPercent", () => {
  const offer: FunnelStepOffer = {
    type: "discount",
    enabled: true,
    price: { discountPercent: 20 },
  }
  const resolved = resolveStepOffer(offer)
  assert.equal(resolved.discountPercent, 20)
  assert.equal(resolved.type, "discount")
})

// ─── applyOfferDiscount — discount type ──────────────────────────────────────

test("funnel offer checkout applies percent discount to total", () => {
  const offer = resolveStepOffer({
    type: "discount",
    enabled: true,
    price: { discountPercent: 10 },
  })
  // 10% de 1000 = 900
  assert.equal(applyOfferDiscount(1000, offer), 900)
})

test("funnel offer checkout applies fixed discount to total", () => {
  const offer = resolveStepOffer({
    type: "discount",
    enabled: true,
    price: { discountFixed: 50 },
  })
  assert.equal(applyOfferDiscount(200, offer), 150)
})

test("funnel offer checkout does not discount for non-discount type", () => {
  const offer = resolveStepOffer({ type: "free_gift", enabled: true })
  assert.equal(applyOfferDiscount(500, offer), 500)
})

test("funnel offer checkout discount never goes below zero", () => {
  const offer = resolveStepOffer({
    type: "discount",
    enabled: true,
    price: { discountFixed: 10000 },
  })
  assert.equal(applyOfferDiscount(100, offer), 0)
})

test("funnel offer checkout 100% discount results in zero", () => {
  const offer = resolveStepOffer({
    type: "discount",
    enabled: true,
    price: { discountPercent: 100 },
  })
  assert.equal(applyOfferDiscount(999, offer), 0)
})

// ─── offerDraftToSettings roundtrip (pure helpers) ───────────────────────────

function offerDraftToSettings(draft: {
  enabled: boolean
  type: string
  label: string
  discountPercent: string
  priceMxn: string
  acceptLabel: string
  declineLabel: string
}) {
  if (!draft.enabled) return { offer: { enabled: false } }
  const priceMxn = parseFloat(draft.priceMxn)
  const discountPercent = parseFloat(draft.discountPercent)
  return {
    offer: {
      enabled: true,
      type: draft.type,
      label: draft.label.trim() || undefined,
      acceptLabel: draft.acceptLabel.trim() || "Sí, agregar",
      declineLabel: draft.declineLabel.trim() || "No, gracias",
      price: draft.type === "discount"
        ? { discountPercent: isNaN(discountPercent) ? undefined : discountPercent }
        : { priceMxn: isNaN(priceMxn) ? undefined : priceMxn },
    },
  }
}

test("funnel offer checkout offerDraftToSettings serializes discount correctly", () => {
  const result = offerDraftToSettings({
    enabled: true, type: "discount", label: "Descuento especial",
    discountPercent: "25", priceMxn: "", acceptLabel: "Aceptar", declineLabel: "No",
  })
  const offer = result.offer as Record<string, unknown>
  assert.equal(offer.type, "discount")
  assert.equal((offer.price as Record<string, unknown>)?.discountPercent, 25)
  assert.equal(offer.label, "Descuento especial")
})

test("funnel offer checkout offerDraftToSettings disabled returns minimal object", () => {
  const result = offerDraftToSettings({
    enabled: false, type: "discount", label: "", discountPercent: "",
    priceMxn: "", acceptLabel: "", declineLabel: "",
  })
  assert.equal((result.offer as Record<string, unknown>).enabled, false)
})

test("funnel offer checkout parseFunnelStepSettings preserves other settings fields", () => {
  const raw = {
    pageId: "page-123",
    offer: { type: "discount", enabled: true },
    customField: "value",
  }
  const parsed = parseFunnelStepSettings(raw)
  // customField preserved via catchall
  assert.equal((parsed as Record<string, unknown>).customField, "value")
  assert.equal(parsed.offer?.type, "discount")
})

// ─── checkout route helpers ─────────────────────────────────────────────────

test("funnel offer checkout resolves applied discount from matching step", () => {
  const result = resolveCheckoutFunnelOffer({
    funnel: {
      steps: [{
        id: "step-1",
        kind: "upsell",
        settings: { offer: { enabled: true, type: "discount", price: { discountPercent: 20 } } },
      }],
    },
    funnelStepId: "step-1",
    funnelStep: "upsell",
    offerAccepted: true,
    totalMxn: 1000,
  })

  assert.equal(result.totalMxn, 800)
  assert.equal(result.appliedOffer?.type, "discount")
  assert.equal(result.appliedOffer?.discountMxn, 200)
  assert.equal(result.appliedOffer?.priceMxn, 0)
})

test("funnel offer checkout returns error when accepted step is missing", () => {
  const result = resolveCheckoutFunnelOffer({
    funnel: { steps: [] },
    funnelStepId: "missing",
    funnelStep: "upsell",
    offerAccepted: true,
    totalMxn: 1000,
  })

  assert.equal(result.error, "FUNNEL_STEP_NOT_FOUND")
})

test("funnel offer checkout appends negative line for discount offers", () => {
  const items = appendCheckoutOfferLineItem([{
    variantId: "v1",
    productId: "p1",
    productName: "Camisa",
    variantName: "Negro",
    sku: "CAM-NEG",
    quantity: 1,
    priceMxn: 1000,
    subtotalMxn: 1000,
  }], {
    stepId: "step-1",
    stepKind: "upsell",
    type: "discount",
    label: "Promo relampago",
    discountMxn: 150,
    priceMxn: 0,
  })

  assert.equal(items.length, 2)
  assert.equal(items[1].subtotalMxn, -150)
  assert.equal(items[1].sku, "FUNNEL-DISCOUNT")
})

test("funnel offer checkout adds priced offer lines for order bumps", () => {
  const result = resolveCheckoutFunnelOffer({
    funnel: {
      steps: [{
        id: "step-2",
        kind: "upsell",
        settings: { offer: { enabled: true, type: "order_bump", label: "Kit express", price: { priceMxn: 9900 } } },
      }],
    },
    funnelStepId: "step-2",
    funnelStep: "upsell",
    offerAccepted: true,
    totalMxn: 10000,
  })

  assert.equal(result.totalMxn, 19900)
  assert.equal(result.appliedOffer?.type, "order_bump")
  assert.equal(result.appliedOffer?.priceMxn, 9900)
  assert.equal(result.appliedOffer?.discountMxn, 0)

  const items = appendCheckoutOfferLineItem([{
    variantId: "v1",
    productId: "p1",
    productName: "Camisa",
    variantName: "Negro",
    sku: "CAM-NEG",
    quantity: 1,
    priceMxn: 10000,
    subtotalMxn: 10000,
  }], result.appliedOffer)

  assert.equal(items.length, 2)
  assert.equal(items[1].productName, "Kit express")
  assert.equal(items[1].sku, "FUNNEL-BUMP")
  assert.equal(items[1].subtotalMxn, 9900)
})

test("funnel offer checkout adds zero-value lines for free gifts", () => {
  const result = resolveCheckoutFunnelOffer({
    funnel: {
      steps: [{
        id: "step-3",
        kind: "downsell",
        settings: { offer: { enabled: true, type: "free_gift", label: "Regalo sorpresa" } },
      }],
    },
    funnelStepId: "step-3",
    funnelStep: "downsell",
    offerAccepted: true,
    totalMxn: 5000,
  })

  assert.equal(result.totalMxn, 5000)
  assert.equal(result.appliedOffer?.type, "free_gift")
  assert.equal(result.appliedOffer?.priceMxn, 0)

  const items = appendCheckoutOfferLineItem([{
    variantId: "v1",
    productId: "p1",
    productName: "Camisa",
    variantName: "Negro",
    sku: "CAM-NEG",
    quantity: 1,
    priceMxn: 5000,
    subtotalMxn: 5000,
  }], result.appliedOffer)

  assert.equal(items.length, 2)
  assert.equal(items[1].sku, "FUNNEL-GIFT")
  assert.equal(items[1].subtotalMxn, 0)
})

test("funnel offer checkout collapses MP payload to one summary item when discount exists", () => {
  const items = buildStorePreferenceItemsFromOrder([
    {
      variantId: "v1",
      productId: "p1",
      productName: "Camisa",
      variantName: "Negro",
      sku: "CAM-NEG",
      quantity: 2,
      priceMxn: 5000,
      subtotalMxn: 10000,
    },
    {
      variantId: "",
      productId: "",
      productName: "Promo",
      variantName: "discount",
      sku: "FUNNEL-DISCOUNT",
      quantity: 1,
      priceMxn: -2000,
      subtotalMxn: -2000,
    },
  ])

  assert.equal(items.length, 1)
  assert.equal(items[0].unitPriceMxn, 80)
})
