import type { CmsWorkflowStatus } from "./workflow"

export type CmsRecordsSortValue =
  | "createdAt_desc"
  | "createdAt_asc"
  | "updatedAt_desc"
  | "updatedAt_asc"
  | "status_asc"
  | "status_desc"

export interface CmsRecordsViewState {
  q: string
  recordId: string
  status: "all" | CmsWorkflowStatus
  sort: CmsRecordsSortValue
}

export function buildCmsRecordsViewQuery(view: CmsRecordsViewState): string {
  const params = new URLSearchParams()

  const trimmedQuery = view.q.trim()
  const trimmedRecordId = view.recordId.trim()
  if (trimmedQuery) params.set("q", trimmedQuery)
  if (trimmedRecordId) params.set("recordId", trimmedRecordId)
  if (view.status !== "all") params.set("status", view.status)
  if (view.sort !== "createdAt_desc") params.set("sort", view.sort)

  return params.toString()
}
