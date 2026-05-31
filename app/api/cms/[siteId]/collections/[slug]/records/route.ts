import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import type { Prisma } from "@/generated/editor-prisma"
import { normalizeCmsRecordData, parseCmsFields } from "@/lib/cms/schema"
import { resolveCmsRecordRelations } from "@/lib/cms/relations"
import {
  getCmsWorkflowPublishedAt,
  getCmsWorkflowStatus,
  isCmsWorkflowStatus,
  withCmsWorkflowStatus,
} from "@/lib/cms/workflow"
import { triggerAutomations } from "@/lib/automation/runtime"

type Ctx = { params: Promise<{ siteId: string; slug: string }> }

// GET /api/cms/[siteId]/collections/[slug]/records
// Query params: page=1&limit=50&published=true&status=draft|review|published
export async function GET(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const collection = await editorPrisma.collection.findUnique({
    where: { siteId_slug: { siteId, slug } },
    select: { id: true, slug: true, fields: true },
  })
  if (!collection) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const url = new URL(req.url)
  const page    = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1",  10))
  const limit   = Math.min(200, parseInt(url.searchParams.get("limit") ?? "50", 10))
  const onlyPub = url.searchParams.get("published") === "true"
  const expandRelations = url.searchParams.get("expand") === "relations"
  const statusParam = url.searchParams.get("status")
  const workflowStatus = isCmsWorkflowStatus(statusParam) ? statusParam : null
  const search = (url.searchParams.get("q") ?? "").trim().toLowerCase()
  const sort = url.searchParams.get("sort") ?? "createdAt_desc"
  const recordId = (url.searchParams.get("recordId") ?? "").trim()

  const baseWhere = {
    collectionId: collection.id,
    ...(recordId ? { id: recordId } : {}),
    ...(onlyPub || workflowStatus === "published" ? { publishedAt: { not: null } } : {}),
  }

  const requiresClientFilter = Boolean(search) || (workflowStatus && workflowStatus !== "published") || sort !== "createdAt_desc"

  const recordsResult = await editorPrisma.record.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
    ...(requiresClientFilter ? {} : {
      skip: (page - 1) * limit,
      take: limit,
    }),
  })

  const filteredRecords = recordsResult
    .filter((record) => !workflowStatus || getCmsWorkflowStatus(record.data, record.publishedAt) === workflowStatus)
    .filter((record) => {
      if (!search) return true
      const haystack = JSON.stringify(record.data).toLowerCase()
      return haystack.includes(search)
    })
    .sort((left, right) => {
      switch (sort) {
        case "createdAt_asc":
          return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        case "updatedAt_desc":
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        case "updatedAt_asc":
          return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
        case "status_asc":
          return getCmsWorkflowStatus(left.data, left.publishedAt).localeCompare(getCmsWorkflowStatus(right.data, right.publishedAt))
        case "status_desc":
          return getCmsWorkflowStatus(right.data, right.publishedAt).localeCompare(getCmsWorkflowStatus(left.data, left.publishedAt))
        case "createdAt_desc":
        default:
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      }
    })

  const total = filteredRecords.length
  const records = requiresClientFilter
    ? filteredRecords.slice((page - 1) * limit, page * limit)
    : filteredRecords

  const payloadRecords = expandRelations
    ? (await resolveCmsRecordRelations(siteId, collection, records)).map((record, index) => ({
        ...record,
        publishedAt: records[index]?.publishedAt ?? null,
        createdAt: records[index]?.createdAt,
        updatedAt: records[index]?.updatedAt,
        workflowStatus: getCmsWorkflowStatus(records[index]?.data, records[index]?.publishedAt),
      }))
    : records.map((record) => ({
        ...record,
        workflowStatus: getCmsWorkflowStatus(record.data, record.publishedAt),
      }))

  return NextResponse.json({ records: payloadRecords, total, page, limit })
}

// POST /api/cms/[siteId]/collections/[slug]/records — crear record
export async function POST(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const collection = await editorPrisma.collection.findUnique({
    where: { siteId_slug: { siteId, slug } },
    select: { id: true, fields: true },
  })
  if (!collection) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const body = await req.json() as { data?: unknown; published?: boolean; workflowStatus?: unknown }
  const fields = parseCmsFields(collection.fields)
  const status = isCmsWorkflowStatus(body.workflowStatus)
    ? body.workflowStatus
    : body.published
      ? "published"
      : "draft"
  const data = withCmsWorkflowStatus(normalizeCmsRecordData(fields, body.data ?? {}), status)
  const record = await editorPrisma.record.create({
    data: {
      collectionId: collection.id,
      data: data as Prisma.InputJsonValue,
      publishedAt: getCmsWorkflowPublishedAt(status),
    },
  })

  triggerAutomations(siteId, "cms_record_created", {
    collectionSlug: slug,
    recordId: record.id,
    workflowStatus: status,
    publishedAt: record.publishedAt,
    eventLabel: "cms_record_created",
  }).catch(() => {})

  return NextResponse.json({ record }, { status: 201 })
}
