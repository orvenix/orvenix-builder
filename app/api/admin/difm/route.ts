import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import {
  getEditRequestsForRole,
  getEditRequestById,
  updateEditRequestStatusForRole,
  type EditRequestStatus,
} from "@/lib/editRequests"

async function requireAdmin() {
  const session = await getAuthSession()
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

// GET — todos los tickets
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Acceso restringido" }, { status: 403 })

  const tickets = await getEditRequestsForRole(admin.id, "ADMIN")
  return NextResponse.json({ tickets })
}

// PATCH — cambiar estado con notificación al cliente
export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Acceso restringido" }, { status: 403 })

  const body = await request.json() as { ticketId: string; status: EditRequestStatus }
  if (!body.ticketId || !body.status) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
  }

  // Obtener datos del ticket para la notificación
  const ticket = await getEditRequestById(body.ticketId)
  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })

  await updateEditRequestStatusForRole({
    ticketId: body.ticketId,
    status: body.status,
    userId: admin.id,
    role: "ADMIN",
    notifyEmail: {
      userEmail: ticket.userEmail,
      userName: ticket.userEmail.split("@")[0],
      siteName: ticket.siteName ?? ticket.templateName ?? "Tu sitio",
    },
  })

  return NextResponse.json({ ok: true })
}
