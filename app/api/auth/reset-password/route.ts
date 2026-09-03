import { NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth"
import { validateResetToken, consumeResetTokenAndUpdatePassword } from "@/lib/reset-tokens"
import { serverError } from "@/lib/server-log"

const INVALID_TOKEN_MESSAGE = "El enlace no es válido o ya expiró."

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string; password?: string }
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contraseña son requeridos." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 })
    }

    const result = await consumeResetTokenAndUpdatePassword(token, hashPassword(password))
    if (!result.ok) {
      return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente." })
  } catch (err) {
    serverError("[reset-password]", err)
    return NextResponse.json({ error: "Error interno. Intenta de nuevo." }, { status: 500 })
  }
}

// Validar token antes de mostrar el formulario.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token") ?? ""
  const result = await validateResetToken(token)
  return NextResponse.json({ valid: result.valid })
}
