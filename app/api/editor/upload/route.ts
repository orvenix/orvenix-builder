import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomBytes } from "crypto"
import { getAuthSession } from "@/lib/auth-session"
import { serverError } from "@/lib/server-log"
import {
  MAX_SIZE_BYTES,
  validateImageUploadV1,
} from "@/lib/upload-policy"
import {
  RATE_LIMIT_POLICIES_V1,
  checkRateLimitV1,
  rateLimitIdentityV1,
  rateLimitedResponseV1,
} from "@/lib/security/rate-limit"

export const runtime = "nodejs"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

export async function POST(request: Request) {
  // Auth requerida
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const limited = await checkRateLimitV1(RATE_LIMIT_POLICIES_V1.upload, rateLimitIdentityV1(request, session.user.id))
  if (limited.ok === false) return rateLimitedResponseV1(limited)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Formato de solicitud inválido." }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 })
  }

  // Validar tamaño antes de leer el contenido
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({
      error: `El archivo es demasiado grande (máx 5 MB). Tu archivo: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
    }, { status: 400 })
  }

  // SEC-1 (SEC0-04): el tipo lo deciden los bytes (firma), no el nombre ni el MIME declarado.
  const buffer = Buffer.from(await file.arrayBuffer())
  const validation = validateImageUploadV1({ declaredType: file.type, size: file.size, bytes: buffer })
  if (validation.ok === false) {
    return NextResponse.json({
      error: validation.reason === "TOO_LARGE"
        ? "El archivo es demasiado grande (máx 5 MB)."
        : "Tipo de archivo no permitido. Usa: JPG, PNG, WebP, GIF o AVIF.",
    }, { status: 400 })
  }

  // Nombre aleatorio + extensión elegida por el servidor a partir del tipo verificado.
  const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${validation.type.extension}`

  try {
    // Crear directorio si no existe
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Guardar archivo
    await writeFile(join(UPLOAD_DIR, safeName), buffer)

    return NextResponse.json({
      ok: true,
      url: `/uploads/${safeName}`,
      name: safeName,
      size: buffer.length,
      type: validation.type.mime,
    })
  } catch (err) {
    serverError("[upload] Error guardando archivo", err)
    return NextResponse.json({ error: "Error al guardar el archivo. Intenta de nuevo." }, { status: 500 })
  }
}
