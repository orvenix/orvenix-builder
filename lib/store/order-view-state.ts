export type StoreOrderStatusFilter = "all" | "pending" | "paid" | "fulfilled" | "refunded" | "canceled"
export type StoreOrderContextFilter = "all" | "funnel" | "offer" | "paid"

export interface StoreOrdersViewState {
  q: string
  status: StoreOrderStatusFilter
  context: StoreOrderContextFilter
  step: string
  offerType: string
  facetKey: string
}

const ORDER_STATUS_VALUES = new Set<StoreOrderStatusFilter>(["all", "pending", "paid", "fulfilled", "refunded", "canceled"])
const ORDER_CONTEXT_VALUES = new Set<StoreOrderContextFilter>(["all", "funnel", "offer", "paid"])

export function buildStoreOrdersViewQuery(view: StoreOrdersViewState): string {
  const params = new URLSearchParams()
  const trimmedQuery = view.q.trim()
  const trimmedStep = view.step.trim()
  const trimmedOfferType = view.offerType.trim()
  const trimmedFacetKey = view.facetKey.trim()
  if (trimmedQuery) params.set("q", trimmedQuery)
  if (view.status !== "all") params.set("status", view.status)
  if (view.context !== "all") params.set("context", view.context)
  if (trimmedStep) params.set("orderStep", trimmedStep)
  if (trimmedOfferType) params.set("orderOfferType", trimmedOfferType)
  if (trimmedFacetKey) params.set("orderFacetKey", trimmedFacetKey)
  return params.toString()
}

export function parseStoreOrdersViewState(
  input: { get(name: string): string | null }
): StoreOrdersViewState {
  const q = input.get("q")?.trim() || ""
  const rawStatus = input.get("status")
  const rawContext = input.get("context")
  const step = input.get("orderStep")?.trim() || ""
  const offerType = input.get("orderOfferType")?.trim() || ""
  const facetKey = input.get("orderFacetKey")?.trim() || ""

  return {
    q,
    status: rawStatus && ORDER_STATUS_VALUES.has(rawStatus as StoreOrderStatusFilter)
      ? rawStatus as StoreOrderStatusFilter
      : "all",
    context: rawContext && ORDER_CONTEXT_VALUES.has(rawContext as StoreOrderContextFilter)
      ? rawContext as StoreOrderContextFilter
      : "all",
    step,
    offerType,
    facetKey,
  }
}
