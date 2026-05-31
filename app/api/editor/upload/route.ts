import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join, extname } from "path"
import { randomBytes } from "crypto"
import { getAuthSession } from "@/lib/auth-session"
import { serverError } from "@/lib/server-log"

export const runtime = "nodejs"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"]

export async function POST(request: Request) {
  // Auth requerida
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

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

  // Validar tipo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({
      error: `Tipo de archivo no permitido. Usa: JPG, PNG, WebP, GIF o SVG.`,
    }, { status: 400 })
  }

  // Validar tamaño
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({
      error: `El archivo es demasiado grande (máx 5 MB). Tu archivo: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
    }, { status: 400 })
  }

  // Generar nombre único
  const ext = extname(file.name).toLowerCase() || `.${file.type.split("/")[1]}`
  const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`

  try {
    // Crear directorio si no existe
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Guardar archivo
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(UPLOAD_DIR, safeName), buffer)

    return NextResponse.json({
      ok: true,
      url: `/uploads/${safeName}`,
      name: safeName,
      size: file.size,
      type: file.type,
    })
  } catch (err) {
    serverError("[upload] Error guardando archivo", err)
    return NextResponse.json({ error: "Error al guardar el archivo. Intenta de nuevo." }, { status: 500 })
  }
}
