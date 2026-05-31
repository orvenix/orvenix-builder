import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite, type UserRole } from "@/lib/auth"
import { getSiteAnalytics } from "@/lib/analytics"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params

  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const analytics = await getSiteAnalytics(siteId)
  return NextResponse.json(analytics)
}
