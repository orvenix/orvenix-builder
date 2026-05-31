import { getCmsWorkflowStatus, withCmsWorkflowStatus, type CmsWorkflowStatus } from "./workflow"

export interface CmsBulkRecordLike {
  id: string
  data: Record<string, unknown>
  publishedAt: Date | string | null
  workflowStatus?: CmsWorkflowStatus
}

export interface CmsBulkSelectionSummary {
  total: number
  draft: number
  review: number
  published: number
}

export function summarizeSelectedWorkflow(
  records: CmsBulkRecordLike[],
  selectedIds: Iterable<string>
): CmsBulkSelectionSummary {
  const idSet = new Set(selectedIds)
  const summary: CmsBulkSelectionSummary = {
    total: 0,
    draft: 0,
    review: 0,
    published: 0,
  }

  for (const record of records) {
    if (!idSet.has(record.id)) continue
    const status = record.workflowStatus ?? getCmsWorkflowStatus(record.data, record.publishedAt)
    summary.total += 1
    summary[status] += 1
  }

  return summary
}

export function applyBulkWorkflowStatus<T extends CmsBulkRecordLike>(
  records: T[],
  selectedIds: Iterable<string>,
  workflowStatus: CmsWorkflowStatus,
  publishedAtValue = new Date().toISOString()
): T[] {
  const idSet = new Set(selectedIds)

  return records.map((record) => {
    if (!idSet.has(record.id)) return record
    return {
      ...record,
      data: withCmsWorkflowStatus(record.data, workflowStatus),
      publishedAt: workflowStatus === "published" ? publishedAtValue : null,
      workflowStatus,
    }
  })
}

export function removeBulkSelectedRecords<T extends CmsBulkRecordLike>(
  records: T[],
  selectedIds: Iterable<string>
): T[] {
  const idSet = new Set(selectedIds)
  return records.filter((record) => !idSet.has(record.id))
}
