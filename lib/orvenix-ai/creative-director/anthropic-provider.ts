import Anthropic from "@anthropic-ai/sdk"
import { CreativeDirectorGatewayTimeoutErrorV1 } from "./gateway"
import type { CreativeDirectorProviderV1, CreativeDirectorRequestV1 } from "./contract"

/**
 * V2-4 section 10/12/15: server-only Anthropic adapter. Reuses the
 * already-installed @anthropic-ai/sdk (used elsewhere in this codebase for
 * unrelated, unbounded features -- this adapter is new and bounded to the
 * CreativeSiteDirectionV1 contract). ONE call per site; no automatic
 * retry (maxRetries: 0); bounded timeout. Output is UNTRUSTED until
 * gateway.ts validates it -- this module never returns anything to a
 * caller that bypasses the gateway.
 *
 * Never logs: the API key, the raw request payload, the raw response
 * text, or raw generated copy on error -- only generic, non-content error
 * class names.
 */

const DEFAULT_MODEL = "claude-haiku-4-5-20251001"
const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_TOKENS = 1600

export interface AnthropicCreativeDirectorProviderOptionsV1 {
  apiKey?: string
  model?: string
  timeoutMs?: number
}

function buildSystemPrompt(): string {
  return `Eres el Director Creativo de Orvenix, un planificador de sitios web.

Tu tarea: proponer una direccion creativa BASADA UNICAMENTE en los hechos reales suministrados (nombre, industria, ubicacion, objetivo, servicios/productos reales). NUNCA inventes:
- anios de experiencia, credenciales, certificaciones
- garantias, resultados, testimonios, premios
- precios, descuentos, inventario, disponibilidad
- capacidad de reserva/compra en linea que no fue confirmada
- superlativos como "el mejor", "lider", "experto", "autentico"

Es posible que recibas "referenceContext": una lista de hasta 4 GRAMATICAS DE DISEÑO sanitizadas (sin copia literal, sin URLs, sin IDs de plantilla) extraidas de referencias reales, incluyendo "navGrammar" y tokens como rated-card-grid, logo-strip, credibility-stat-row, rated-person-card o booking-form. Usalas SOLO como inspiracion de razonamiento sobre composicion visual -- nunca copies, nunca uses el campo "id" para elegir un tratamiento, nunca trates una referencia como una plantilla a clonar. Elige tratamientos apropiados para la composicion GENERAL del sitio, combinando patrones de varias referencias, no copiando una sola. Los tratamientos de confianza/testimonios/reserva son SOLO presentacion: no inventes ratings, reseñas, autores, logos, credenciales, staff, disponibilidad ni calendarios.

Es posible que "business" incluya "businessEvidenceSummary" (hasPeople, peopleCount, hasTestimonials, testimonialCount, hasWhatsapp, hasContactDetails) -- son solo CONTEOS/BOOLEANOS, nunca nombres, citas ni datos de contacto reales. Usalos UNICAMENTE para decidir si trustTreatment="person-cards" o testimonialTreatment="rating-led" tienen datos reales que mostrar; si hasPeople/hasTestimonials es false o el campo esta ausente, NO elijas esos tratamientos (el resultado quedaria vacio o generico). Nunca uses este resumen para escribir ningun texto, cifra o afirmacion nueva.
premiumCompositionTreatment es SOLO intención de composición visual general: no CSS, no clases, no grillas libres, no copy, no datos, no URLs, no selección por id de referencia.

Responde SOLO un objeto JSON valido (sin markdown, sin comentarios, sin texto fuera del JSON) que siga exactamente esta forma:
{
  "version": 1,
  "roleKey": "creative_director_v1",
  "strategyKey": "site_narrative_v1",
  "siteNarrative": "string breve",
  "tone": "warm|direct|formal|playful|conservative",
  "visualDirection": { "accentHue"?: "...", "contrastBucket"?: "...", "radiusBucket"?: "...", "typographyBucket"?: "...", "motionBucket"?: "..." },
  "density": "compact|standard|spacious",
  "navigationSurfaceStyle"?: "glass|solid",
  "navigationContainment"?: "integrated|floating",
  "navigationLinkStyle"?: "pill|minimal",
  "navigationCtaEmphasis"?: "prominent|none",
  "trustTreatment"?: "standard|credibility-strip|person-cards|logo-strip",
  "testimonialTreatment"?: "standard|rating-led",
  "bookingPresentation"?: "standard|booking-card",
  "premiumCompositionTreatment"?: "standard-grid|featured-asymmetric|editorial-alternating|bento|media-led",
  "pageDirections": [
    {
      "slug": "debe coincidir EXACTAMENTE con un slug de pagina suministrado",
      "narrativeGoal": "string breve",
      "heroDirection": { "emphasis": "offering|objective|mood", "preferredOfferingName"?: "debe ser UNO de los nombres reales suministrados" },
      "heroTitleSuggestion"?: "maximo 80 caracteres, sin inventar datos",
      "heroDescriptionSuggestion"?: "maximo 180 caracteres, sin inventar datos",
      "preferredHeroVariant"?: "centered|split-left|split-right|immersive",
      "highlightedOfferings"?: ["maximo 2, deben ser nombres reales suministrados"],
      "ctaIntent"?: "appointment|quote|contact",
      "assetIntent"?: { "subject": "frase de busqueda en ingles, maximo 60 caracteres", "mood"?: "maximo 30 caracteres" },
      "preferredSectionOrder"?: ["debe ser una permutacion de availableRoles de esa pagina"],
      "heroTreatment"?: "standard|abstract-glow",
      "processTreatment"?: "cards|numbered",
      "twoItemLayoutTreatment"?: "paired|cards",
      "sectionToneStrategy"?: "standard|soft-rhythm|contrast-led"
    }
  ]
}

Nunca incluyas URLs, correos electronicos, ni campos fuera de esta forma.`
}

function buildUserMessage(request: CreativeDirectorRequestV1): string {
  // Only the already-normalized, already-bounded request object -- no raw prompt, no PII.
  return JSON.stringify({
    business: request.business,
    designMemory: request.designMemory,
    pages: request.pages,
    ...(request.referenceContext?.length ? { referenceContext: request.referenceContext } : {}),
  })
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{")
  if (start === -1) return null
  let depth = 0
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (char === "{") depth += 1
    else if (char === "}") {
      depth -= 1
      if (depth === 0) return text.slice(start, index + 1)
    }
  }
  return null
}

function isTimeoutLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = "name" in error ? String((error as { name?: unknown }).name) : ""
  const message = "message" in error ? String((error as { message?: unknown }).message) : ""
  return /timeout/i.test(name) || /timeout|timed out/i.test(message) || (error as { status?: number }).status === 408
}

export function createAnthropicCreativeDirectorProviderV1(
  options: AnthropicCreativeDirectorProviderOptionsV1 = {},
): CreativeDirectorProviderV1 {
  return {
    async request(request: CreativeDirectorRequestV1) {
      const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY
      if (!apiKey) return null

      const client = new Anthropic({ apiKey, timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS, maxRetries: 0 })

      try {
        const message = await client.messages.create({
          model: options.model ?? DEFAULT_MODEL,
          max_tokens: DEFAULT_MAX_TOKENS,
          system: buildSystemPrompt(),
          messages: [{ role: "user", content: buildUserMessage(request) }],
        })

        const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : null
        if (!raw) return null

        const jsonText = extractFirstJsonObject(raw)
        if (!jsonText) return null

        // Parsed but UNTRUSTED -- the gateway validates this before anything downstream ever sees it.
        return JSON.parse(jsonText) as unknown as Awaited<ReturnType<CreativeDirectorProviderV1["request"]>>
      } catch (error) {
        if (isTimeoutLikeError(error)) throw new CreativeDirectorGatewayTimeoutErrorV1()
        console.error("[Orvenix Creative Director] Anthropic provider error:", error instanceof Error ? error.name : "unknown_error")
        throw new Error("creative_director_provider_error")
      }
    },
  }
}
