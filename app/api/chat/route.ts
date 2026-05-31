import { getChatKnowledgeContext } from "@/lib/chat-knowledge"

export const runtime = "nodejs"

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres Orvenix AI, el asistente virtual de Orvenix — una plataforma SaaS y agencia boutique de desarrollo web premium en México.

## Tu rol
Ayudas a prospectos y clientes con dudas sobre servicios, precios, templates, proceso de trabajo y la Plataforma Orvenix. Tu tono es profesional, cercano y consultivo. Respondes siempre en español.

## Fuente de información
Usa EXCLUSIVAMENTE la base de conocimiento incluida al final de este prompt. Si algo no está ahí, dilo con honestidad y sugiere contacto directo. NUNCA inventes datos, precios, funcionalidades ni características que no aparezcan en la base de conocimiento.

## Límites estrictos — NUNCA debes:
- Revelar datos técnicos internos: código fuente, arquitectura, base de datos, variables de entorno, configuración del servidor
- Mencionar nombres de usuarios, clientes, correos o datos personales
- Discutir herramientas internas de administración o gestión de tickets
- Revelar que el sistema usa Next.js, Prisma, Tailwind, Anthropic, Resend, MercadoPago u otras tecnologías específicas
- Hablar sobre el panel de administración, tickets DIFM, sistema de afiliados o cualquier funcionalidad interna de operación
- Inventar precios diferentes a los que aparecen en tu base de conocimiento
- Dar información sobre cómo está construida la plataforma por dentro

## Cuándo no saber es válido
Si alguien pregunta algo que no está en tu base de conocimiento, responde: "Esa información la puede confirmar directamente el equipo de Orvenix en /contacto/. Puedo ayudarte con precios, templates, plataforma o proceso de trabajo."

## Estructura de respuestas
- Respuestas concisas, máximo 3-4 párrafos
- Usa listas cuando enumeres precios o características
- Termina siempre con una pregunta de seguimiento o CTA a /contacto/ si es relevante

---

BASE DE CONOCIMIENTO ORVENIX:
`

// ─── Respuesta de fallback (sin API key) ─────────────────────────────────────

const FALLBACK_RESPONSES: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ["precio", "costo", "cotiz", "cuanto", "vale", "cobran"],
    answer: `Los precios base de Orvenix son:

**Plataforma (suscripción mensual):**
- Básico: $349 MXN/mes
- Pro: $699 MXN/mes
- Empresa: $1,399 MXN/mes

**Desarrollo a medida:**
- Landing page: desde $7,000 MXN
- Sitio corporativo: desde $15,000 MXN
- E-commerce: desde $25,000 MXN
- App móvil: desde $45,000 MXN

¿Tienes un proyecto en mente? Te puedo orientar sobre la opción más adecuada.`,
  },
  {
    keywords: ["tiempo", "entrega", "cuanto tard", "cuando", "urgente", "plazo"],
    answer: `Tiempos estimados de Orvenix:

- **Plataforma**: activa el mismo día del registro
- **Landing page**: 1 a 2 semanas
- **Sitio corporativo**: 3 a 6 semanas
- **E-commerce**: 6 a 10 semanas
- **App móvil**: 10 a 16 semanas

Si tienes una fecha límite, cuéntame y te orientamos sobre cómo priorizamos el proyecto.`,
  },
  {
    keywords: ["template", "plantilla", "industria", "demo", "ejemplo", "sector"],
    answer: `Orvenix tiene templates profesionales para más de 15 industrias:

Restaurante, clínica, inmobiliaria, gimnasio, abogados, tienda online, hotel, academia, barbería, servicios locales, agencia digital, transporte ejecutivo y más.

Todos incluyen secciones de hero, servicios, testimonios, galería y contacto — editables sin código. ¿Qué tipo de negocio tienes?`,
  },
  {
    keywords: ["editor", "editar", "personaliz", "cambiar", "modificar", "como funciona"],
    answer: `El editor de Orvenix es visual y no requiere programación:

- Editas textos con clic directo
- Cambias imágenes, colores y secciones
- Agregas o reordenas bloques con drag & drop
- Ves el resultado en móvil, tablet y desktop en tiempo real
- Publicas con un botón

¿Quieres ver un demo del editor en acción?`,
  },
  {
    keywords: ["incluye", "que tiene", "que ofrece", "servicio", "hacen"],
    answer: `Orvenix ofrece dos modelos:

**Plataforma** (suscripción): sitio web + panel privado + editor visual + templates + hosting. Desde $349 MXN/mes.

**Desarrollo a medida**: landing pages, sitios corporativos, e-commerce, apps móviles y sistemas personalizados.

¿Buscas algo específico para tu negocio?`,
  },
]

function buildFallback(query: string): string {
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  const match = FALLBACK_RESPONSES.find(r => r.keywords.some(k => q.includes(k)))
  return match?.answer ?? `Puedo ayudarte con información sobre precios, templates, el editor de Orvenix y el proceso de trabajo.

¿Sobre qué necesitas más detalle? O si prefieres hablar con el equipo directamente, visita **/contacto/**.`
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function toSseResponse(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } })}\n\n`)
      )
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "message_stop" })}\n\n`))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { messages?: unknown[] } | null
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-10) : []
  const apiKey = process.env.ANTHROPIC_API_KEY

  // Sin API key: responder con fallback local
  if (!apiKey) {
    const lastUser = [...messages].reverse().find(
      (m): m is { role: string; content: string } =>
        typeof m === "object" && m !== null && "role" in m && (m as { role: string }).role === "user"
    )
    const query = typeof lastUser?.content === "string" ? lastUser.content : ""
    return toSseResponse(buildFallback(query))
  }

  const knowledgeContext = getChatKnowledgeContext()
  const system = `${SYSTEM_PROMPT}${knowledgeContext}`
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        stream: true,
        system,
        messages,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const lastUser = [...messages].reverse().find(
        (m): m is { role: string; content: string } =>
          typeof m === "object" && m !== null && "role" in m && (m as { role: string }).role === "user"
      )
      const query = typeof lastUser?.content === "string" ? lastUser.content : ""
      return toSseResponse(buildFallback(query))
    }

    return new Response(upstream.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    })
  } catch {
    const lastUser = [...messages].reverse().find(
      (m): m is { role: string; content: string } =>
        typeof m === "object" && m !== null && "role" in m && (m as { role: string }).role === "user"
    )
    const query = typeof lastUser?.content === "string" ? lastUser.content : ""
    return toSseResponse(buildFallback(query))
  }
}
