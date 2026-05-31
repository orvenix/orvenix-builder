import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/auth"
import { createResetToken } from "@/lib/reset-tokens"
import { sendResetPasswordEmail } from "@/lib/email"
import { serverError } from "@/lib/server-log"

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido." }, { status: 400 })
    }

    // Respuesta genérica siempre — no revelar si el email existe
    const user = await getUserByEmail(email)
    if (user) {
      const token = createResetToken(email)
      sendResetPasswordEmail({
        name: user.name ?? email.split("@")[0],
        email,
        token,
      }).catch((err) => serverError("[forgot-password] Email failed", err))
    }

    return NextResponse.json({
      ok: true,
      message: "Si ese correo está registrado, recibirás un enlace en unos minutos.",
    })
  } catch (err) {
    serverError("[forgot-password]", err)
    return NextResponse.json({ error: "Error interno. Intenta de nuevo." }, { status: 500 })
  }
}
