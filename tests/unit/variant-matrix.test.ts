import assert from "node:assert/strict"
import test from "node:test"
import {
  generateVariantMatrix,
  parseVariantMatrixDimensions,
  slugifyVariantSku,
} from "../../lib/commerce/variant-matrix"

test("variant matrix parses dimensions and removes duplicate values", () => {
  assert.deepEqual(parseVariantMatrixDimensions("Color: Negro, Blanco, negro\nTalla: S, M"), [
    { name: "Color", values: ["Negro", "Blanco"] },
    { name: "Talla", values: ["S", "M"] },
  ])
})

test("variant matrix creates cartesian combinations with stable skus", () => {
  const variants = generateVariantMatrix({
    dimensions: parseVariantMatrixDimensions("Color: Café, Negro\nTalla: S, M"),
    skuPrefix: "camisa lino",
  })

  assert.equal(variants.length, 4)
  assert.deepEqual(variants[0], {
    sku: "CAMISA-LINO-CAFE-S",
    name: "Café / S",
    attributes: { Color: "Café", Talla: "S" },
  })
})

test("variant matrix skips existing skus", () => {
  const variants = generateVariantMatrix({
    dimensions: parseVariantMatrixDimensions("Color: Negro, Blanco"),
    skuPrefix: "sku",
    existingSkus: ["SKU-NEGRO"],
  })

  assert.deepEqual(variants.map((variant) => variant.sku), ["SKU-BLANCO"])
})

test("variant matrix rejects oversized matrices", () => {
  assert.throws(
    () => generateVariantMatrix({
      dimensions: parseVariantMatrixDimensions("Color: A, B, C\nTalla: 1, 2, 3\nMaterial: X, Y"),
      skuPrefix: "sku",
      limit: 10,
    }),
    /limite de 10 variantes/
  )
})

test("variant matrix normalizes sku accents and symbols", () => {
  assert.equal(slugifyVariantSku(" edición café / niño "), "EDICION-CAFE-NINO")
})
