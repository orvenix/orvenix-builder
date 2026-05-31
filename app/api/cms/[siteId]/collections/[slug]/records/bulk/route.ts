import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import type { Prisma } from "@/generated/editor-prisma"
import {
  getCmsWorkflowPublishedAt,
  getCmsWorkflowStatus,
  isCmsWorkflowStatus,
  withCmsWorkflowStatus,
} from "@/lib/cms/workflow"

type Ctx = { params: Promise<{ siteId: string; slug: string }> }

const BulkSchema = z.object({
  action: z.enum(["setWorkflowStatus", "delete"]),
  recordIds: z.array(z.string().min(1)).min(1).max(200),
  workflowStatus: z.unknown().optional(),
})

export async function POST(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const body = BulkSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 })

  const collection = await editorPrisma.collection.findUnique({
    where: { siteId_slug: { siteId, slug } },
    select: { id: true },
  })
  if (!collection) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const records = await editorPrisma.record.findMany({
    where: {
      collectionId: collection.id,
      id: { in: body.data.recordIds },
    },
    select: {
      id: true,
      data: true,
      publishedAt: true,
    },
  })

  if (records.length !== body.data.recordIds.length) {
    return NextResponse.json({ error: "RECORDS_NOT_FOUND" }, { status: 404 })
  }

  if (body.data.action === "delete") {
    await editorPrisma.record.deleteMany({
      where: {
        collectionId: collection.id,
        id: { in: body.data.recordIds },
      },
    })

    return NextResponse.json({
      ok: true,
      affected: records.length,
      deletedIds: body.data.recordIds,
    })
  }

  if (!isCmsWorkflowStatus(body.data.workflowStatus)) {
    return NextResponse.json({ error: "INVALID_WORKFLOW_STATUS" }, { status: 400 })
  }

  const workflowStatus = body.data.workflowStatus

  await editorPrisma.$transaction(
    records.map((record) =>
      editorPrisma.record.update({
        where: { id: record.id },
        data: {
          data: withCmsWorkflowStatus(record.data, workflowStatus) as Prisma.InputJsonValue,
          publishedAt: getCmsWorkflowPublishedAt(
            workflowStatus,
            workflowStatus === getCmsWorkflowStatus(record.data, record.publishedAt) ? record.publishedAt : null
          ),
        },
      })
    )
  )

  return NextResponse.json({
    ok: true,
    affected: records.length,
    workflowStatus,
  })
}
