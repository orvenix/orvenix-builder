import assert from "node:assert/strict"
import test from "node:test"
import {
  normalizeStoredOrderConfirmationItems,
  renderOrderConfirmationEmailHtml,
} from "../../lib/order-confirmation-email"

test("order confirmation email renders real item details and totals", () => {
  const html = renderOrderConfirmationEmailHtml({
    customerEmail: "ana@example.com",
    customerName: "Ana",
    orderId: "order_12345678",
    totalMxn: 74900,
    items: [{
      productName: "Camisa lino",
      variantName: "Negro / M",
      quantity: 2,
      priceMxn: 37450,
    }],
  })

  assert.match(html, /Camisa lino \(Negro \/ M\) x 2 - \$749\.00 MXN/)
  assert.match(html, /#12345678/)
  assert.match(html, /Total: <\/span>\s*<span[^>]*>\$749\.00 MXN/)
})

test("order confirmation email escapes dynamic customer and product text", () => {
  const html = renderOrderConfirmationEmailHtml({
    customerEmail: "ana@example.com",
    customerName: "<script>alert(1)</script>",
    orderId: "order_safe",
    totalMxn: 100,
    items: [{ productName: "<b>Producto</b>", quantity: 1, priceMxn: 100 }],
  })

  assert.doesNotMatch(html, /<script>/)
  assert.doesNotMatch(html, /<b>Producto<\/b>/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(html, /&lt;b&gt;Producto&lt;\/b&gt;/)
})

test("order confirmation email normalizes persisted JSON items", () => {
  assert.deepEqual(normalizeStoredOrderConfirmationItems([
    {
      variantId: "variant_1",
      quantity: 2,
      productName: "Camisa",
      variantName: "Negro",
      priceMxn: 19900,
      ignored: true,
    },
    { variantId: "missing_quantity" },
    null,
  ]), [{
    variantId: "variant_1",
    quantity: 2,
    productName: "Camisa",
    variantName: "Negro",
    priceMxn: 19900,
  }])
})
