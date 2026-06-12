export type StoreDashboardTab = "products" | "orders" | "funnels" | "experiments" | "automations"

const STORE_DASHBOARD_TAB_VALUES = new Set<StoreDashboardTab>([
  "products",
  "orders",
  "funnels",
  "experiments",
  "automations",
])

export function buildStoreDashboardTabQuery(tab: StoreDashboardTab): string {
  if (tab === "products") return ""

  const params = new URLSearchParams()
  params.set("tab", tab)
  return params.toString()
}

export function parseStoreDashboardTab(
  input: { get(name: string): string | null }
): StoreDashboardTab {
  const rawTab = input.get("tab")

  return rawTab && STORE_DASHBOARD_TAB_VALUES.has(rawTab as StoreDashboardTab)
    ? rawTab as StoreDashboardTab
    : "products"
}
