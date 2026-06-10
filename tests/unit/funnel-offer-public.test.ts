import assert from "node:assert/strict"
import test from "node:test"

import {
  getPublicCartOfferSummary,
  getPublicFunnelOfferCallout,
  getPublicFunnelOfferQuery,
} from "../../lib/commerce/funnel-offer-public"

test("public funnel offer callout returns null outside checkout and funnel offer steps", () => {
  assert.equal(
    getPublicFunnelOfferCallout("landing", {
      offer: { enabled: true, type: "discount", price: { discountPercent: 15 } },
    }),
    null
  )
})

test("public funnel offer callout also supports checkout steps", () => {
  const result = getPublicFunnelOfferCallout("checkout", {
    offer: {
      enabled: true,
      type: "order_bump",
      label: "Kit express",
      price: { priceMxn: 9900 },
    },
  })

  assert.ok(result)
  assert.equal(result?.eyebrow, "Oferta de checkout")
  assert.match(result?.description ?? "", /Kit express/)
})

test("public funnel offer callout describes discount offers", () => {
  const result = getPublicFunnelOfferCallout("upsell", {
    offer: {
      enabled: true,
      type: "discount",
      label: "Promo VIP",
      acceptLabel: "Sí, aplicar",
      declineLabel: "Seguir sin promo",
      price: { discountPercent: 20 },
    },
  }, {
    acceptHref: "/p/site?cart=open",
    declineHref: "/p/site",
  })

  assert.ok(result)
  assert.equal(result?.tone, "cyan")
  assert.equal(result?.title, "Promo VIP")
  assert.match(result?.description ?? "", /20%/)
  assert.equal(result?.ctaLabel, "Abrir carrito con descuento")
  assert.equal(result?.secondaryLabel, "Seguir sin upsell")
})

test("public funnel offer callout describes free gifts", () => {
  const result = getPublicFunnelOfferCallout("downsell", {
    offer: {
      enabled: true,
      type: "free_gift",
    },
  })

  assert.ok(result)
  assert.equal(result?.tone, "emerald")
  assert.match(result?.description ?? "", /regalo/i)
})

test("public funnel offer callout describes product offers with concrete value", () => {
  const result = getPublicFunnelOfferCallout("downsell", {
    offer: {
      enabled: true,
      type: "product",
      label: "Pack express",
      price: { priceMxn: 9900 },
    },
  }, {
    acceptHref: "/p/site?cart=open",
    declineHref: "/p/site",
  })

  assert.ok(result)
  assert.equal(result?.tone, "amber")
  assert.match(result?.description ?? "", /Pack express/)
  assert.match(result?.description ?? "", /99\.00/)
  assert.equal(result?.ctaLabel, "Abrir carrito con opcion alternativa")
  assert.equal(result?.secondaryLabel, "Seguir sin downsell")
})

test("public funnel offer callout accepts semantic CTA overrides", () => {
  const result = getPublicFunnelOfferCallout("upsell", {
    offer: {
      enabled: true,
      type: "discount",
      label: "Promo VIP",
      acceptLabel: "Si, aplicar",
      declineLabel: "Seguir sin promo",
      price: { discountPercent: 20 },
    },
  }, {
    acceptHref: "/p/site?cart=open",
    acceptLabel: "Aplicar upsell",
    declineHref: "/p/site",
    declineLabel: "Seguir sin upsell",
  })

  assert.ok(result)
  assert.equal(result?.ctaLabel, "Aplicar upsell")
  assert.equal(result?.secondaryLabel, "Seguir sin upsell")
})

test("public funnel offer query serializes active offer context", () => {
  const result = getPublicFunnelOfferQuery("upsell", {
    offer: {
      enabled: true,
      type: "discount",
      label: "Promo VIP",
      price: { discountPercent: 20 },
    },
  })

  assert.ok(result)
  assert.equal(result?.offerStepKind, "upsell")
  assert.equal(result?.offerType, "discount")
  assert.equal(result?.offerLabel, "Promo VIP")
  assert.equal(result?.offerValue, "20%")
  assert.equal(result?.offerDiscountPercent, "20")
})

test("public funnel offer query also serializes checkout offers", () => {
  const result = getPublicFunnelOfferQuery("checkout", {
    offer: {
      enabled: true,
      type: "order_bump",
      label: "Kit express",
      price: { priceMxn: 9900 },
    },
  })

  assert.ok(result)
  assert.equal(result?.offerStepKind, "checkout")
  assert.equal(result?.offerType, "order_bump")
  assert.equal(result?.offerPriceMxn, "9900")
})

test("public cart offer summary explains the active benefit", () => {
  const discount = getPublicCartOfferSummary({
    stepKind: "upsell",
    offerAccepted: true,
    offerType: "discount",
    offerLabel: "Promo VIP",
    offerValue: "20%",
    offerDiscountPercent: "20",
    totalMxn: 10000,
  })
  const product = getPublicCartOfferSummary({
    stepKind: "downsell",
    offerAccepted: true,
    offerType: "product",
    offerLabel: "Pack express",
    offerValue: "$99.00 MXN",
    offerPriceMxn: "9900",
  })
  const gift = getPublicCartOfferSummary({
    stepKind: "upsell",
    offerAccepted: true,
    offerType: "free_gift",
    offerLabel: "Regalo sorpresa",
  })

  assert.ok(discount)
  assert.match(discount?.description ?? "", /20%/)
  assert.match(discount?.checkboxLabel ?? "", /descuento/i)
  assert.equal(discount?.estimatedLabel, "Descuento estimado")
  assert.match(discount?.estimatedValue ?? "", /20\.00/)
  assert.equal(discount?.estimatedTotalLabel, "Total estimado")
  assert.match(discount?.estimatedTotalValue ?? "", /80\.00/)
  assert.match(discount?.finePrint ?? "", /pasarela/i)
  assert.ok(product)
  assert.match(product?.description ?? "", /Pack express/)
  assert.match(product?.description ?? "", /99\.00/)
  assert.equal(product?.estimatedLabel, "Cargo estimado")
  assert.match(product?.estimatedValue ?? "", /99\.00/)
  assert.equal(product?.estimatedTotalLabel, "Total estimado")
  assert.match(product?.estimatedTotalValue ?? "", /99\.00/)
  assert.match(product?.finePrint ?? "", /pasarela/i)
  assert.ok(gift)
  assert.equal(gift?.estimatedLabel, "Beneficio estimado")
  assert.equal(gift?.estimatedValue, "Regalo incluido")
  assert.equal(gift?.estimatedTotalLabel, undefined)
  assert.equal(gift?.estimatedTotalValue, undefined)
  assert.match(gift?.finePrint ?? "", /regalo/i)
})

test("public cart offer summary supports checkout-step offers", () => {
  const summary = getPublicCartOfferSummary({
    stepKind: "checkout",
    offerAccepted: true,
    offerType: "order_bump",
    offerLabel: "Kit express",
    offerValue: "$99.00 MXN",
    offerPriceMxn: "9900",
    totalMxn: 20000,
  })

  assert.ok(summary)
  assert.match(summary?.checkboxLabel ?? "", /oferta activa/i)
  assert.match(summary?.estimatedTotalValue ?? "", /299\.00/)
})

test("public cart offer summary keeps total for gifts when subtotal exists", () => {
  const gift = getPublicCartOfferSummary({
    stepKind: "upsell",
    offerAccepted: true,
    offerType: "free_gift",
    offerLabel: "Regalo sorpresa",
    totalMxn: 4500,
  })

  assert.ok(gift)
  assert.equal(gift?.estimatedTotalLabel, "Total estimado")
  assert.match(gift?.estimatedTotalValue ?? "", /45\.00/)
  assert.match(gift?.finePrint ?? "", /pago final/i)
})
