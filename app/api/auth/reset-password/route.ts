import { NextResponse } from "next/server"
import { pbkdf2Sync, randomBytes } from "crypto"
import { editorPrisma } from "@/lib/editor-db"
import { validateResetToken, consumeResetToken } from "@/lib/reset-tokens"
import { serverError } from "@/lib/server-log"

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

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

    const result = validateResetToken(token)
    if (!result.valid) {
      return NextResponse.json({ error: "El enlace no es válido o ya expiró." }, { status: 400 })
    }

    const consumed = consumeResetToken(token)
    if (!consumed) {
      return NextResponse.json({ error: "El enlace no es válido o ya fue utilizado." }, { status: 400 })
    }

    await editorPrisma.user.update({
      where: { email: result.email },
      data: { password: hashPassword(password) },
    })

    return NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente." })
  } catch (err) {
    serverError("[reset-password]", err)
    return NextResponse.json({ error: "Error interno. Intenta de nuevo." }, { status: 500 })
  }
}

// Validar token antes de mostrar el formulario
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token") ?? ""
  const result = validateResetToken(token)
  return NextResponse.json({ valid: result.valid })
}
