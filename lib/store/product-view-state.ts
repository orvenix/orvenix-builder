export type StoreProductStatusFilter = "all" | "draft" | "active" | "archived"
export type StoreProductStockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock"
export type StoreProductSort = "newest" | "name_asc" | "price_desc" | "stock_asc"

export interface StoreProductAttributeFilter {
  key: string
  value: string
}

export interface StoreProductsViewState {
  q: string
  status: StoreProductStatusFilter
  stock: StoreProductStockFilter
  sort: StoreProductSort
  attributes: StoreProductAttributeFilter[]
  facetKey: string
}

const PRODUCT_STATUS_VALUES = new Set<StoreProductStatusFilter>(["all", "draft", "active", "archived"])
const PRODUCT_STOCK_VALUES = new Set<StoreProductStockFilter>(["all", "in_stock", "low_stock", "out_of_stock"])
const PRODUCT_SORT_VALUES = new Set<StoreProductSort>(["newest", "name_asc", "price_desc", "stock_asc"])

export function buildStoreProductsViewQuery(view: StoreProductsViewState): string {
  const params = new URLSearchParams()
  const trimmedQuery = view.q.trim()
  const serializedAttributes = serializeStoreProductAttributeFilters(view.attributes)
  const trimmedFacetKey = view.facetKey.trim()

  if (trimmedQuery) params.set("productQ", trimmedQuery)
  if (view.status !== "all") params.set("productStatus", view.status)
  if (view.stock !== "all") params.set("productStock", view.stock)
  if (view.sort !== "newest") params.set("productSort", view.sort)
  if (serializedAttributes) params.set("productAttrs", serializedAttributes)
  if (trimmedFacetKey) params.set("productFacetKey", trimmedFacetKey)

  return params.toString()
}

export function serializeStoreProductAttributeFilters(
  attributes: StoreProductAttributeFilter[]
): string {
  return attributes
    .map((attribute) => ({
      key: attribute.key.trim(),
      value: attribute.value.trim(),
    }))
    .filter((attribute) => attribute.key && attribute.value)
    .map((attribute) => `${attribute.key}:${attribute.value}`)
    .join("|")
}

export function parseStoreProductAttributeFilters(value: string | null | undefined): StoreProductAttributeFilter[] {
  if (!value?.trim()) return []

  const seen = new Set<string>()
  const filters: StoreProductAttributeFilter[] = []

  for (const token of value.split("|")) {
    const trimmedToken = token.trim()
    if (!trimmedToken) continue
    const separatorIndex = trimmedToken.indexOf(":")
    if (separatorIndex <= 0) continue
    const key = trimmedToken.slice(0, separatorIndex).trim()
    const valuePart = trimmedToken.slice(separatorIndex + 1).trim()
    if (!key || !valuePart) continue

    const normalized = `${key.toLowerCase()}::${valuePart.toLowerCase()}`
    if (seen.has(normalized)) continue
    seen.add(normalized)
    filters.push({ key, value: valuePart })
  }

  return filters
}

export function parseStoreProductsViewState(
  input: { get(name: string): string | null }
): StoreProductsViewState {
  const q = input.get("productQ")?.trim() || ""
  const rawStatus = input.get("productStatus")
  const rawStock = input.get("productStock")
  const rawSort = input.get("productSort")
  const attributes = parseStoreProductAttributeFilters(input.get("productAttrs"))
  const facetKey = input.get("productFacetKey")?.trim() || ""

  return {
    q,
    status: rawStatus && PRODUCT_STATUS_VALUES.has(rawStatus as StoreProductStatusFilter)
      ? rawStatus as StoreProductStatusFilter
      : "all",
    stock: rawStock && PRODUCT_STOCK_VALUES.has(rawStock as StoreProductStockFilter)
      ? rawStock as StoreProductStockFilter
      : "all",
    sort: rawSort && PRODUCT_SORT_VALUES.has(rawSort as StoreProductSort)
      ? rawSort as StoreProductSort
      : "newest",
    attributes,
    facetKey,
  }
}
