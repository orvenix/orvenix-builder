import { createHash } from "crypto"
import Anthropic from "@anthropic-ai/sdk"
import type { FullSiteCreativeBlueprintProviderV1 } from "./contract"
import { buildFullSiteCommerceCapabilityManifestV1 } from "./capability-manifest"

/**
 * FULL-SITE-4A: the REAL external Full-Site Creative Architect adapter
 * (Anthropic). SERVER-ONLY: it reads the credential from the server
 * environment and must never be imported by a "use client" module (a
 * unit test walks every client module's import graph to enforce this;
 * the repo has no `server-only` package, so this is the boundary).
 *
 * The external model DESIGNS; Orvenix decides everything else. This
 * module only turns a sanitized request context into an UNTRUSTED
 * candidate object. It never validates-by-casting: the orchestrator runs
 * validateFullSiteCreativeBlueprintV1 + commerce grounding before
 * anything downstream can consume it.
 *
 * Model: REQUIRED, injected by the trusted caller. There is deliberately
 * no default model here, and nothing is shared with the Creative
 * Director / Assisted Generation Haiku configuration.
 *
 * Never logs or returns: the API key, the request, the raw response text.
 */

export const FULL_SITE_ANTHROPIC_PROVIDER_KEY_V1 = "anthropic"

export const FULL_SITE_PROVIDER_TIMEOUT_LIMITS_V1 = { defaultMs: 120_000, minMs: 5_000, maxMs: 240_000 } as const
export const FULL_SITE_PROVIDER_MAX_TOKENS_LIMITS_V1 = { default: 14_000, min: 2_000, max: 24_000 } as const
/** Response text ceiling before parsing (characters). */
export const FULL_SITE_PROVIDER_MAX_RESPONSE_LENGTH_V1 = 120_000

export type FullSiteProviderFailureCodeV1 = "missing_configuration" | "timeout" | "provider_error" | "empty_response" | "output_truncated" | "parse_error"

export type FullSiteProviderParseFailureCategoryV1 = "none" | "empty" | "parse_incomplete" | "parse_ambiguous" | "parse_invalid" | "non_object_root"
export type FullSiteProviderCharacterClassV1 = "empty" | "object" | "array" | "quote" | "digit" | "scalar" | "fence" | "other"

export type FullSiteProviderResponseDiagnosticsV1 = {
  contentBlockCount: number
  contentBlockTypes: string[]
  textBlockCount: number
  textCharacterCount: number
  nonTextBlockCount: number
  stopReason?: string
  stopSequencePresent: boolean
  inputTokens?: number
  outputTokens?: number
  firstNonWhitespaceCharacterClass: FullSiteProviderCharacterClassV1
  lastNonWhitespaceCharacterClass: FullSiteProviderCharacterClassV1
  fenceDetected: boolean
  multipleFenceDetected: boolean
  balancedJsonStructure: boolean
  parseFailureCategory: FullSiteProviderParseFailureCategoryV1
  responseFingerprint: string
}

export class FullSiteProviderErrorV1 extends Error {
  constructor(readonly code: FullSiteProviderFailureCodeV1, readonly diagnostics?: FullSiteProviderResponseDiagnosticsV1) {
    super(`full_site_provider_${code}`)
    this.name = "FullSiteProviderErrorV1"
  }
}

export interface AnthropicFullSiteCreativeProviderConfigV1 {
  /** Required. Chosen by the trusted server caller -- never by a browser payload. */
  model: string
  /** Optional explicit credential; absent -> the server environment credential (presence check only). */
  apiKey?: string
  timeoutMs?: number
  maxTokens?: number
}

export type AnthropicFullSiteCreativeProviderV1 = FullSiteCreativeBlueprintProviderV1 & {
  readonly providerKey: typeof FULL_SITE_ANTHROPIC_PROVIDER_KEY_V1
  readonly modelKey: string
  readonly timeoutMs: number
}

const MODEL_PATTERN = /^[a-z0-9][a-z0-9.-]{2,79}$/

function clamp(value: number | undefined, limits: { min: number; max: number }, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.min(limits.max, Math.max(limits.min, Math.round(value)))
}

function list(values: readonly string[]): string {
  return values.join(" | ")
}

/** The static, server-owned system prompt. Vocabulary is DERIVED from the capability manifest (single source of truth). */
export function buildFullSiteCreativeSystemPromptV1(): string {
  const m = buildFullSiteCommerceCapabilityManifestV1()
  const sectionIntents = Object.entries(m.sectionIntents).map(([intent, role]) => `${intent}(role:${role})`).join(", ")
  const layouts = Object.entries(m.layoutsByRole).map(([role, kinds]) => `${role}: ${list(kinds as readonly string[])}`).join("; ")
  // CF-1 renderer truth: say what each choice really does.
  const merchandising = Object.entries(m.merchandisingByRole).map(([role, kinds]) => `role:"${role}": ${list(kinds as readonly string[])}`).join("; ")
  const rhythmEffects = Object.entries(m.rhythmEffects).map(([rhythm, effect]) => `${rhythm}=${effect ?? "sin efecto propio"}`).join("; ")
  const navEffects = Object.entries(m.navigationConceptEffects).map(([concept, effect]) => `${concept}=layout ${effect.renderedLayout}, enlaces por defecto ${effect.defaultPrimaryPurposes.join("+")}`).join("; ")
  return `Eres el Director Creativo y Arquitecto de Informacion senior de Orvenix para tiendas en linea: diseñas la experiencia COMPLETA de un sitio de comercio (universo de paginas, jerarquia, secuencia de secciones, navegacion, ritmo narrativo, enfasis de productos y categorias, medios y llamadas a la accion).

Recibes en el mensaje del usuario un JSON con: "business" (contexto), "catalog" (productos y categorias REALES, con indices), "capabilities" (lo que Orvenix realmente puede construir), "designReferences" (gramaticas de diseño de referencia) y "outputContract".

LIBERTAD CREATIVA: decide que paginas existen, su jerarquia, que secciones tiene cada pagina y en que orden, puedes repetir secciones, elige que productos o categorias destacar, el concepto de navegacion, los layouts, el ritmo, la densidad, la intencion de medios y la intencion de cada llamada a la accion. Paginas distintas deben sentirse distintas dentro de un mismo sistema coherente. Las referencias son inspiracion de gramatica, nunca plantillas: sintetiza un sitio ORIGINAL, no reproduzcas una referencia completa.

LIMITES ESTRICTOS:
- usa solo productos por su "index" y categorias por su "key" exactos de "catalog"; nunca inventes productos, categorias, servicios, testimonios, precios, inventario, descuentos, envios, garantias ni ningun otro hecho
- nunca escribas precios, stock, SKU, identificadores, URLs, rutas, codigo, HTML, JSX, CSS, clases, estilos ni nombres de componentes
- disena SOLO con las capacidades de "capabilities"; no diseñes para lo que aparece en "capabilities.notAvailable"
- maximo ${m.limits.maxPages} paginas, ${m.limits.maxSectionsPerPage} secciones por pagina y ${m.limits.maxRefsPerSection} referencias por seccion

VOCABULARIO (valores exactos):
- page.purpose: ${list(m.pagePurposes)}; debe existir "home" y "catalog"; "category" requiere target {"kind":"category","key"}; "product_detail" requiere target {"kind":"product","index"}
- section.intent con su role obligatorio: ${sectionIntents}
- section.layout {"kind", "mirror"?: boolean, "rhythm"?: "compact"|"standard"|"spacious"} con kind EXACTAMENTE permitido por role: ${layouts}. Cada kind listado produce un resultado distinto; role:"${m.layoutIgnoredRoles.join('","')}" ignora layout. No inventes identificadores de layout; si una composicion deseada no existe, no la simules con otros campos: elige la opcion listada mas cercana.
- section.refs: [{"kind":"product","index"} | {"kind":"category","key"}]
- section.narrative y page.narrativeGoal: preferir uno de ${list(m.narrativeTokens)}
- section.mediaIntent: preferir uno de ${list(m.mediaTokens)}
- section.ctaIntent: ${list(m.ctaIntents)}; section.emphasis: ${list(m.emphases)} (role:"${m.emphasisIgnoredRoles.join('","')}" la ignora); section.relationToPrevious: ${list(m.relations)}
- productos: section.productCardTreatment (solo role:"products"): ${list(m.productCardTreatments)}; section.merchandisingComposition por role: ${merchandising}. Una composicion de productos organiza VARIOS productos y define la estructura de la seccion (tiene prioridad sobre un layout split); con un solo producto se usa el layout.
- page.density: ${list(m.pageDensities)}
- siteConcept.narrative: ${list(m.siteNarratives)}; siteConcept.rhythm: ${list(m.rhythms)} (efecto real: ${rhythmEffects}); siteConcept.density: ${list(m.siteDensities)}
- navigation.concept: ${list(m.navigationConcepts)} (efecto real: ${navEffects}); navigation.primaryPurposes: lista de page.purpose; navigation.cartProminence: ${list(m.cartProminence)}

SALIDA: responde UNICAMENTE un objeto JSON valido (sin markdown, sin comentarios, sin texto antes o despues) con esta forma:
{"version":1,"roleKey":"full_site_creative_blueprint_v1","strategyKey":"bounded_full_site_generation_v1","siteConcept":{"narrative","rhythm","density"},"navigation":{"concept","primaryPurposes"?,"cartProminence"?},"pages":[{"purpose","target"?,"narrativeGoal"?,"density"?,"sections":[{"intent","role","refs"?,"narrative"?,"mediaIntent"?,"ctaIntent"?,"layout"?,"emphasis"?,"relationToPrevious"?,"productCardTreatment"?,"merchandisingComposition"?}]}]}
No incluyas ningun otro campo. No expliques tu razonamiento. Usa JSON compacto; si el presupuesto de salida no alcanza, reduce primero paginas internas y luego secciones, pero conserva home y catalog.`
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

/**
 * Hardened, string-aware extraction of exactly ONE top-level JSON object.
 * Accepts an optional surrounding ```json fence; rejects anything else
 * before/after the object (prose, trailing code), arrays and non-objects.
 * JSON.parse only -- never eval / Function.
 */
export function parseFullSiteProviderResponseV1(raw: string): Record<string, unknown> {
  if (raw.length > FULL_SITE_PROVIDER_MAX_RESPONSE_LENGTH_V1) throw new FullSiteProviderErrorV1("parse_error")
  let text = raw.trim()
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n?```$/i.exec(text)
  if (fenced) text = fenced[1].trim()
  if (!text.startsWith("{")) throw new FullSiteProviderErrorV1("parse_error")

  let depth = 0
  let inString = false
  let escaped = false
  let end = -1
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === "\"") inString = false
      continue
    }
    if (char === "\"") inString = true
    else if (char === "{") depth += 1
    else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        end = index
        break
      }
    }
  }
  if (end === -1 || text.slice(end + 1).trim()) throw new FullSiteProviderErrorV1("parse_error")

  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(0, end + 1))
  } catch {
    throw new FullSiteProviderErrorV1("parse_error")
  }
  if (!isPlainRecord(parsed)) throw new FullSiteProviderErrorV1("parse_error")
  return parsed
}

type AnthropicMessageLikeV1 = {
  stop_reason?: unknown
  stop_sequence?: unknown
  content?: unknown
  usage?: { input_tokens?: unknown; output_tokens?: unknown }
}

export type ExtractedFullSiteProviderTextV1 = {
  text: string
  stopReason?: string
  textBlockCount: number
  nonTextBlockCount: number
}

function isAnthropicContentBlockLike(value: unknown): value is { type?: unknown; text?: unknown } {
  return Boolean(value) && typeof value === "object"
}

export function extractFullSiteProviderTextV1(message: AnthropicMessageLikeV1): ExtractedFullSiteProviderTextV1 {
  const stopReason = typeof message.stop_reason === "string" ? message.stop_reason : undefined
  const content = Array.isArray(message.content) ? message.content : []
  const textParts: string[] = []
  let nonTextBlockCount = 0

  for (const block of content) {
    if (!isAnthropicContentBlockLike(block)) {
      nonTextBlockCount += 1
      continue
    }
    if (block.type === "text" && typeof block.text === "string") textParts.push(block.text)
    else nonTextBlockCount += 1
  }

  return {
    text: textParts.join("").trim(),
    stopReason,
    textBlockCount: textParts.length,
    nonTextBlockCount,
  }
}

function fingerprintResponseText(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

function characterClass(char: string | undefined): FullSiteProviderCharacterClassV1 {
  if (!char) return "empty"
  if (char === "{" || char === "}") return "object"
  if (char === "[" || char === "]") return "array"
  if (char === "\"") return "quote"
  if (/\d|-/.test(char)) return "digit"
  if (/[tfn]/i.test(char)) return "scalar"
  if (char === "`") return "fence"
  return "other"
}

function wholeFenceInner(text: string): string | null {
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n?```$/i.exec(text.trim())
  return fenced ? fenced[1].trim() : null
}

function scanJsonStructure(raw: string): { balancedJsonStructure: boolean; parseFailureCategory: FullSiteProviderParseFailureCategoryV1 } {
  const text = raw.trim()
  if (!text) return { balancedJsonStructure: false, parseFailureCategory: "empty" }
  const candidate = wholeFenceInner(text) ?? text
  const first = candidate.trim()[0]
  if (!first) return { balancedJsonStructure: false, parseFailureCategory: "empty" }
  if (first !== "{" && first !== "[") return { balancedJsonStructure: false, parseFailureCategory: "non_object_root" }

  const stack: string[] = []
  let inString = false
  let escaped = false
  let rootClosedAt = -1
  let invalid = false
  for (let index = 0; index < candidate.length; index += 1) {
    const char = candidate[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === "\"") inString = false
      continue
    }
    if (char === "\"") inString = true
    else if (char === "{" || char === "[") stack.push(char)
    else if (char === "}" || char === "]") {
      const open = stack.pop()
      if ((char === "}" && open !== "{") || (char === "]" && open !== "[")) {
        invalid = true
        break
      }
      if (stack.length === 0) {
        rootClosedAt = index
        break
      }
    }
  }

  if (invalid) return { balancedJsonStructure: false, parseFailureCategory: "parse_invalid" }
  if (inString || escaped || stack.length > 0 || rootClosedAt === -1) return { balancedJsonStructure: false, parseFailureCategory: "parse_incomplete" }
  if (candidate.slice(rootClosedAt + 1).trim()) return { balancedJsonStructure: false, parseFailureCategory: "parse_ambiguous" }
  if (first !== "{") return { balancedJsonStructure: true, parseFailureCategory: "non_object_root" }

  try {
    const parsed = JSON.parse(candidate.slice(0, rootClosedAt + 1))
    return { balancedJsonStructure: isPlainRecord(parsed), parseFailureCategory: isPlainRecord(parsed) ? "none" : "non_object_root" }
  } catch {
    return { balancedJsonStructure: false, parseFailureCategory: "parse_invalid" }
  }
}

function numericToken(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined
}

export function buildFullSiteProviderResponseDiagnosticsV1(message: AnthropicMessageLikeV1): FullSiteProviderResponseDiagnosticsV1 {
  const content = Array.isArray(message.content) ? message.content : []
  const contentBlockTypes = content.map((block) => (isAnthropicContentBlockLike(block) && typeof block.type === "string" ? block.type : "unknown")).slice(0, 32)
  const extracted = extractFullSiteProviderTextV1(message)
  const text = extracted.text
  const trimmed = text.trim()
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  const fenceCount = (trimmed.match(/```/g) ?? []).length
  const multipleFenceDetected = fenceCount > 2
  const scanned = scanJsonStructure(text)
  const structure = multipleFenceDetected
    ? { balancedJsonStructure: false, parseFailureCategory: "parse_ambiguous" as const }
    : scanned

  return {
    contentBlockCount: content.length,
    contentBlockTypes,
    textBlockCount: extracted.textBlockCount,
    textCharacterCount: text.length,
    nonTextBlockCount: extracted.nonTextBlockCount,
    ...(extracted.stopReason ? { stopReason: extracted.stopReason } : {}),
    stopSequencePresent: typeof message.stop_sequence === "string" && message.stop_sequence.length > 0,
    ...(numericToken(message.usage?.input_tokens) !== undefined ? { inputTokens: numericToken(message.usage?.input_tokens) } : {}),
    ...(numericToken(message.usage?.output_tokens) !== undefined ? { outputTokens: numericToken(message.usage?.output_tokens) } : {}),
    firstNonWhitespaceCharacterClass: characterClass(first),
    lastNonWhitespaceCharacterClass: characterClass(last),
    fenceDetected: fenceCount > 0,
    multipleFenceDetected,
    balancedJsonStructure: structure.balancedJsonStructure,
    parseFailureCategory: structure.parseFailureCategory,
    responseFingerprint: fingerprintResponseText(text),
  }
}

function isTimeoutLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const name = "name" in error ? String((error as { name?: unknown }).name) : ""
  const message = "message" in error ? String((error as { message?: unknown }).message) : ""
  return /timeout/i.test(name) || /timeout|timed out/i.test(message) || (error as { status?: number }).status === 408
}

export function createAnthropicFullSiteCreativeProviderV1(config: AnthropicFullSiteCreativeProviderConfigV1): AnthropicFullSiteCreativeProviderV1 {
  if (typeof window !== "undefined") throw new Error("Full-Site Anthropic provider is server-only.")
  const model = typeof config?.model === "string" ? config.model.trim() : ""
  const timeoutMs = clamp(config?.timeoutMs, { min: FULL_SITE_PROVIDER_TIMEOUT_LIMITS_V1.minMs, max: FULL_SITE_PROVIDER_TIMEOUT_LIMITS_V1.maxMs }, FULL_SITE_PROVIDER_TIMEOUT_LIMITS_V1.defaultMs)
  const maxTokens = clamp(config?.maxTokens, FULL_SITE_PROVIDER_MAX_TOKENS_LIMITS_V1, FULL_SITE_PROVIDER_MAX_TOKENS_LIMITS_V1.default)

  return {
    providerKey: FULL_SITE_ANTHROPIC_PROVIDER_KEY_V1,
    modelKey: model,
    timeoutMs,
    async generate(input: unknown) {
      if (!MODEL_PATTERN.test(model)) throw new FullSiteProviderErrorV1("missing_configuration")
      const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY
      if (!apiKey) throw new FullSiteProviderErrorV1("missing_configuration")
      if (!isPlainRecord(input)) throw new FullSiteProviderErrorV1("provider_error")

      const client = new Anthropic({ apiKey, timeout: timeoutMs, maxRetries: 0 })
      let extracted: ExtractedFullSiteProviderTextV1
      let diagnostics: FullSiteProviderResponseDiagnosticsV1 | undefined
      try {
        const message = await client.messages.create({
          model,
          max_tokens: maxTokens,
          system: buildFullSiteCreativeSystemPromptV1(),
          messages: [{ role: "user", content: JSON.stringify(input) }],
        })
        extracted = extractFullSiteProviderTextV1(message)
        diagnostics = buildFullSiteProviderResponseDiagnosticsV1(message)
      } catch (error) {
        throw new FullSiteProviderErrorV1(isTimeoutLikeError(error) ? "timeout" : "provider_error")
      }
      if (extracted.stopReason === "max_tokens") throw new FullSiteProviderErrorV1("output_truncated", diagnostics)
      if (!extracted.text) throw new FullSiteProviderErrorV1("empty_response", diagnostics)
      try {
        return parseFullSiteProviderResponseV1(extracted.text)
      } catch (error) {
        if (error instanceof FullSiteProviderErrorV1 && error.code === "parse_error") throw new FullSiteProviderErrorV1("parse_error", diagnostics)
        throw error
      }
    },
  }
}
