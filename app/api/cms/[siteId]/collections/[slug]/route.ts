import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"
import { canManageSite } from "@/lib/auth"
import type { UserRole } from "@/lib/auth"
import { CmsFieldsSchema } from "@/lib/cms/schema"
import { z } from "zod"
import type { Prisma } from "@/generated/editor-prisma"

type Ctx = { params: Promise<{ siteId: string; slug: string }> }

const UpdateSchema = z.object({
  name:   z.string().min(1).max(128).optional(),
  fields: CmsFieldsSchema.optional(),
})

// GET /api/cms/[siteId]/collections/[slug]
export async function GET(_req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const collection = await editorPrisma.collection.findUnique({
    where: { siteId_slug: { siteId, slug } },
  })
  if (!collection) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ collection })
}

// PATCH /api/cms/[siteId]/collections/[slug]
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const body = UpdateSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const collection = await editorPrisma.collection.update({
    where: { siteId_slug: { siteId, slug } },
    data: {
      ...(body.data.name   ? { name: body.data.name }                                       : {}),
      ...(body.data.fields ? { fields: body.data.fields as Prisma.InputJsonValue } : {}),
    },
  })

  return NextResponse.json({ collection })
}

// DELETE /api/cms/[siteId]/collections/[slug]
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })

  const { siteId, slug } = await params
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  await editorPrisma.collection.delete({
    where: { siteId_slug: { siteId, slug } },
  })

  return NextResponse.json({ ok: true })
}
