import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import type { Prisma } from "@/generated/editor-prisma"
import { parseCmsFields, validateCmsRecordData } from "@/lib/cms/schema"
import {
  getCmsWorkflowPublishedAt,
  getCmsWorkflowStatus,
  isCmsWorkflowStatus,
  withCmsWorkflowStatus,
  withCmsWorkflowStatusApproval,
} from "@/lib/cms/workflow"

type Ctx = { params: Promise<{ siteId: string; slug: string; id: string }> }

// PATCH /api/cms/[siteId]/collections/[slug]/records/[id]
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug, id } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const body = await req.json() as { data?: unknown; published?: boolean; workflowStatus?: unknown; workflowComment?: unknown }
  const collection = await editorPrisma.collection.findUnique({
    where: { siteId_slug: { siteId, slug } },
    select: { id: true, fields: true },
  })
  if (!collection) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const fields = parseCmsFields(collection.fields)
  const existingRecord = await editorPrisma.record.findFirst({
    where: { id, collectionId: collection.id },
    select: { id: true, data: true, publishedAt: true },
  })
  if (!existingRecord) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const status = isCmsWorkflowStatus(body.workflowStatus)
    ? body.workflowStatus
    : body.published !== undefined
      ? (body.published ? "published" : "draft")
      : getCmsWorkflowStatus(existingRecord.data, existingRecord.publishedAt)

  const validation = body.data !== undefined
    ? validateCmsRecordData(fields, body.data)
    : null
  if (validation && !validation.valid) {
    return NextResponse.json(
      { error: "CMS_VALIDATION_FAILED", errors: validation.errors },
      { status: 400 },
    )
  }

  const baseData = validation?.data ?? (existingRecord.data as Record<string, unknown>)
  const currentStatus = getCmsWorkflowStatus(existingRecord.data, existingRecord.publishedAt)
  const shouldRecordApproval = status !== currentStatus || body.workflowStatus !== undefined || body.published !== undefined
  const workflowComment = typeof body.workflowComment === "string" ? body.workflowComment : undefined
  const nextData = shouldRecordApproval
    ? withCmsWorkflowStatusApproval(
        baseData,
        status,
        {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        workflowComment,
      )
    : withCmsWorkflowStatus(baseData, status)

  const record = await editorPrisma.record.update({
    where: { id },
    data: {
      data: nextData as Prisma.InputJsonValue,
      publishedAt: getCmsWorkflowPublishedAt(status, existingRecord.publishedAt),
    },
  })

  return NextResponse.json({ record })
}

// DELETE /api/cms/[siteId]/collections/[slug]/records/[id]
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug, id } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  // Verificar que el record pertenece al site correcto
  const record = await editorPrisma.record.findFirst({
    where: { id, collection: { siteId, slug } },
    select: { id: true },
  })
  if (!record) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  await editorPrisma.record.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
