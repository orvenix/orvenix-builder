import { z } from "zod"

const TARGETING_TYPES = [
  "device",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "path_prefix",
  "language",
] as const

const TARGETING_OPS = ["eq", "neq", "contains", "starts"] as const

const ExperimentTargetingRuleSchema = z.object({
  type: z.enum(TARGETING_TYPES),
  op: z.enum(TARGETING_OPS),
  value: z.string().min(1),
})

const ExperimentTargetingSchema = z.object({
  logic: z.enum(["and", "or"]).default("and"),
  rules: z.array(ExperimentTargetingRuleSchema).default([]),
})

export type VisitorContext = {
  pathname?: string
  userAgent?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  language?: string
  cookies?: Record<string, string>
}

export type ExperimentTargeting = z.infer<typeof ExperimentTargetingSchema>

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function detectDevice(userAgent?: string): "mobile" | "desktop" | "unknown" {
  const ua = normalizeText(userAgent)
  if (!ua) return "unknown"
  return /mobile|iphone|android|ipad/.test(ua) ? "mobile" : "desktop"
}

function resolveContextValue(type: ExperimentTargeting["rules"][number]["type"], context: VisitorContext): string {
  if (type === "device") return detectDevice(context.userAgent)
  if (type === "utm_source") return normalizeText(context.utmSource)
  if (type === "utm_medium") return normalizeText(context.utmMedium)
  if (type === "utm_campaign") return normalizeText(context.utmCampaign)
  if (type === "path_prefix") return normalizeText(context.pathname)
  return normalizeText(context.language)
}

function evaluateRule(rule: ExperimentTargeting["rules"][number], context: VisitorContext): boolean {
  const actual = resolveContextValue(rule.type, context)
  const expected = normalizeText(rule.value)
  if (!actual) return rule.op === "neq" && expected !== ""
  if (rule.op === "eq") return actual === expected
  if (rule.op === "neq") return actual !== expected
  if (rule.op === "contains") return actual.includes(expected)
  return actual.startsWith(expected)
}

export function parseExperimentTargeting(input: unknown): ExperimentTargeting | null {
  if (!input || (typeof input !== "object" && typeof input !== "string")) return null
  const source = typeof input === "string"
    ? (() => {
        try {
          return JSON.parse(input)
        } catch {
          return null
        }
      })()
    : input

  if (!source) return null
  const parsed = ExperimentTargetingSchema.safeParse(source)
  return parsed.success ? parsed.data : null
}

export function isEligibleForExperiment(targeting: ExperimentTargeting | null, context: VisitorContext): boolean {
  if (!targeting || targeting.rules.length === 0) return true
  const results = targeting.rules.map((rule) => evaluateRule(rule, context))
  return targeting.logic === "or" ? results.some(Boolean) : results.every(Boolean)
}

export function extractVisitorContext(request: Request): VisitorContext {
  const url = new URL(request.url)
  const cookies: Record<string, string> = {}
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    for (const entry of cookieHeader.split(";")) {
      const [rawKey, ...rawValue] = entry.split("=")
      const key = rawKey?.trim()
      if (!key) continue
      cookies[key] = rawValue.join("=").trim()
    }
  }

  const acceptLanguage = request.headers.get("accept-language")
  const language = acceptLanguage
    ? acceptLanguage.split(",")[0]?.split("-")[0]?.trim().toLowerCase() || undefined
    : undefined

  return {
    pathname: url.pathname,
    userAgent: request.headers.get("user-agent") ?? undefined,
    utmSource: url.searchParams.get("utm_source") ?? undefined,
    utmMedium: url.searchParams.get("utm_medium") ?? undefined,
    utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
    language,
    cookies: Object.keys(cookies).length > 0 ? cookies : undefined,
  }
}
