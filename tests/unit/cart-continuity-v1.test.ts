import test from "node:test"
import assert from "node:assert/strict"
import {
  CART_STORAGE_VERSION_V1,
  getCartStorageKeyV1,
  parsePersistedCartPayloadV1,
  useCartStore,
  type CartItem,
} from "../../store/useCartStore"
import { StoreCheckoutSchemaV1, buildStoreCheckoutBaseItemsV1, type StoreCheckoutVariantRowV1 } from "../../lib/commerce/checkout-pricing"

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>()

  get length() {
    return this.data.size
  }

  clear() {
    this.data.clear()
  }

  getItem(key: string) {
    return this.data.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.data.delete(key)
  }

  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

function installStorage(storage: Storage) {
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
}

function installUnavailableStorage() {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("storage unavailable")
    },
  })
}

function resetCart(storage: Storage = new MemoryStorage()) {
  installStorage(storage)
  useCartStore.setState({
    isOpen: false,
    siteId: null,
    storageKey: null,
    isHydrated: false,
    items: [],
  })
  return storage
}

function item(variantId: string, patch: Partial<CartItem> = {}): CartItem {
  return {
    variantId,
    productId: patch.productId ?? `prod_${variantId}`,
    productName: patch.productName ?? `Producto ${variantId}`,
    variantName: patch.variantName ?? "Unica",
    priceMxn: patch.priceMxn ?? 1000,
    quantity: patch.quantity ?? 1,
    ...(patch.imageUrl ? { imageUrl: patch.imageUrl } : {}),
  }
}

function persisted(siteId: string, items: CartItem[], version = CART_STORAGE_VERSION_V1) {
  return JSON.stringify({ version, siteId, items })
}

test("cart continuity: survives reload/navigation-equivalent hydration and isolates site A from site B", () => {
  const storage = resetCart()
  const siteAKey = getCartStorageKeyV1("site_a")!
  const siteBKey = getCartStorageKeyV1("site_b")!

  useCartStore.getState().setSite("site_a")
  useCartStore.getState().addItem(item("var_a"))
  assert.equal(useCartStore.getState().items.length, 1)
  assert.ok(storage.getItem(siteAKey)?.includes("var_a"))

  useCartStore.getState().setSite(null)
  assert.deepEqual(useCartStore.getState().items, [])

  useCartStore.getState().setSite("site_a")
  assert.deepEqual(useCartStore.getState().items.map((entry) => [entry.variantId, entry.quantity]), [["var_a", 1]])

  useCartStore.getState().setSite("site_b")
  assert.deepEqual(useCartStore.getState().items, [])
  useCartStore.getState().addItem(item("var_b"))
  assert.ok(storage.getItem(siteBKey)?.includes("var_b"))

  useCartStore.getState().setSite("site_a")
  assert.deepEqual(useCartStore.getState().items.map((entry) => entry.variantId), ["var_a"])
  assert.notEqual(storage.getItem(siteAKey), storage.getItem(siteBKey))
})

test("cart continuity: duplicate variant increments, different variants stay distinct and quantities are bounded", () => {
  resetCart()
  useCartStore.getState().setSite("site_variants")
  useCartStore.getState().addItem(item("var_1", { quantity: 2 }))
  useCartStore.getState().addItem(item("var_1", { quantity: 3, priceMxn: 999999 }))
  useCartStore.getState().addItem(item("var_2", { productId: "prod_1", quantity: 98 }))
  useCartStore.getState().addItem(item("var_2", { productId: "prod_1", quantity: 20 }))

  assert.deepEqual(useCartStore.getState().items.map((entry) => [entry.variantId, entry.quantity, entry.priceMxn]), [
    ["var_1", 5, 1000],
    ["var_2", 99, 1000],
  ])
})

test("cart continuity: update, remove and clear are persisted", () => {
  const storage = resetCart()
  const key = getCartStorageKeyV1("site_ops")!
  useCartStore.getState().setSite("site_ops")
  useCartStore.getState().addItem(item("var_1"))
  useCartStore.getState().addItem(item("var_2"))

  useCartStore.getState().updateQty("var_1", 4)
  useCartStore.getState().removeItem("var_2")
  useCartStore.getState().setSite(null)
  useCartStore.getState().setSite("site_ops")
  assert.deepEqual(useCartStore.getState().items.map((entry) => [entry.variantId, entry.quantity]), [["var_1", 4]])

  useCartStore.getState().clear()
  assert.equal(storage.getItem(key), null)
})

test("cart continuity: malformed, unknown-version and invalid-quantity payloads are dropped safely", () => {
  const storage = resetCart()
  const malformedKey = getCartStorageKeyV1("site_malformed")!
  storage.setItem(malformedKey, "{")
  useCartStore.getState().setSite("site_malformed")
  assert.deepEqual(useCartStore.getState().items, [])
  assert.equal(storage.getItem(malformedKey), null)

  const versionKey = getCartStorageKeyV1("site_version")!
  storage.setItem(versionKey, persisted("site_version", [item("var_1")], 999))
  useCartStore.getState().setSite("site_version")
  assert.deepEqual(useCartStore.getState().items, [])
  assert.equal(storage.getItem(versionKey), null)

  const quantityKey = getCartStorageKeyV1("site_quantity")!
  storage.setItem(quantityKey, persisted("site_quantity", [item("var_bad", { quantity: 100 })]))
  useCartStore.getState().setSite("site_quantity")
  assert.deepEqual(useCartStore.getState().items, [])
  assert.equal(storage.getItem(quantityKey), null)
})

test("cart continuity: payload validation rejects wrong site identity, duplicated variants and unsafe item shape", () => {
  assert.equal(parsePersistedCartPayloadV1(persisted("site_a", [item("var_1")]), "site_b"), null)
  assert.equal(parsePersistedCartPayloadV1(persisted("site_a", [item("var_1"), item("var_1")]), "site_a"), null)
  assert.equal(parsePersistedCartPayloadV1(persisted("site_a", [{ ...item("var_1"), productId: "bad id!" }]), "site_a"), null)
})

test("cart continuity: legacy/no storage and storage-unavailable modes degrade to safe in-memory behavior", () => {
  resetCart()
  useCartStore.getState().setSite("site_empty")
  assert.deepEqual(useCartStore.getState().items, [])

  installUnavailableStorage()
  useCartStore.setState({ isOpen: false, siteId: null, storageKey: null, isHydrated: false, items: [] })
  assert.doesNotThrow(() => useCartStore.getState().setSite("site_private"))
  assert.doesNotThrow(() => useCartStore.getState().addItem(item("var_private")))
  assert.deepEqual(useCartStore.getState().items.map((entry) => entry.variantId), ["var_private"])
})

test("cart continuity: syncFromStorage refreshes only the active site for bounded same-site multi-tab continuity", () => {
  const storage = resetCart()
  useCartStore.getState().setSite("site_sync")
  storage.setItem(getCartStorageKeyV1("site_sync")!, persisted("site_sync", [item("var_sync", { quantity: 3 })]))
  storage.setItem(getCartStorageKeyV1("site_other")!, persisted("site_other", [item("var_other")]))

  useCartStore.getState().syncFromStorage()
  assert.deepEqual(useCartStore.getState().items.map((entry) => [entry.variantId, entry.quantity]), [["var_sync", 3]])
})

test("cart continuity: persisted presentation metadata cannot become checkout authority", () => {
  const storage = resetCart()
  const key = getCartStorageKeyV1("site_checkout")!
  storage.setItem(key, persisted("site_checkout", [item("var_real", { productId: "prod_fake", productName: "Fake", priceMxn: 1, quantity: 2 })]))
  useCartStore.getState().setSite("site_checkout")

  const requestBody = {
    customerEmail: "buyer@example.com",
    items: useCartStore.getState().items.map((entry) => ({ variantId: entry.variantId, quantity: entry.quantity })),
  }
  const parsed = StoreCheckoutSchemaV1.parse(requestBody)
  const dbRows: StoreCheckoutVariantRowV1[] = [{
    id: "var_real",
    productId: "prod_real",
    name: "DB Variant",
    sku: "SKU-1",
    priceMxn: 5000,
    stock: 10,
    product: { name: "DB Product", siteId: "site_checkout", status: "active" },
  }]
  const pricing = buildStoreCheckoutBaseItemsV1({ siteId: "site_checkout", requestedItems: parsed.items, variants: dbRows })
  assert.ok(pricing.ok)
  if (pricing.ok) {
    assert.deepEqual(pricing.items[0], {
      variantId: "var_real",
      productId: "prod_real",
      productName: "DB Product",
      variantName: "DB Variant",
      sku: "SKU-1",
      quantity: 2,
      priceMxn: 5000,
      subtotalMxn: 10000,
    })
  }
})

test("cart continuity: unknown persisted product or variant remains rejected by the authoritative checkout path", () => {
  resetCart()
  useCartStore.getState().setSite("site_checkout")
  useCartStore.getState().addItem(item("var_unknown", { productId: "prod_unknown" }))
  const parsed = StoreCheckoutSchemaV1.parse({
    customerEmail: "buyer@example.com",
    items: useCartStore.getState().items.map((entry) => ({ variantId: entry.variantId, quantity: entry.quantity })),
  })

  assert.deepEqual(
    buildStoreCheckoutBaseItemsV1({ siteId: "site_checkout", requestedItems: parsed.items, variants: [] }),
    { ok: false, error: "INVALID_ITEMS" },
  )
})
