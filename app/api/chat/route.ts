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
- Hablar sobre herramientas internas de administracion, tickets DIFM o cualquier funcionalidad privada de operacion. El programa publico de afiliados solo puede explicarse si aparece en la base de conocimiento
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
    answer: `Los precios oficiales 2026 de Orvenix son:

**Suscripcion mensual, USD + IVA:**
- Starter: 15 USD/mes + IVA
- Pro: 39 USD/mes + IVA
- Business: 79 USD/mes + IVA
- Enterprise: cotizacion segun alcance

**Suscripcion anual, USD + IVA:**
- Starter: 150 USD/ano + IVA
- Pro: 390 USD/ano + IVA
- Business: 790 USD/ano + IVA

Los add-ons y desarrollos a medida se cotizan segun alcance. ¿Quieres que te recomiende un plan segun tu negocio?`,
  },
  {
    keywords: ["tiempo", "entrega", "cuanto tard", "cuando", "urgente", "plazo"],
    answer: `La activacion y el lanzamiento dependen del plan, pago, contenido y alcance.

- La plataforma puede avanzar rapido cuando el pago y la configuracion estan listos.
- El Super Builder permite partir de templates o de un lienzo guiado para acelerar la construccion.
- Proyectos Enterprise, integraciones o compra definitiva requieren revision comercial.

Si tienes una fecha limite, lo mejor es compartir el alcance en /contacto/ para confirmar viabilidad.`,
  },
  {
    keywords: ["template", "plantilla", "industria", "demo", "ejemplo", "sector"],
    answer: `Orvenix tiene templates y demos por industria para acelerar el lanzamiento:

Tienda online, restaurante, clinica, inmobiliaria, gimnasio, barberia, hotel, abogados, academia, agencia, transporte, contabilidad, viajes, notaria, recursos humanos, arquitectura, seguros, finanzas, fotografia, servicios locales y mas.

Todos son editables desde el Super Builder. ¿Que tipo de negocio quieres crear?`,
  },
  {
    keywords: ["editor", "editar", "personaliz", "cambiar", "modificar", "como funciona"],
    answer: `El Super Builder de Orvenix es visual y no requiere programacion:

- Editas textos, imagenes, colores, enlaces y secciones
- Puedes partir de templates reales por industria
- El lienzo blanco guiado muestra sugerencias editables para no empezar desde cero
- Ves el sitio en desktop, tablet y movil
- Publicas desde la plataforma

¿Quieres que te recomiende una ruta: template por industria o lienzo guiado?`,
  },
  {
    keywords: ["incluye", "que tiene", "que ofrece", "servicio", "hacen"],
    answer: `Orvenix ofrece dos modelos:

**Plataforma SaaS**: sitio web, panel privado, Super Builder, templates, hosting administrado, SSL, soporte y publicacion. Desde 15 USD/mes + IVA.

**Compra definitiva o desarrollo a medida**: se cotiza por proyecto cuando necesitas arquitectura dedicada, integraciones, funciones personalizadas o derechos patrimoniales sobre codigo entregado.

¿Buscas lanzar rapido con plan SaaS o necesitas algo a medida?`,
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
