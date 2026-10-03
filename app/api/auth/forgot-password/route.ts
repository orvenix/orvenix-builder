import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/auth"
import { createResetTokenForUser } from "@/lib/reset-tokens"
import { sendResetPasswordEmail } from "@/lib/email"
import { serverError } from "@/lib/server-log"
import { RATE_LIMIT_POLICIES_V1, checkRateLimitV1, rateLimitIdentityV1, rateLimitedResponseV1 } from "@/lib/security/rate-limit"

export async function POST(request: Request) {
  const limited = await checkRateLimitV1(RATE_LIMIT_POLICIES_V1.forgotPassword, rateLimitIdentityV1(request))
  if (limited.ok === false) return rateLimitedResponseV1(limited)

  try {
    const body = await request.json() as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "El correo es requerido." }, { status: 400 })
    }

    // Per-address bound: no mail-bombing a victim through password resets.
    const perEmail = await checkRateLimitV1(RATE_LIMIT_POLICIES_V1.forgotPasswordEmail, email)
    if (perEmail.ok === false) return rateLimitedResponseV1(perEmail)

    // Respuesta generica siempre: no revelar si el email existe.
    const user = await getUserByEmail(email)
    if (user) {
      try {
        const token = await createResetTokenForUser(user.id)
        sendResetPasswordEmail({
          name: user.name ?? email.split("@")[0],
          email,
          token,
        }).catch((err) => serverError("[forgot-password] Email failed", err))
      } catch (err) {
        serverError("[forgot-password] Token creation failed", err)
      }
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
