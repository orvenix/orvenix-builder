export interface StoreDashboardSelectionState {
  selectedOrderId: string
  expandedProductId: string
  editAutomationId: string
  editFunnelId: string
  editExperimentId: string
}

export function buildStoreDashboardSelectionQuery(view: StoreDashboardSelectionState): string {
  const params = new URLSearchParams()
  const selectedOrderId = view.selectedOrderId.trim()
  const expandedProductId = view.expandedProductId.trim()
  const editAutomationId = view.editAutomationId.trim()
  const editFunnelId = view.editFunnelId.trim()
  const editExperimentId = view.editExperimentId.trim()

  if (selectedOrderId) params.set("selectedOrderId", selectedOrderId)
  if (expandedProductId) params.set("expandedProductId", expandedProductId)
  if (editAutomationId) params.set("editAutomationId", editAutomationId)
  if (editFunnelId) params.set("editFunnelId", editFunnelId)
  if (editExperimentId) params.set("editExperimentId", editExperimentId)

  return params.toString()
}

export function parseStoreDashboardSelectionState(
  input: { get(name: string): string | null }
): StoreDashboardSelectionState {
  return {
    selectedOrderId: input.get("selectedOrderId")?.trim() || "",
    expandedProductId: input.get("expandedProductId")?.trim() || "",
    editAutomationId: input.get("editAutomationId")?.trim() || "",
    editFunnelId: input.get("editFunnelId")?.trim() || "",
    editExperimentId: input.get("editExperimentId")?.trim() || "",
  }
}
