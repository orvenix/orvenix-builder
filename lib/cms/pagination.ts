export const CMS_RECORDS_PAGE_SIZE = 25
export const CMS_RECORDS_MAX_PAGE_SIZE = 100

function toPositiveInteger(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function parseCmsRecordsPagination(pageInput: string | null, limitInput: string | null) {
  const page = toPositiveInteger(pageInput) ?? 1
  const requestedLimit = toPositiveInteger(limitInput) ?? CMS_RECORDS_PAGE_SIZE
  const limit = Math.min(requestedLimit, CMS_RECORDS_MAX_PAGE_SIZE)

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  }
}

export function getCmsRecordsPageCount(total: number, limit = CMS_RECORDS_PAGE_SIZE): number {
  if (total <= 0) return 1
  return Math.max(1, Math.ceil(total / limit))
}
