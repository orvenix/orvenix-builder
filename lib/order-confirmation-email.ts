type StoredOrderConfirmationItem = {
  variantId?: string
  quantity: number
  productName: string
  variantName?: string
  priceMxn: number
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatMxn(amount: number): string {
  return `$${(amount / 100).toFixed(2)} MXN`
}

function getShortOrderId(orderId: string): string {
  const parts = orderId.split("_")
  return parts[parts.length - 1] || orderId
}

export function normalizeStoredOrderConfirmationItems(items: unknown): StoredOrderConfirmationItem[] {
  if (!Array.isArray(items)) return []

  return items.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return []
    const candidate = item as Record<string, unknown>
    const quantity = typeof candidate.quantity === "number" ? candidate.quantity : Number(candidate.quantity)
    const priceMxn = typeof candidate.priceMxn === "number" ? candidate.priceMxn : Number(candidate.priceMxn)
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(priceMxn)) return []

    return [{
      variantId: typeof candidate.variantId === "string" ? candidate.variantId : undefined,
      quantity,
      productName: typeof candidate.productName === "string" ? candidate.productName : "Producto",
      variantName: typeof candidate.variantName === "string" ? candidate.variantName : undefined,
      priceMxn,
    }]
  })
}

export function renderOrderConfirmationEmailHtml(input: {
  customerEmail: string
  customerName?: string
  orderId: string
  totalMxn: number
  items: StoredOrderConfirmationItem[]
}): string {
  const customerName = escapeHtml(input.customerName?.trim() || input.customerEmail)
  const lines = input.items.map((item) => {
    const product = escapeHtml(item.productName)
    const variant = item.variantName ? ` (${escapeHtml(item.variantName)})` : ""
    const lineTotal = formatMxn(item.priceMxn * item.quantity)
    return `<li>${product}${variant} x ${item.quantity} - ${lineTotal}</li>`
  }).join("")

  return `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h1>Confirmacion de pedido</h1>
      <p>Hola ${customerName}, gracias por tu compra.</p>
      <p>Pedido <strong>#${escapeHtml(getShortOrderId(input.orderId))}</strong></p>
      <ul>${lines}</ul>
      <p><span>Total: </span><span style="font-weight: 700;">${formatMxn(input.totalMxn)}</span></p>
    </div>
  `.trim()
}
