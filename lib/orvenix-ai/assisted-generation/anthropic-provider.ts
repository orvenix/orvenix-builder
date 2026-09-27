import Anthropic from "@anthropic-ai/sdk"
import type { AssistedSiteGenerationProviderV1 } from "./contract"

/**
 * ASSISTED-3A: a focused, bounded Anthropic adapter for Assisted Site
 * Generation V1. Reuses the already-installed @anthropic-ai/sdk (no new
 * dependency) and mirrors creative-director/anthropic-provider.ts's
 * conventions (model/timeout/maxRetries/JSON-extraction/error-philosophy)
 * deliberately WITHOUT importing from it -- exactly the same "duplicate
 * the discipline, not the code" rationale contract.ts's own module header
 * already documents for this package: this module stays independently
 * reviewable, and creative-director/anthropic-provider.ts (already
 * shipped, already relied upon) stays untouched.
 *
 * Claude here is a creative ARCHITECT, never a site builder, renderer,
 * compiler, factual authority, or EditorTree/HTML/JSX/CSS generator. Its
 * only allowed output is an untrusted JSON object that must independently
 * survive validateAssistedSiteGenerationProposalV1 + closed-world
 * grounding (planner-adapter.ts) before anything downstream ever
 * consumes it -- this module never casts its parsed result to a trusted
 * type, and never compiles/renders/persists anything itself.
 *
 * Wired (ASSISTED-3B) ONLY through architecture-bridge.ts's explicit
 * "anthropic" mode, which trusted server-side callers must request per
 * generation -- never reachable via the ORVENIX_ASSISTED_GENERATION_MODE
 * env resolver.
 *
 * Never logs: the API key, the raw request payload, the raw response
 * text, or raw generated content on error -- only generic, non-content
 * error class names (same discipline as the Creative Director provider).
 */

export const ASSISTED_SITE_GENERATION_ANTHROPIC_PROVIDER_KEY_V1 = "anthropic"
export const ASSISTED_SITE_GENERATION_ANTHROPIC_MODEL_KEY_V1 = "claude_haiku_4_5"

const DEFAULT_MODEL = "claude-haiku-4-5-20251001"
const DEFAULT_TIMEOUT_MS = 12_000
const DEFAULT_MAX_TOKENS = 2200

export interface AnthropicAssistedSiteGenerationProviderOptionsV1 {
  apiKey?: string
  model?: string
  timeoutMs?: number
}

export class AssistedSiteGenerationAnthropicTimeoutErrorV1 extends Error {
  constructor() {
    super("Assisted Site Generation Anthropic provider timed out.")
    this.name = "AssistedSiteGenerationAnthropicTimeoutErrorV1"
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

function buildSystemPrompt(): string {
  return `Eres el Arquitecto de Composicion Asistida de Orvenix, un experto senior en diseno/arquitectura web.

Tu unica tarea: proponer, para el sitio real descrito en el mensaje del usuario ("business"/"pages"/"offerings"/"capabilities"), una PROPUESTA DE COMPOSICION que siga EXACTAMENTE el contrato AssistedSiteGenerationProposalV1. No eres el constructor del sitio, ni el renderizador, ni el compilador, ni una autoridad factual, ni un generador de EditorTree/HTML/JSX/CSS/nombres de componentes. Nunca inventas hechos ni escribes copy fuera del campo opcional "siteNarrative" (una frase breve, solo trazabilidad interna, nunca renderizada).

PUEDES:
- elegir, para cada pagina en "pages", un "sectionOrder" que sea una permutacion de sus "roles" existentes (nunca agregar ni quitar roles)
- crear una o mas "instances" por rol existente, cada una con una "selection" (mode "all" | "single-item" | "subset", con itemIndex/indexes SOLO dentro del conteo real de "offerings.services"/"offerings.products" indicado por la pagina)
- elegir, para cada instance, un "composition" con treatment/alignment/scale/mediaStrategy/backgroundStrategy/layout, PERO SOLO valores presentes en "capabilities" para ese rol especifico
- para el rol "products", agrupar por categoria con selection { "mode": "category", "category": "<clave>" } usando SOLO una "key" de "categories" (si "categories" no existe, este modo no esta disponible), y priorizar productos por precio, disponibilidad o "purchasable" -- los datos de "offerings.products" son hechos de solo lectura
- usar "creativeDirection" y "designReferences" (si estan presentes en el mensaje) como inspiracion de razonamiento sobre caracter, jerarquia, ritmo y contraste visual -- nunca como una plantilla a copiar literalmente
- producir composiciones deliberadamente diferentes entre paginas (por ejemplo Home vs. paginas secundarias) y evitar la convergencia hacia una unica plantilla generica

DEBES:
- usar EXCLUSIVAMENTE los "slug" de pagina y los "role" suministrados en "pages" -- nunca inventar un slug o un rol fuera de esas listas
- usar EXCLUSIVAMENTE valores de treatment/alignment/scale/mediaStrategy/backgroundStrategy/layout.kind presentes en "capabilities" para el rol de esa instance -- nunca un valor fuera de esa lista
- usar EXCLUSIVAMENTE indices de "offerings.services"/"offerings.products" que existan (0-based, dentro del conteo real suministrado, nunca mas alla)
- responder SOLO un objeto JSON valido (sin markdown, sin comentarios, sin texto fuera del JSON) con esta forma exacta:
{
  "version": 1,
  "roleKey": "assisted_site_generation_v1",
  "strategyKey": "composition_layout_advisory_v1",
  "siteNarrative"?: "string breve, opcional, solo trazabilidad",
  "pages": [
    {
      "slug": "debe coincidir EXACTAMENTE con un slug suministrado",
      "sectionOrder"?: ["permutacion opcional de los roles existentes de esa pagina"],
      "instances"?: [
        {
          "role": "debe ser uno de los roles existentes de esa pagina",
          "selection"?: { "mode": "all|single-item|subset|category", "itemIndex"?: numero, "indexes"?: [numeros], "category"?: "clave de categories (solo con mode category)" },
          "composition"?: {
            "treatment"?: "solo un valor de capabilities.roleTreatments para ese rol",
            "alignment"?: "solo un valor de capabilities.alignments",
            "scale"?: "solo un valor de capabilities.scales",
            "mediaStrategy"?: "solo un valor de capabilities.mediaStrategies",
            "backgroundStrategy"?: "solo un valor de capabilities.backgroundStrategies",
            "layout"?: { "kind": "solo un valor de capabilities.roleLayouts para ese rol", "mirror"?: boolean, "rhythm"?: "compact|standard|spacious" }
          }
        }
      ]
    }
  ]
}

NO DEBES NUNCA:
- inventar negocios, servicios, productos, categorias, variantes, SKU, identificadores, inventario, paginas, rutas, URLs, personas, testimonios, precios ni metricas
- modificar precios, disponibilidad o cualquier dato comercial, o proponer carritos, checkout, pagos o botones funcionales (Orvenix decide que productos son comprables)
- generar CSS, clases (Tailwind u otras), HTML, JSX, componentes React, ni nombres de componentes
- generar un EditorTree ni ninguna otra estructura de renderizado
- exponer razonamiento o cadena de pensamiento -- responde unicamente la propuesta final en JSON

CALIDAD CREATIVA: actua como un director de diseno senior evaluando el caracter del negocio, su objetivo, la jerarquia y proposito de cada pagina, el ritmo visual, el contraste entre secciones, la densidad de informacion, la narrativa visual, el enfasis apropiado en servicios/productos, la estrategia de medios, la ubicacion de la confianza, y la composicion de cierre -- y en como estas decisiones deben diferir razonablemente entre Home y paginas secundarias. No maximices la novedad de forma ciega: la coherencia profesional importa mas que la variacion aleatoria. Evita converger siempre hacia la misma composicion por defecto cuando el contexto justifica una distinta.`
}

function buildUserMessage(context: unknown): string {
  // The caller-constructed AssistedSiteGenerationRequestContextV1 IS the
  // entire message -- see request-context.ts's module header for the
  // explicit list of what it deliberately never contains (no raw prompt,
  // no PII, no credentials, no EditorTree).
  return JSON.stringify(context)
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

export function createAnthropicAssistedSiteGenerationProviderV1(
  options: AnthropicAssistedSiteGenerationProviderOptionsV1 = {},
): AssistedSiteGenerationProviderV1 {
  return {
    async request(input: unknown) {
      const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY
      if (!apiKey) return null

      // Defensive on the way IN too: a caller that hasn't built a proper
      // AssistedSiteGenerationRequestContextV1 gets a clean `null` (which
      // the shared validator/grounding boundary already treats as a
      // rejectable non-object), never a request sent to Anthropic with an
      // unexpected shape.
      if (!isPlainRecord(input)) return null

      const client = new Anthropic({ apiKey, timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS, maxRetries: 0 })

      try {
        const message = await client.messages.create({
          model: options.model ?? DEFAULT_MODEL,
          max_tokens: DEFAULT_MAX_TOKENS,
          system: buildSystemPrompt(),
          messages: [{ role: "user", content: buildUserMessage(input) }],
        })

        const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : null
        if (!raw) return null

        const jsonText = extractFirstJsonObject(raw)
        if (!jsonText) return null

        // Parsed but UNTRUSTED -- validateAssistedSiteGenerationProposalV1
        // + closed-world grounding (planner-adapter.ts) are the only
        // authority downstream ever consults before this can affect
        // anything real.
        return JSON.parse(jsonText) as unknown
      } catch (error) {
        if (isTimeoutLikeError(error)) throw new AssistedSiteGenerationAnthropicTimeoutErrorV1()
        console.error("[Orvenix Assisted Generation] Anthropic provider error:", error instanceof Error ? error.name : "unknown_error")
        throw new Error("assisted_site_generation_provider_error")
      }
    },
  }
}
