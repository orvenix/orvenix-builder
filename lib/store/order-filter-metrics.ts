import { getOrderNoteFilterMeta } from "../commerce/order-notes"
import {
  type StoreOrderContextFilter,
  type StoreOrdersViewState,
  type StoreOrderStatusFilter,
} from "./order-view-state"

export interface StoreOrderListItem {
  id: string
  customerEmail: string
  customerName?: string | null
  status: string
  notes?: string | null
  totalMxn?: number
}

type StoreOrderFilterCounts = {
  status: Record<StoreOrderStatusFilter, number>
  context: Record<StoreOrderContextFilter, number>
}

export interface StoreOrderMetaFacet {
  value: string
  count: number
}

export interface StoreOrderMetaFacetGroup {
  key: "step" | "offerType"
  label: string
  values: StoreOrderMetaFacet[]
}

export interface StoreOrderSummaryMetrics {
  totalOrders: number
  totalRevenueMxn: number
  pendingOrders: number
  paidOrders: number
  offerOrders: number
  funnelOrders: number
}

function matchesStoreOrderStatus(status: string, filter: StoreOrderStatusFilter) {
  return filter === "all" || status === filter
}

function matchesStoreOrderContext(
  status: string,
  notes: string | null | undefined,
  filter: StoreOrderContextFilter
) {
  if (filter === "all") return true

  const noteMeta = getOrderNoteFilterMeta(notes)
  if (filter === "funnel") return noteMeta.hasFunnel
  if (filter === "offer") return noteMeta.hasOffer
  if (filter === "paid") return noteMeta.isPaidTracked || status === "paid" || status === "fulfilled"

  return true
}

function matchesStoreOrderQuery(order: StoreOrderListItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const noteMeta = getOrderNoteFilterMeta(order.notes)
  const searchable = [
    order.id,
    order.customerName ?? "",
    order.customerEmail,
    noteMeta.step ?? "",
    noteMeta.stepId ?? "",
    noteMeta.offerType ?? "",
  ].join(" ").toLowerCase()

  return searchable.includes(normalizedQuery)
}

function matchesStoreOrderStep(notes: string | null | undefined, step: string) {
  const normalizedStep = step.trim().toLowerCase()
  if (!normalizedStep) return true
  const noteMeta = getOrderNoteFilterMeta(notes)
  return (noteMeta.step ?? "").toLowerCase().includes(normalizedStep)
}

function matchesStoreOrderOfferType(notes: string | null | undefined, offerType: string) {
  const normalizedOfferType = offerType.trim().toLowerCase()
  if (!normalizedOfferType) return true
  const noteMeta = getOrderNoteFilterMeta(notes)
  return (noteMeta.offerType ?? "").toLowerCase().includes(normalizedOfferType)
}

function matchesStoreOrderMeta(
  order: StoreOrderListItem,
  view: StoreOrdersViewState,
  options?: { ignoreStep?: boolean; ignoreOfferType?: boolean }
) {
  return (
    matchesStoreOrderStatus(order.status, view.status)
    && matchesStoreOrderContext(order.status, order.notes, view.context)
    && matchesStoreOrderQuery(order, view.q)
    && (options?.ignoreStep ? true : matchesStoreOrderStep(order.notes, view.step))
    && (options?.ignoreOfferType ? true : matchesStoreOrderOfferType(order.notes, view.offerType))
  )
}

export function filterStoreOrders(orders: StoreOrderListItem[], view: StoreOrdersViewState) {
  return orders.filter((order) => matchesStoreOrderMeta(order, view))
}

export function getStoreOrderFilterCounts(
  orders: StoreOrderListItem[],
  view: StoreOrdersViewState
): StoreOrderFilterCounts {
  const statusCounts: Record<StoreOrderStatusFilter, number> = {
    all: 0,
    pending: 0,
    paid: 0,
    fulfilled: 0,
    refunded: 0,
    canceled: 0,
  }
  const contextCounts: Record<StoreOrderContextFilter, number> = {
    all: 0,
    funnel: 0,
    offer: 0,
    paid: 0,
  }

  for (const order of orders) {
    if (matchesStoreOrderContext(order.status, order.notes, view.context)
      && matchesStoreOrderQuery(order, view.q)
      && matchesStoreOrderStep(order.notes, view.step)
      && matchesStoreOrderOfferType(order.notes, view.offerType)) {
      statusCounts.all += 1
      if (order.status in statusCounts) {
        statusCounts[order.status as StoreOrderStatusFilter] += 1
      }
    }

    if (
      matchesStoreOrderStatus(order.status, view.status)
      && matchesStoreOrderQuery(order, view.q)
      && matchesStoreOrderStep(order.notes, view.step)
      && matchesStoreOrderOfferType(order.notes, view.offerType)
    ) {
      contextCounts.all += 1
      if (matchesStoreOrderContext(order.status, order.notes, "funnel")) contextCounts.funnel += 1
      if (matchesStoreOrderContext(order.status, order.notes, "offer")) contextCounts.offer += 1
      if (matchesStoreOrderContext(order.status, order.notes, "paid")) contextCounts.paid += 1
    }
  }

  return {
    status: statusCounts,
    context: contextCounts,
  }
}

export function getStoreOrderSummaryMetrics(orders: StoreOrderListItem[]): StoreOrderSummaryMetrics {
  return orders.reduce<StoreOrderSummaryMetrics>((summary, order) => {
    const noteMeta = getOrderNoteFilterMeta(order.notes)
    const totalMxn = typeof order.totalMxn === "number" && Number.isFinite(order.totalMxn)
      ? order.totalMxn
      : 0

    summary.totalOrders += 1
    summary.totalRevenueMxn += totalMxn
    if (order.status === "pending") summary.pendingOrders += 1
    if (order.status === "paid" || order.status === "fulfilled") summary.paidOrders += 1
    if (noteMeta.hasOffer) summary.offerOrders += 1
    if (noteMeta.hasFunnel) summary.funnelOrders += 1

    return summary
  }, {
    totalOrders: 0,
    totalRevenueMxn: 0,
    pendingOrders: 0,
    paidOrders: 0,
    offerOrders: 0,
    funnelOrders: 0,
  })
}

export function getStoreOrderMetaFacetGroups(
  orders: StoreOrderListItem[],
  view: StoreOrdersViewState,
  valuesPerGroup = 4
): StoreOrderMetaFacetGroup[] {
  const stepCounts = new Map<string, number>()
  const offerTypeCounts = new Map<string, number>()

  for (const order of orders) {
    const noteMeta = getOrderNoteFilterMeta(order.notes)
    if (matchesStoreOrderMeta(order, view, { ignoreStep: true }) && noteMeta.step) {
      stepCounts.set(noteMeta.step, (stepCounts.get(noteMeta.step) ?? 0) + 1)
    }
    if (matchesStoreOrderMeta(order, view, { ignoreOfferType: true }) && noteMeta.offerType) {
      offerTypeCounts.set(noteMeta.offerType, (offerTypeCounts.get(noteMeta.offerType) ?? 0) + 1)
    }
  }

  const groups: StoreOrderMetaFacetGroup[] = []

  if (stepCounts.size > 0) {
    groups.push({
      key: "step",
      label: "Paso funnel",
      values: [...stepCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .filter((facet) => facet.value !== view.step)
        .sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count
          return left.value.localeCompare(right.value, "es")
        })
        .slice(0, valuesPerGroup),
    })
  }

  if (offerTypeCounts.size > 0) {
    groups.push({
      key: "offerType",
      label: "Tipo de oferta",
      values: [...offerTypeCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .filter((facet) => facet.value !== view.offerType)
        .sort((left, right) => {
          if (right.count !== left.count) return right.count - left.count
          return left.value.localeCompare(right.value, "es")
        })
        .slice(0, valuesPerGroup),
    })
  }

  return groups
}

export function getStoreOrderMetaFacetValues(
  orders: StoreOrderListItem[],
  view: StoreOrdersViewState,
  facetKey: string,
  limit = 12
): StoreOrderMetaFacet[] {
  const normalizedFacetKey = facetKey.trim()
  if (normalizedFacetKey !== "step" && normalizedFacetKey !== "offerType") return []

  const counts = new Map<string, number>()

  for (const order of orders) {
    const noteMeta = getOrderNoteFilterMeta(order.notes)
    const facetValue = normalizedFacetKey === "step" ? noteMeta.step : noteMeta.offerType
    if (!facetValue) continue

    const matches = normalizedFacetKey === "step"
      ? matchesStoreOrderMeta(order, view, { ignoreStep: true })
      : matchesStoreOrderMeta(order, view, { ignoreOfferType: true })

    if (!matches) continue
    counts.set(facetValue, (counts.get(facetValue) ?? 0) + 1)
  }

  const activeValue = normalizedFacetKey === "step" ? view.step : view.offerType

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .filter((facet) => facet.value !== activeValue)
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count
      return left.value.localeCompare(right.value, "es")
    })
    .slice(0, limit)
}
