import { getCmsWorkflowStatus, type CmsWorkflowStatus } from "./workflow"

export interface CmsWorkflowRecordLike {
  data: unknown
  publishedAt: Date | string | null
}

export interface CmsWorkflowSummary {
  total: number
  draft: number
  review: number
  published: number
}

export interface CmsCollectionWithSummary<TCollection> {
  collection: TCollection
  workflow: CmsWorkflowSummary
}

export function getEmptyCmsWorkflowSummary(): CmsWorkflowSummary {
  return {
    total: 0,
    draft: 0,
    review: 0,
    published: 0,
  }
}

export function summarizeCmsWorkflowRecords(records: CmsWorkflowRecordLike[]): CmsWorkflowSummary {
  const summary = getEmptyCmsWorkflowSummary()

  for (const record of records) {
    const status = getCmsWorkflowStatus(record.data, record.publishedAt)
    summary.total += 1
    summary[status] += 1
  }

  return summary
}

export function mergeCmsWorkflowSummaries(summaries: CmsWorkflowSummary[]): CmsWorkflowSummary {
  return summaries.reduce((acc, summary) => ({
    total: acc.total + summary.total,
    draft: acc.draft + summary.draft,
    review: acc.review + summary.review,
    published: acc.published + summary.published,
  }), getEmptyCmsWorkflowSummary())
}

export function getCmsWorkflowSummaryTone(status: CmsWorkflowStatus): "neutral" | "review" | "published" {
  if (status === "published") return "published"
  if (status === "review") return "review"
  return "neutral"
}
