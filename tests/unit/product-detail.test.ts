import assert from "node:assert/strict"
import test from "node:test"
import {
  clampProductQuantity,
  parseProductDetailGallery,
  parseProductDetailVariants,
} from "../../lib/commerce/product-detail"

const fallback = { id: "default", name: "Unica", priceMxn: 29900, stock: -1 }

test("product detail parses configured variants", () => {
  assert.deepEqual(
    parseProductDetailVariants("black|Negro|39900|49900|8\nwhite|Blanco|37900||0", fallback),
    [
      { id: "black", name: "Negro", priceMxn: 39900, comparePriceMxn: 49900, stock: 8 },
      { id: "white", name: "Blanco", priceMxn: 37900, stock: 0 },
    ]
  )
})

test("product detail uses fallback when variants config is empty", () => {
  assert.deepEqual(parseProductDetailVariants("", fallback), [fallback])
})

test("product detail gallery removes empty and duplicate images", () => {
  assert.deepEqual(
    parseProductDetailGallery("https://img/one.jpg", "https://img/two.jpg, https://img/one.jpg"),
    ["https://img/one.jpg", "https://img/two.jpg"]
  )
})

test("product detail quantity respects available stock", () => {
  assert.equal(clampProductQuantity(4, -1), 4)
  assert.equal(clampProductQuantity(9, 3), 3)
  assert.equal(clampProductQuantity(0, 3), 1)
})
