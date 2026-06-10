import assert from "node:assert/strict"
import test from "node:test"

import { DEFAULT_FUNNEL_STEP_OFFER_DRAFT } from "../../lib/commerce/funnel-offer-draft"
import { getFunnelOfferProductAutofill } from "../../lib/commerce/funnel-offer-product-defaults"

test("funnel offer product autofill seeds label, image and base price", () => {
  const patch = getFunnelOfferProductAutofill({
    id: "prod_1",
    name: "Kit express",
    media: ["https://cdn.example.com/kit.jpg"],
    variants: [{ priceMxn: 15900 }, { priceMxn: 9900 }],
  }, "order_bump", DEFAULT_FUNNEL_STEP_OFFER_DRAFT)

  assert.deepEqual(patch, {
    productId: "prod_1",
    label: "Kit express",
    imageUrl: "https://cdn.example.com/kit.jpg",
    priceMxn: "9900",
  })
})

test("funnel offer product autofill preserves explicit fields already typed by the user", () => {
  const patch = getFunnelOfferProductAutofill({
    id: "prod_1",
    name: "Kit express",
    media: ["https://cdn.example.com/kit.jpg"],
    variants: [{ priceMxn: 9900 }],
  }, "product", {
    ...DEFAULT_FUNNEL_STEP_OFFER_DRAFT,
    label: "Oferta VIP",
    imageUrl: "https://cdn.example.com/manual.jpg",
    priceMxn: "12900",
  })

  assert.deepEqual(patch, {
    productId: "prod_1",
  })
})

test("funnel offer product autofill clears price for free gifts", () => {
  const patch = getFunnelOfferProductAutofill({
    id: "prod_2",
    name: "Regalo sorpresa",
    media: [],
    variants: [{ priceMxn: 4500 }],
  }, "free_gift", {
    ...DEFAULT_FUNNEL_STEP_OFFER_DRAFT,
    priceMxn: "4500",
  })

  assert.deepEqual(patch, {
    productId: "prod_2",
    label: "Regalo sorpresa",
    priceMxn: "",
  })
})
