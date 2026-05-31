export const CMS_WORKFLOW_META_KEY = "__orvenix"
export const CMS_WORKFLOW_STATUSES = ["draft", "review", "published"] as const

export type CmsWorkflowStatus = (typeof CMS_WORKFLOW_STATUSES)[number]

type CmsWorkflowMeta = {
  workflowStatus?: CmsWorkflowStatus
}

function toRecordData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return { ...(value as Record<string, unknown>) }
}

function toWorkflowMeta(value: unknown): CmsWorkflowMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return { ...(value as CmsWorkflowMeta) }
}

export function isCmsWorkflowStatus(value: unknown): value is CmsWorkflowStatus {
  return typeof value === "string" && CMS_WORKFLOW_STATUSES.includes(value as CmsWorkflowStatus)
}

export function getCmsWorkflowStatus(data: unknown, publishedAt: unknown): CmsWorkflowStatus {
  if (publishedAt) return "published"

  const source = toRecordData(data)
  const meta = toWorkflowMeta(source[CMS_WORKFLOW_META_KEY])
  return meta.workflowStatus === "review" ? "review" : "draft"
}

export function withCmsWorkflowStatus(data: unknown, status: CmsWorkflowStatus): Record<string, unknown> {
  const source = toRecordData(data)
  const meta = toWorkflowMeta(source[CMS_WORKFLOW_META_KEY])

  source[CMS_WORKFLOW_META_KEY] = {
    ...meta,
    workflowStatus: status,
  }

  return source
}

export function getCmsWorkflowPublishedAt(status: CmsWorkflowStatus, current?: Date | string | null): Date | null {
  if (status === "published") {
    if (current instanceof Date) return current
    if (typeof current === "string" && current) return new Date(current)
    return new Date()
  }

  return null
}

export function stripCmsWorkflowMeta(data: unknown): Record<string, unknown> {
  const source = toRecordData(data)
  delete source[CMS_WORKFLOW_META_KEY]
  return source
}
