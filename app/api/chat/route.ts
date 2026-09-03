import { getChatKnowledgeContext } from "@/lib/chat-knowledge"
import { buildSiteGenerationGuideContext } from "@/lib/orvenix-ai/guidelines/site-generation-guidelines"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `Eres Orvenix AI, el asistente virtual de Orvenix — una plataforma SaaS y agencia boutique de desarrollo web premium en México.

## Tu rol
Ayudas a prospectos y clientes con dudas sobre servicios, precios, templates, proceso de trabajo y la Plataforma Orvenix. Tu tono es profesional, cercano y consultivo. Respondes siempre en español.

## Fuente de información
Usa EXCLUSIVAMENTE la base de conocimiento incluida al final de este prompt. Si algo no está ahí, dilo con honestidad y sugiere contacto directo. NUNCA inventes datos, precios, funcionalidades ni características que no aparezcan en la base de conocimiento.

## Límites estrictos — NUNCA debes:
- Escribir bloques de codigo, snippets, HTML, CSS, JavaScript, JSON tecnico ni instrucciones para programar. Orvenix AI asesora y recomienda dentro de la plataforma; no entrega codigo al usuario final.
- Usar triple backticks, etiquetas HTML, objetos JSON ni formato de archivo en tus respuestas.
- Revelar datos técnicos internos: código fuente, arquitectura, base de datos, variables de entorno, configuración del servidor.
- Mencionar nombres de usuarios, clientes, correos o datos personales.
- Discutir herramientas internas de administración o gestión de tickets.
- Revelar tecnologias, proveedores o herramientas internas especificas.
- Inventar precios diferentes a los que aparecen en tu base de conocimiento.

## Cuándo no saber es válido
Si alguien pregunta algo que no está en tu base de conocimiento, responde: "Esa información la puede confirmar directamente el equipo de Orvenix en /contacto/. Puedo ayudarte con precios, templates, plataforma o proceso de trabajo."

## Estructura de respuestas
- Respuestas concisas, máximo 3-4 párrafos.
- No repitas la misma estructura para todas las preguntas; adapta la respuesta a la industria, objetivo e intencion del usuario.
- Si el usuario pregunta por una industria concreta, responde con recomendaciones concretas de esa industria.
- Usa listas cortas cuando enumeres precios, secciones o características.
- Termina siempre con una pregunta de seguimiento o CTA a /contacto/ si es relevante.

---

GUIA DE CRITERIO PARA SITIOS Y CONVERSION:
${buildSiteGenerationGuideContext({ mode: "chat" })}

BASE DE CONOCIMIENTO ORVENIX:
`

type FallbackRule = {
  id: string
  keywords: string[]
  answer: string
}

const FALLBACK_RESPONSES: FallbackRule[] = [
  {
    "id": "noCode",
    "keywords": [
      "codigo",
      "html",
      "css",
      "javascript",
      "snippet",
      "programar",
      "script"
    ],
    "answer": "No entrego codigo ni snippets desde el chat. Orvenix AI esta pensado para ayudarte a crear y mejorar sitios dentro del constructor visual, sin que el cliente tenga que programar.\n\nPara una landing, puedo ayudarte mejor con la estructura editable: hero con promesa clara, beneficios, prueba social, oferta, FAQ y CTA final. Tambien puedo sugerir textos, secciones, estilo visual y botones de conversion.\n\n¿Quieres que la landing sea para vender un producto, agendar citas, captar leads o presentar un servicio?"
  },
  {
    "id": "pricing",
    "keywords": [
      "precio",
      "precios",
      "costo",
      "cotiz",
      "cuanto",
      "vale",
      "cobran",
      "plan",
      "planes",
      "suscripcion"
    ],
    "answer": "Los planes oficiales de Orvenix son claros para que el cliente decida rapido:\n\n- **Starter**: 15 USD/mes + IVA, para una primera web profesional.\n- **Pro**: 39 USD/mes + IVA, recomendado si quiere vender, usar IA, CRM, blog, SEO o varios sitios.\n- **Business**: 79 USD/mes + IVA, para funnels, automatizaciones y eCommerce mas avanzado.\n- **Enterprise**: cotizacion segun alcance.\n\nSi el usuario quiere crecer o vender, normalmente conviene llevarlo a **Pro**. ¿Quieres que compare Starter vs Pro para tu caso?"
  },
  {
    "id": "clinic",
    "keywords": [
      "clinica",
      "salud",
      "medico",
      "doctor",
      "consultorio",
      "dentista",
      "psicologo",
      "terapia",
      "citas medicas"
    ],
    "answer": "Para una clinica premium, recomiendo un sitio orientado a confianza y citas. No debe verse saturado; debe transmitir seriedad desde el primer pantallazo.\n\nEstructura ideal: hero con especialidad y CTA a cita, especialidades, doctores/equipo, proceso de atencion, ubicacion, testimonios, FAQ y contacto rapido por WhatsApp o formulario.\n\nEl tono visual debe ser limpio, claro y profesional: fotos reales del espacio/equipo, mucho aire, azul o tonos medicos suaves, CTAs visibles y mensajes como “Agenda tu valoracion” o “Consulta disponibilidad”. ¿La clinica es general o de una especialidad?"
  },
  {
    "id": "restaurant",
    "keywords": [
      "restaurante",
      "comida",
      "menu",
      "chef",
      "reservar",
      "mesa",
      "cafeteria",
      "bar",
      "cocina"
    ],
    "answer": "Para restaurante, el sitio debe vender experiencia antes que solo informacion. El usuario quiere ver ambiente, menu, ubicacion y una forma rapida de reservar.\n\nEstructura recomendada: hero con plato/ambiente, boton de reserva, menu destacado, galeria, historia breve, horarios, ubicacion, reseñas y CTA a WhatsApp o reservas.\n\nLo premium aqui se logra con fotografia fuerte, tipografia elegante, microanimaciones sutiles y botones claros: “Reservar mesa”, “Ver menu” o “Pedir por WhatsApp”. ¿Es restaurante casual, elegante o comida rapida?"
  },
  {
    "id": "ecommerce",
    "keywords": [
      "tienda",
      "ecommerce",
      "e-commerce",
      "catalogo",
      "producto",
      "productos",
      "carrito",
      "checkout",
      "vender online",
      "moda",
      "ropa"
    ],
    "answer": "Para una tienda online, la prioridad es que el cliente vea producto, precio y confianza de compra sin tener que pensar demasiado.\n\nEstructura ideal: hero con oferta principal, categorias, productos destacados, beneficios de compra, envios/pagos, testimonios, politicas claras y CTA a comprar.\n\nEl diseno debe usar fotos limpias, cards de producto faciles de escanear, botones de compra vivos y mensajes de seguridad como “Pago seguro”, “Envio disponible” o “Cambios sencillos”. ¿La tienda vendera pocos productos premium o catalogo amplio?"
  },
  {
    "id": "realestate",
    "keywords": [
      "inmobiliaria",
      "propiedad",
      "propiedades",
      "casa",
      "casas",
      "departamento",
      "renta",
      "venta",
      "bienes raices"
    ],
    "answer": "Para inmobiliaria, el sitio debe ayudar a filtrar rapido y generar leads de calidad. La confianza del agente o marca pesa mucho.\n\nEstructura recomendada: hero con busqueda o propiedad destacada, filtros por zona/tipo/precio, propiedades destacadas, agentes, proceso de compra/renta, testimonios y CTA para agendar visita.\n\nEl estilo premium funciona con fotos grandes, fichas claras, mapas o zonas, botones de “Agendar visita” y formularios breves. ¿Quieres enfocarlo a venta, renta o captacion de propiedades?"
  },
  {
    "id": "professionalServices",
    "keywords": [
      "abogado",
      "abogados",
      "legal",
      "contador",
      "contabilidad",
      "consultor",
      "consultoria",
      "arquitecto",
      "arquitectura",
      "agencia",
      "servicios profesionales"
    ],
    "answer": "Para servicios profesionales, el sitio debe convertir autoridad en confianza. No basta listar servicios: hay que mostrar experiencia, metodo y siguiente paso.\n\nEstructura ideal: hero con especialidad, servicios por problema del cliente, proceso de trabajo, credenciales, casos o ejemplos, testimonios, FAQ y CTA a consulta/cotizacion.\n\nEl tono debe ser claro, elegante y consultivo. Un buen CTA seria “Agenda una consulta”, “Solicitar diagnostico” o “Cotizar proyecto”. ¿Que servicio profesional quieres posicionar?"
  },
  {
    "id": "portfolio",
    "keywords": [
      "portafolio",
      "fotografia",
      "fotografo",
      "diseno",
      "estudio",
      "proyectos",
      "galeria",
      "creativo"
    ],
    "answer": "Para un portafolio premium, el trabajo visual debe llevar el protagonismo. El sitio no debe explicar demasiado; debe hacer que el visitante quiera ver mas y contactar.\n\nEstructura recomendada: hero visual, galeria curada, proyectos destacados, proceso creativo, servicios, reconocimientos o prensa y contacto elegante.\n\nLo importante es seleccionar pocas piezas fuertes, usar transiciones suaves, buena jerarquia y CTA discreto pero visible: “Ver proyectos” o “Cotizar una sesion”. ¿Es portafolio personal o estudio/marca?"
  },
  {
    "id": "landing",
    "keywords": [
      "landing",
      "campana",
      "lanzamiento",
      "captar leads",
      "leads",
      "conversion",
      "vender",
      "oferta"
    ],
    "answer": "Para una landing de venta, recomiendo una pagina enfocada en una sola accion. Si intenta hacer demasiado, baja la conversion.\n\nEstructura ideal: hero con promesa clara, problema/solucion, beneficios, prueba social, oferta o plan recomendado, FAQ y CTA final.\n\nDebe tener botones visibles arriba y abajo, mensajes concretos y objeciones resueltas: precio, tiempo, soporte, garantia o forma de contacto. ¿La accion principal sera comprar, agendar, cotizar o registrarse?"
  },
  {
    "id": "design",
    "keywords": [
      "premium",
      "lujo",
      "bonito",
      "moderno",
      "diseno",
      "visual",
      "animacion",
      "colores",
      "elegante"
    ],
    "answer": "Para que un sitio se sienta premium, no conviene llenarlo de efectos; conviene cuidar jerarquia, espacios, contraste, fotos y microinteracciones.\n\nRecomendaria: hero limpio con CTA visible, imagenes reales o mockups de calidad, secciones con ritmo distinto, prueba social temprana, botones con hover suave y una paleta con acentos vivos pero controlados.\n\nEn Orvenix, el cliente deberia cambiar textos, imagenes y datos basicos sin tocar el diseno completo. ¿Quieres un estilo mas corporativo, elegante, comercial o creativo?"
  },
  {
    "id": "templates",
    "keywords": [
      "template",
      "templates",
      "plantilla",
      "plantillas",
      "demo",
      "ejemplo",
      "sector",
      "industria"
    ],
    "answer": "Orvenix puede partir de templates por industria para no empezar desde cero. La idea es que el cliente tenga una base profesional y solo cambie lo esencial.\n\nHay rutas para restaurante, tienda online, clinica, inmobiliaria, gimnasio, barberia, hotel, abogados, contabilidad, viajes, arquitectura, servicios locales y mas.\n\nSi me dices la industria y el objetivo, puedo sugerir una estructura concreta y el CTA principal. Tambien puedo crear una copia editable desde templates cuando el usuario tenga sesion activa y cupo disponible."
  },
  {
    "id": "editor",
    "keywords": [
      "editor",
      "editar",
      "personaliz",
      "cambiar",
      "modificar",
      "constructor",
      "super builder",
      "builder"
    ],
    "answer": "El Super Builder esta pensado para que el cliente edite lo importante sin sentirse abrumado.\n\nPuede cambiar textos, imagenes, colores, enlaces y secciones; partir de templates por industria; usar una experiencia mas simple en modo basico y opciones mas avanzadas en Pro.\n\nLa mejor ruta para usuarios nuevos es elegir un template cercano a su negocio, ajustar contenido basico y publicar. ¿Quieres editar una landing simple o un sitio completo con varias paginas?"
  },
  {
    "id": "timing",
    "keywords": [
      "tiempo",
      "entrega",
      "cuanto tarda",
      "cuando",
      "urgente",
      "plazo",
      "lanzar"
    ],
    "answer": "El tiempo de lanzamiento depende de contenido, pago, plantilla y nivel de ajustes.\n\nLa forma mas rapida es elegir un template por industria, cambiar textos e imagenes principales y publicar desde el editor. Si hay integraciones, migraciones o diseno a medida, conviene revisarlo en /contacto/.\n\n¿Ya tienes textos e imagenes, o necesitas que Orvenix te ayude a estructurarlos?"
  }
]

function normalizeQuery(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function scoreRule(query: string, rule: FallbackRule) {
  return rule.keywords.reduce((score, keyword) => {
    return query.includes(normalizeQuery(keyword)) ? score + Math.max(1, keyword.length / 4) : score
  }, 0)
}

function sanitizeAssistantText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim()
}

function buildFallback(query: string): string {
  const q = normalizeQuery(query)
  const ranked = FALLBACK_RESPONSES
    .map((rule) => ({ rule, score: scoreRule(q, rule) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const answer = ranked[0]?.rule.answer ?? `Puedo ayudarte con precios, templates, editor, tipos de paginas web y estructura por industria.

Para darte una recomendacion util, dime dos cosas: que tipo de negocio tienes y que quieres lograr primero: vender, agendar citas, captar leads, mostrar portafolio o publicar informacion institucional.`

  return sanitizeAssistantText(answer)
}

function sanitizeSseChunk(chunk: string) {
  return chunk
    .replace(/```/g, "")
    .replace(/<\/?(script|style|html|body|head|div|section|main|button|a|span|p|h1|h2|h3)[^>]*>/gi, "")
}

function lastUserMessage(messages: unknown[]) {
  const lastUser = [...messages].reverse().find(
    (message): message is { role: string; content: string } =>
      typeof message === "object" &&
      message !== null &&
      "role" in message &&
      (message as { role: string }).role === "user" &&
      typeof (message as { content?: unknown }).content === "string"
  )

  return lastUser?.content ?? ""
}

function toSseResponse(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: sanitizeAssistantText(text) } })}\n\n`)
      )
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "message_stop" })}\n\n`))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { messages?: unknown[] } | null
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-10) : []
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return toSseResponse(buildFallback(lastUserMessage(messages)))
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
      return toSseResponse(buildFallback(lastUserMessage(messages)))
    }

    const sanitizedStream = upstream.body.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        const decoded = new TextDecoder().decode(chunk)
        controller.enqueue(new TextEncoder().encode(sanitizeSseChunk(decoded)))
      },
    }))

    return new Response(sanitizedStream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    })
  } catch {
    return toSseResponse(buildFallback(lastUserMessage(messages)))
  }
}