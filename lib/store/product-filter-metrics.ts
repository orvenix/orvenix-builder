import {
  type StoreProductAttributeFilter,
  type StoreProductSort,
  type StoreProductStatusFilter,
  type StoreProductStockFilter,
  type StoreProductsViewState,
} from "./product-view-state"

export interface StoreProductListItemVariant {
  sku: string
  name: string
  priceMxn: number
  stock: number
  attributes?: Record<string, string>
}

export interface StoreProductListItem {
  id: string
  name: string
  description: string
  status: string
  variants: StoreProductListItemVariant[]
}

type StoreProductFilterCounts = {
  status: Record<StoreProductStatusFilter, number>
  stock: Record<StoreProductStockFilter, number>
}

export interface StoreProductAttributeFacet {
  key: string
  value: string
  count: number
}

export interface StoreProductAttributeFacetGroup {
  key: string
  values: StoreProductAttributeFacet[]
}

export interface StoreProductSummaryMetrics {
  totalProducts: number
  activeProducts: number
  draftProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalUnits: number
}

function getProductTotalStock(product: StoreProductListItem) {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0)
}

function hasLowStock(product: StoreProductListItem) {
  return product.variants.some((variant) => variant.stock > 0 && variant.stock <= 5)
}

function hasOutOfStock(product: StoreProductListItem) {
  return product.variants.some((variant) => variant.stock <= 0)
}

function getHighestProductPrice(product: StoreProductListItem) {
  return product.variants.length > 0 ? Math.max(...product.variants.map((variant) => variant.priceMxn)) : 0
}

function matchesStoreProductStatus(status: string, filter: StoreProductStatusFilter) {
  return filter === "all" || status === filter
}

function matchesStoreProductStock(product: StoreProductListItem, filter: StoreProductStockFilter) {
  if (filter === "all") return true

  const totalStock = getProductTotalStock(product)
  if (filter === "in_stock") return totalStock > 0
  if (filter === "low_stock") return hasLowStock(product)
  if (filter === "out_of_stock") return hasOutOfStock(product)

  return true
}

function matchesStoreProductQuery(product: StoreProductListItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const searchable = [
    product.name,
    product.description,
    ...product.variants.flatMap((variant) => [variant.name, variant.sku]),
  ].join(" ").toLowerCase()

  return searchable.includes(normalizedQuery)
}

function matchesStoreProductAttributeFilter(
  variant: StoreProductListItemVariant,
  attributeKey: string,
  attributeValue: string
) {
  const normalizedKey = attributeKey.trim().toLowerCase()
  const normalizedValue = attributeValue.trim().toLowerCase()
  if (!normalizedKey && !normalizedValue) return true

  return Object.entries(variant.attributes ?? {}).some(([key, value]) => {
    const matchesKey = normalizedKey ? key.toLowerCase().includes(normalizedKey) : true
    const matchesValue = normalizedValue ? value.toLowerCase().includes(normalizedValue) : true
    return matchesKey && matchesValue
  })
}

function matchesStoreProductAttributes(
  variant: StoreProductListItemVariant,
  attributes: StoreProductAttributeFilter[]
) {
  if (attributes.length === 0) return true
  return attributes.every((attribute) => (
    matchesStoreProductAttributeFilter(variant, attribute.key, attribute.value)
  ))
}

function getMatchingVariants(
  product: StoreProductListItem,
  view: StoreProductsViewState,
  options?: { ignoreAttributeKey?: string | null }
) {
  const ignoredAttributeKey = options?.ignoreAttributeKey?.trim().toLowerCase() || ""
  const relevantAttributes = ignoredAttributeKey
    ? view.attributes.filter((attribute) => attribute.key.trim().toLowerCase() !== ignoredAttributeKey)
    : view.attributes

  return product.variants.filter((variant) => matchesStoreProductAttributes(variant, relevantAttributes))
}

export function filterStoreProducts(products: StoreProductListItem[], view: StoreProductsViewState) {
  return [...products]
    .filter((product) => (
      matchesStoreProductStatus(product.status, view.status)
      && matchesStoreProductStock(product, view.stock)
      && matchesStoreProductQuery(product, view.q)
      && getMatchingVariants(product, view).length > 0
    ))
    .sort((left, right) => compareStoreProducts(left, right, view.sort))
}

function compareStoreProducts(
  left: StoreProductListItem,
  right: StoreProductListItem,
  sort: StoreProductSort
) {
  if (sort === "name_asc") {
    return left.name.localeCompare(right.name, "es")
  }

  if (sort === "price_desc") {
    return getHighestProductPrice(right) - getHighestProductPrice(left)
  }

  if (sort === "stock_asc") {
    return getProductTotalStock(left) - getProductTotalStock(right)
  }

  return 0
}

export function getStoreProductFilterCounts(
  products: StoreProductListItem[],
  view: StoreProductsViewState
): StoreProductFilterCounts {
  const statusCounts: Record<StoreProductStatusFilter, number> = {
    all: 0,
    active: 0,
    draft: 0,
    archived: 0,
  }
  const stockCounts: Record<StoreProductStockFilter, number> = {
    all: 0,
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
  }

  for (const product of products) {
    if (
      matchesStoreProductStock(product, view.stock)
      && matchesStoreProductQuery(product, view.q)
      && getMatchingVariants(product, view).length > 0
    ) {
      statusCounts.all += 1
      if (product.status in statusCounts) {
        statusCounts[product.status as StoreProductStatusFilter] += 1
      }
    }

    if (
      matchesStoreProductStatus(product.status, view.status)
      && matchesStoreProductQuery(product, view.q)
      && getMatchingVariants(product, view).length > 0
    ) {
      stockCounts.all += 1
      if (matchesStoreProductStock(product, "in_stock")) stockCounts.in_stock += 1
      if (matchesStoreProductStock(product, "low_stock")) stockCounts.low_stock += 1
      if (matchesStoreProductStock(product, "out_of_stock")) stockCounts.out_of_stock += 1
    }
  }

  return {
    status: statusCounts,
    stock: stockCounts,
  }
}

export function getStoreProductSummaryMetrics(products: StoreProductListItem[]): StoreProductSummaryMetrics {
  return products.reduce<StoreProductSummaryMetrics>((summary, product) => {
    summary.totalProducts += 1
    summary.totalUnits += getProductTotalStock(product)
    if (product.status === "active") summary.activeProducts += 1
    if (product.status === "draft") summary.draftProducts += 1
    if (hasLowStock(product)) summary.lowStockProducts += 1
    if (hasOutOfStock(product)) summary.outOfStockProducts += 1
    return summary
  }, {
    totalProducts: 0,
    activeProducts: 0,
    draftProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalUnits: 0,
  })
}

export function getStoreProductAttributeFacets(
  products: StoreProductListItem[],
  view: StoreProductsViewState,
  limit = 6,
  options?: { ignoreAttributeKey?: string | null }
): StoreProductAttributeFacet[] {
  const counts = new Map<string, StoreProductAttributeFacet>()
  const ignoredAttributeKey = options?.ignoreAttributeKey?.trim().toLowerCase() || ""

  for (const product of products) {
    if (
      !matchesStoreProductStatus(product.status, view.status)
      || !matchesStoreProductStock(product, view.stock)
      || !matchesStoreProductQuery(product, view.q)
    ) {
      continue
    }

    for (const variant of getMatchingVariants(product, view, { ignoreAttributeKey: ignoredAttributeKey })) {
      for (const [key, value] of Object.entries(variant.attributes ?? {})) {
        const trimmedKey = key.trim()
        const trimmedValue = value.trim()
        if (!trimmedKey || !trimmedValue) continue

        const facetId = `${trimmedKey.toLowerCase()}::${trimmedValue.toLowerCase()}`
        const current = counts.get(facetId)
        if (current) {
          current.count += 1
        } else {
          counts.set(facetId, { key: trimmedKey, value: trimmedValue, count: 1 })
        }
      }
    }
  }

  return [...counts.values()]
    .filter((facet) => (
      !view.attributes.some((attribute) => {
        const sameKey = facet.key.toLowerCase() === attribute.key.trim().toLowerCase()
        const sameValue = facet.value.toLowerCase() === attribute.value.trim().toLowerCase()
        if (ignoredAttributeKey && sameKey) return false
        return sameKey && sameValue
      })
    ))
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count
      const keyCompare = left.key.localeCompare(right.key, "es")
      if (keyCompare !== 0) return keyCompare
      return left.value.localeCompare(right.value, "es")
    })
    .slice(0, limit)
}

export function getStoreProductAttributeFacetGroups(
  products: StoreProductListItem[],
  view: StoreProductsViewState,
  groupLimit = 3,
  valuesPerGroup = 4
): StoreProductAttributeFacetGroup[] {
  const facets = getStoreProductAttributeFacets(products, view, 100)
  const groups = new Map<string, StoreProductAttributeFacet[]>()

  for (const facet of facets) {
    const group = groups.get(facet.key) ?? []
    group.push(facet)
    groups.set(facet.key, group)
  }

  return [...groups.entries()]
    .map(([key, values]) => ({
      key,
      values: values
        .sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count
          return left.value.localeCompare(right.value, "es")
        })
        .slice(0, valuesPerGroup),
    }))
    .sort((left, right) => {
      const leftCount = left.values.reduce((sum, facet) => sum + facet.count, 0)
      const rightCount = right.values.reduce((sum, facet) => sum + facet.count, 0)
      if (rightCount !== leftCount) return rightCount - leftCount
      return left.key.localeCompare(right.key, "es")
    })
    .slice(0, groupLimit)
}

export function getStoreProductAttributeFacetValues(
  products: StoreProductListItem[],
  view: StoreProductsViewState,
  facetKey: string,
  limit = 12
): StoreProductAttributeFacet[] {
  const trimmedFacetKey = facetKey.trim().toLowerCase()
  if (!trimmedFacetKey) return []

  return getStoreProductAttributeFacets(products, view, 200, { ignoreAttributeKey: trimmedFacetKey })
    .filter((facet) => facet.key.toLowerCase() === trimmedFacetKey)
    .slice(0, limit)
}
