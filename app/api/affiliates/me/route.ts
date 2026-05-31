import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { getAffiliateByUserId, createAffiliate, updateAffiliatePayment } from "@/lib/affiliates"

// GET — perfil de afiliado del usuario autenticado
export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const affiliate = await getAffiliateByUserId(session.user.id)
  return NextResponse.json({ affiliate })
}

// POST — unirse al programa (crea perfil si no existe)
export async function POST() {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const affiliate = await createAffiliate({
    userId: session.user.id,
    userEmail: session.user.email ?? "",
    userName: session.user.name ?? session.user.email?.split("@")[0] ?? "Afiliado",
  })

  return NextResponse.json({ affiliate })
}

// PATCH — actualizar datos de pago
export async function PATCH(request: Request) {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json() as { paypalEmail?: string; bankInfo?: string }
  await updateAffiliatePayment(session.user.id, body)

  const affiliate = await getAffiliateByUserId(session.user.id)
  return NextResponse.json({ affiliate })
}
