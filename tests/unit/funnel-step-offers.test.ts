import test from "node:test"
import assert from "node:assert/strict"
import {
  parseFunnelStepSettings,
  parseFunnelStepOffer,
  getStepOffer,
  resolveStepOffer,
  applyOfferDiscount,
  type FunnelStepOffer,
} from "../../lib/commerce/funnel-step-offers"

// ─── parseFunnelStepSettings ──────────────────────────────────────────────────

test("funnel offers parseFunnelStepSettings returns empty obj on bad input", () => {
  assert.deepEqual(parseFunnelStepSettings(null), {})
  assert.deepEqual(parseFunnelStepSettings("bad"), {})
  assert.deepEqual(parseFunnelStepSettings(42), {})
})

test("funnel offers parseFunnelStepSettings parses valid settings", () => {
  const input = {
    offer: {
      type: "product",
      label: "Oferta especial",
      enabled: true,
    },
  }
  const result = parseFunnelStepSettings(input)
  assert.equal(result.offer?.type, "product")
  assert.equal(result.offer?.label, "Oferta especial")
})

test("funnel offers parseFunnelStepSettings ignores invalid offer type", () => {
  const input = { offer: { type: "INVALID_TYPE" } }
  const result = parseFunnelStepSettings(input)
  assert.equal(result.offer, undefined)
})

// ─── parseFunnelStepOffer ─────────────────────────────────────────────────────

test("funnel offers parseFunnelStepOffer returns null on bad input", () => {
  assert.equal(parseFunnelStepOffer(null), null)
  assert.equal(parseFunnelStepOffer({ type: "unknown" }), null)
})

test("funnel offers parseFunnelStepOffer accepts all valid types", () => {
  for (const type of ["product", "order_bump", "discount", "free_gift"] as const) {
    const result = parseFunnelStepOffer({ type })
    assert.ok(result !== null, `${type} should parse`)
    assert.equal(result!.type, type)
  }
})

test("funnel offers parseFunnelStepOffer validates price fields", () => {
  const result = parseFunnelStepOffer({
    type: "discount",
    price: { discountPercent: 20, priceMxn: 100 },
  })
  assert.ok(result !== null)
  assert.equal(result!.price?.discountPercent, 20)
  assert.equal(result!.price?.priceMxn, 100)
})

test("funnel offers parseFunnelStepOffer rejects discountPercent > 100", () => {
  const result = parseFunnelStepOffer({
    type: "discount",
    price: { discountPercent: 150 },
  })
  assert.equal(result, null)
})

// ─── getStepOffer ─────────────────────────────────────────────────────────────

test("funnel offers getStepOffer extracts offer from raw settings", () => {
  const settings = {
    offer: { type: "order_bump", label: "Add-on especial", enabled: true },
  }
  const offer = getStepOffer(settings)
  assert.ok(offer !== null)
  assert.equal(offer!.type, "order_bump")
})

test("funnel offers getStepOffer returns null when no offer in settings", () => {
  assert.equal(getStepOffer({}), null)
  assert.equal(getStepOffer(null), null)
})

// ─── resolveStepOffer ─────────────────────────────────────────────────────────

test("funnel offers resolveStepOffer fills defaults for missing fields", () => {
  const offer: FunnelStepOffer = { type: "free_gift", enabled: true }
  const resolved = resolveStepOffer(offer)

  assert.equal(resolved.type, "free_gift")
  assert.equal(resolved.label, "Regalo incluido")
  assert.equal(resolved.acceptLabel, "Sí, agregar")
  assert.equal(resolved.declineLabel, "No, gracias")
  assert.equal(resolved.imageUrl, null)
  assert.equal(resolved.productId, null)
  assert.equal(resolved.priceMxn, null)
  assert.equal(resolved.discountPercent, null)
  assert.equal(resolved.enabled, true)
})

test("funnel offers resolveStepOffer preserves custom labels", () => {
  const offer: FunnelStepOffer = {
    type: "product",
    label: "¡Producto exclusivo!",
    acceptLabel: "Sí quiero",
    declineLabel: "No, gracias 2",
    enabled: true,
  }
  const resolved = resolveStepOffer(offer)
  assert.equal(resolved.label, "¡Producto exclusivo!")
  assert.equal(resolved.acceptLabel, "Sí quiero")
  assert.equal(resolved.declineLabel, "No, gracias 2")
})

// ─── applyOfferDiscount ───────────────────────────────────────────────────────

test("funnel offers applyOfferDiscount does nothing for non-discount type", () => {
  const offer = resolveStepOffer({ type: "product", enabled: true })
  assert.equal(applyOfferDiscount(1000, offer), 1000)
})

test("funnel offers applyOfferDiscount applies percent discount", () => {
  const offer = resolveStepOffer({
    type: "discount",
    price: { discountPercent: 20 },
    enabled: true,
  })
  assert.equal(applyOfferDiscount(1000, offer), 800)
})

test("funnel offers applyOfferDiscount applies fixed discount", () => {
  const offer = resolveStepOffer({
    type: "discount",
    price: { discountFixed: 150 },
    enabled: true,
  })
  assert.equal(applyOfferDiscount(1000, offer), 850)
})

test("funnel offers applyOfferDiscount clamps to 0, never negative", () => {
  const offer = resolveStepOffer({
    type: "discount",
    price: { discountFixed: 5000 },
    enabled: true,
  })
  assert.equal(applyOfferDiscount(100, offer), 0)
})

test("funnel offers applyOfferDiscount percent takes priority over fixed when both set", () => {
  const offer = resolveStepOffer({
    type: "discount",
    price: { discountPercent: 10, discountFixed: 500 },
    enabled: true,
  })
  // percent applied first (10% de 1000 = 900)
  assert.equal(applyOfferDiscount(1000, offer), 900)
})
