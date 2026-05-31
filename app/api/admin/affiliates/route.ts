import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { getAllAffiliates, updateAffiliateStatus, type AffiliateStatus } from "@/lib/affiliates"

export async function GET() {
  const session = await getAuthSession()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acceso restringido" }, { status: 403 })

  const affiliates = await getAllAffiliates()
  return NextResponse.json({ affiliates })
}

export async function PATCH(request: Request) {
  const session = await getAuthSession()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Acceso restringido" }, { status: 403 })

  const body = await request.json() as { id: string; status: AffiliateStatus }
  if (!body.id || !body.status) return NextResponse.json({ error: "Faltan datos" }, { status: 400 })

  await updateAffiliateStatus(body.id, body.status)
  return NextResponse.json({ ok: true })
}
