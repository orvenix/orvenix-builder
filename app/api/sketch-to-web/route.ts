import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { generateSectionAI } from "@/app/actions/ai"
import { runAIGenerationJob } from "@/lib/ai/jobs"

export const runtime = "nodejs"

const MAX_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
] as const

type SupportedImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif"

type Fidelity = "strict" | "balanced" | "system"

function normalizeFidelity(value: FormDataEntryValue | null): Fidelity {
  if (value === "strict" || value === "balanced" || value === "system") return value
  return "balanced"
}

function fallbackPromptFromSketch(fileName: string, fidelity: Fidelity) {
  const subject = fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const fidelityHint =
    fidelity === "strict"
      ? "Mantén la composición lo más parecida posible al boceto."
      : fidelity === "system"
        ? "Respeta la intención visual, pero adáptala a un diseño limpio y consistente."
        : "Interpreta el boceto con equilibrio entre fidelidad visual y claridad comercial."

  return [
    "Genera una sección web basada en este boceto o referencia visual.",
    subject ? `Tema detectado: ${subject}.` : "",
    fidelityHint,
    "Incluye un encabezado principal, texto de apoyo y una llamada a la acción clara.",
  ].filter(Boolean).join(" ")
}

async function describeSketchWithClaude(file: File, fidelity: Fidelity, designSystem: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  if (file.type === "application/pdf") return null
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) return null

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const mediaType = file.type as SupportedImageMediaType

  const fidelityHint =
    fidelity === "strict"
      ? "Prioriza fidelidad máxima a la composición y jerarquía del boceto."
      : fidelity === "system"
        ? "Prioriza consistencia con un design system profesional, aunque simplifiques el boceto."
        : "Equilibra fidelidad visual con claridad de conversión y legibilidad."

  const designHint = designSystem.trim()
    ? `Design system o estilo deseado: ${designSystem.trim()}.`
    : "Si no hay estilo explícito, usa una dirección visual moderna, clara y comercial."

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: [
                "Analiza este boceto o referencia visual y conviértelo en un prompt breve para generar una sección web en Orvenix Builder.",
                fidelityHint,
                designHint,
                "Responde solo un párrafo corto en español describiendo estructura, tono visual, contenido esperado y CTA sugerido.",
              ].join(" "),
            },
          ],
        },
      ],
    })

    const text = message.content
      .filter((block): block is Extract<(typeof message.content)[number], { type: "text" }> => block.type === "text")
      .map((block) => block.text.trim())
      .join("\n")
      .trim()

    return text || null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 })
  }

  const file = formData.get("file")
  const fidelity = normalizeFidelity(formData.get("fidelity"))
  const designSystem = String(formData.get("designSystem") ?? "")
  const siteId = String(formData.get("siteId") ?? "").trim() || null
  const pageSlug = String(formData.get("pageSlug") ?? "").trim() || null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Se requiere una imagen." }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json({ error: "Tipo de archivo no soportado para sketch-to-web." }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "La imagen excede el tamaño máximo permitido." }, { status: 400 })
  }

  const payload = await runAIGenerationJob(
    {
      siteId,
      pageSlug,
      type: "sketch_to_web",
      input: {
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        fidelity,
        designSystem: designSystem.trim() || null,
        source: "api_sketch_to_web",
      },
    },
    async () => {
      const suggestedPrompt =
        (await describeSketchWithClaude(file, fidelity, designSystem)) ??
        fallbackPromptFromSketch(file.name, fidelity)

      const generated = await generateSectionAI(suggestedPrompt, [], [], {
        siteId,
        pageSlug,
        source: "sketch_to_web",
        skipJobLogging: true,
      })

      return {
        ok: true,
        fileName: file.name,
        fidelity,
        designSystem: designSystem.trim() || null,
        prompt: suggestedPrompt,
        analysisSource: process.env.ANTHROPIC_API_KEY ? "anthropic-or-fallback" : "fallback",
        preview: generated.success
          ? {
              title: generated.title,
              message: generated.message,
              tree: generated.tree,
              usedAI: generated.usedAI,
            }
          : null,
        warning: generated.success ? null : generated.message,
      }
    }
  )

  return NextResponse.json(payload)
}
