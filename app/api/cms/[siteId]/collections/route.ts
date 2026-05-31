import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { CmsFieldsSchema } from "@/lib/cms/schema"
import { getEmptyCmsWorkflowSummary, summarizeCmsWorkflowRecords } from "@/lib/cms/collection-summary"
import { z } from "zod"

const CreateCollectionSchema = z.object({
  name:   z.string().min(1).max(128),
  slug:   z.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
  fields: CmsFieldsSchema.default([]),
})

// GET /api/cms/[siteId]/collections — lista colecciones del sitio
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const collections = await editorPrisma.collection.findMany({
    where: { siteId },
    include: {
      _count: { select: { records: true } },
      records: {
        select: {
          data: true,
          publishedAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    collections: collections.map(({ records, ...collection }) => ({
      ...collection,
      workflow: summarizeCmsWorkflowRecords(records),
    })),
  })
}

// POST /api/cms/[siteId]/collections — crear colección
export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const body = CreateCollectionSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const collection = await editorPrisma.collection.create({
    data: {
      siteId,
      name:   body.data.name,
      slug:   body.data.slug,
      fields: body.data.fields,
    },
  })

  return NextResponse.json({
    collection: {
      ...collection,
      _count: { records: 0 },
      workflow: getEmptyCmsWorkflowSummary(),
    },
  }, { status: 201 })
}
