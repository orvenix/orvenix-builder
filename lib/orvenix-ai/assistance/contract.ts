import { createHash } from "node:crypto"

export const DESIGN_ASSISTANCE_CONTRACT_V1_VERSION = 1

export const DESIGN_ASSISTANCE_ROLE_KEYS_V1 = [
  "theme_direction_advisor_v1",
] as const

export const DESIGN_ASSISTANCE_STRATEGY_KEYS_V1 = [
  "theme_bucket_recommendation_v1",
] as const

export const DESIGN_ASSISTANCE_STATUSES_V1 = [
  "requested",
  "applied",
  "rejected",
  "failed",
] as const

export const DESIGN_ASSISTANCE_FAILURE_CODES_V1 = [
  "timeout",
  "provider_error",
  "invalid_response",
  "validation_failed",
] as const

export const DESIGN_ASSISTANCE_INDUSTRY_BUCKETS_V1 = [
  "health",
  "restaurant",
  "agency",
  "ecommerce",
  "other",
] as const

export const DESIGN_ASSISTANCE_OBJECTIVE_BUCKETS_V1 = [
  "lead_generation",
  "sales",
  "brand_trust",
  "education",
  "other",
] as const

export const DESIGN_ASSISTANCE_STYLE_BUCKETS_V1 = [
  "premium",
  "minimal",
  "modern",
  "warm",
  "professional",
  "other",
] as const

export const DESIGN_ASSISTANCE_THEME_BUCKETS_V1 = {
  mode: ["light", "dark"] as const,
  accentHue: [
    "red",
    "orange",
    "yellow",
    "green",
    "cyan",
    "blue",
    "purple",
    "pink",
    "neutral",
  ] as const,
  contrastBucket: ["low", "medium", "high"] as const,
  radiusBucket: ["sharp", "soft", "pill"] as const,
  typographyBucket: ["serif", "mono", "display", "sans"] as const,
  motionBucket: ["none", "subtle", "expressive"] as const,
}

export type DesignAssistanceRoleKeyV1 = (typeof DESIGN_ASSISTANCE_ROLE_KEYS_V1)[number]
export type DesignAssistanceStrategyKeyV1 = (typeof DESIGN_ASSISTANCE_STRATEGY_KEYS_V1)[number]
export type DesignAssistanceStatusV1 = (typeof DESIGN_ASSISTANCE_STATUSES_V1)[number]
export type DesignAssistanceFailureCodeV1 = (typeof DESIGN_ASSISTANCE_FAILURE_CODES_V1)[number]
export type DesignAssistanceIndustryBucketV1 = (typeof DESIGN_ASSISTANCE_INDUSTRY_BUCKETS_V1)[number]
export type DesignAssistanceObjectiveBucketV1 = (typeof DESIGN_ASSISTANCE_OBJECTIVE_BUCKETS_V1)[number]
export type DesignAssistanceStyleBucketV1 = (typeof DESIGN_ASSISTANCE_STYLE_BUCKETS_V1)[number]

export type DesignAssistanceThemeDirectionV1 = {
  mode?: (typeof DESIGN_ASSISTANCE_THEME_BUCKETS_V1.mode)[number] | null
  accentHue?: (typeof DESIGN_ASSISTANCE_THEME_BUCKETS_V1.accentHue)[number] | null
  contrastBucket?: (typeof DESIGN_ASSISTANCE_THEME_BUCKETS_V1.contrastBucket)[number] | null
  radiusBucket?: (typeof DESIGN_ASSISTANCE_THEME_BUCKETS_V1.radiusBucket)[number] | null
  typographyBucket?: (typeof DESIGN_ASSISTANCE_THEME_BUCKETS_V1.typographyBucket)[number] | null
  motionBucket?: (typeof DESIGN_ASSISTANCE_THEME_BUCKETS_V1.motionBucket)[number] | null
}

export type DesignAssistanceContextV1 = {
  industryBucket: DesignAssistanceIndustryBucketV1 | null
  objectiveBucket: DesignAssistanceObjectiveBucketV1 | null
  styleBucket: DesignAssistanceStyleBucketV1 | null
  siteType: string | null
}

export type DesignAssistanceConstraintsV1 = {
  preserveStyle?: boolean
  preserveTheme?: boolean
  theme?: DesignAssistanceThemeDirectionV1
}

export type DesignAssistanceRequestV1 = {
  version: typeof DESIGN_ASSISTANCE_CONTRACT_V1_VERSION
  roleKey: DesignAssistanceRoleKeyV1
  strategyKey: DesignAssistanceStrategyKeyV1
  context: DesignAssistanceContextV1
  constraints?: DesignAssistanceConstraintsV1
}

export type DesignAssistanceProposalV1 = {
  version: typeof DESIGN_ASSISTANCE_CONTRACT_V1_VERSION
  roleKey: DesignAssistanceRoleKeyV1
  strategyKey: DesignAssistanceStrategyKeyV1
  theme: DesignAssistanceThemeDirectionV1
}

export type DesignAssistanceAttributionV1 = {
  version: typeof DESIGN_ASSISTANCE_CONTRACT_V1_VERSION
  roleKey: DesignAssistanceRoleKeyV1
  strategyKey: DesignAssistanceStrategyKeyV1
  providerKey: string
  modelKey: string
  status: DesignAssistanceStatusV1
  inputFingerprint: string
  outputFingerprint?: string
  failureCode?: DesignAssistanceFailureCodeV1
}

export type DesignAssistanceValidationResultV1<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

export interface DesignAssistanceProviderV1 {
  request(input: DesignAssistanceRequestV1): Promise<DesignAssistanceProposalV1 | null>
}

const PRIVATE_FIELD_NAMES = new Set([
  "userid",
  "siteid",
  "request",
  "initialplan",
  "businessname",
  "phone",
  "email",
  "url",
  "image",
  "prompt",
  "response",
  "rawinput",
  "rawoutput",
  "apikey",
  "outcomescore",
  "editdistance",
  "publishrate",
  "rankingscore",
])

const PROVIDER_MODEL_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/
const SITE_TYPE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]) {
  const allowed = new Set(allowedKeys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function hasPrivateKey(value: Record<string, unknown>) {
  return Object.keys(value).some((key) => PRIVATE_FIELD_NAMES.has(key.toLowerCase()))
}

function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | null {
  return typeof value === "string" && values.includes(value) ? value : null
}

function optionalEnumValue<T extends readonly string[]>(value: unknown, values: T) {
  if (value === undefined) return undefined
  if (value === null) return null
  return enumValue(value, values) ?? undefined
}

function cleanSiteType(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value !== "string") return undefined
  const cleaned = value.trim().toLowerCase()
  return SITE_TYPE_PATTERN.test(cleaned) ? cleaned : undefined
}

function isProviderModelKey(value: unknown): value is string {
  return typeof value === "string" && PROVIDER_MODEL_KEY_PATTERN.test(value)
}

function canonicalizeJsonValue(value: unknown): unknown {
  if (value === null) return null
  if (typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new Error("JSON canonico invalido.")
    }

    return value
  }
  if (Array.isArray(value)) return value.map(canonicalizeJsonValue)
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonicalizeJsonValue(entry)]),
    )
  }

  throw new Error("JSON canonico invalido.")
}

export function canonicalDesignAssistanceJsonV1(value: unknown) {
  return JSON.stringify(canonicalizeJsonValue(value))
}

function hashCanonical(value: unknown) {
  return createHash("sha256")
    .update(canonicalDesignAssistanceJsonV1(value))
    .digest("hex")
}

function normalizeTheme(value: unknown, errors: string[], path: string): DesignAssistanceThemeDirectionV1 | null {
  if (!isPlainRecord(value)) {
    errors.push(`${path} debe ser un objeto.`)
    return null
  }

  if (hasPrivateKey(value) || !hasOnlyKeys(value, Object.keys(DESIGN_ASSISTANCE_THEME_BUCKETS_V1))) {
    errors.push(`${path} contiene campos no permitidos.`)
    return null
  }

  const theme: DesignAssistanceThemeDirectionV1 = {}
  const mode = optionalEnumValue(value.mode, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.mode)
  const accentHue = optionalEnumValue(value.accentHue, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.accentHue)
  const contrastBucket = optionalEnumValue(value.contrastBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.contrastBucket)
  const radiusBucket = optionalEnumValue(value.radiusBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.radiusBucket)
  const typographyBucket = optionalEnumValue(value.typographyBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.typographyBucket)
  const motionBucket = optionalEnumValue(value.motionBucket, DESIGN_ASSISTANCE_THEME_BUCKETS_V1.motionBucket)

  for (const [key, normalized] of Object.entries({
    mode,
    accentHue,
    contrastBucket,
    radiusBucket,
    typographyBucket,
    motionBucket,
  })) {
    if (value[key] !== undefined && normalized === undefined) {
      errors.push(`${path}.${key} no es valido.`)
    }
  }

  if (mode !== undefined) theme.mode = mode
  if (accentHue !== undefined) theme.accentHue = accentHue
  if (contrastBucket !== undefined) theme.contrastBucket = contrastBucket
  if (radiusBucket !== undefined) theme.radiusBucket = radiusBucket
  if (typographyBucket !== undefined) theme.typographyBucket = typographyBucket
  if (motionBucket !== undefined) theme.motionBucket = motionBucket

  return theme
}

function normalizeContext(value: unknown, errors: string[]): DesignAssistanceContextV1 | null {
  if (!isPlainRecord(value)) {
    errors.push("context debe ser un objeto.")
    return null
  }

  if (hasPrivateKey(value) || !hasOnlyKeys(value, ["industryBucket", "objectiveBucket", "styleBucket", "siteType"])) {
    errors.push("context contiene campos no permitidos.")
    return null
  }

  const industryBucket = value.industryBucket === null ? null : enumValue(value.industryBucket, DESIGN_ASSISTANCE_INDUSTRY_BUCKETS_V1)
  const objectiveBucket = value.objectiveBucket === null ? null : enumValue(value.objectiveBucket, DESIGN_ASSISTANCE_OBJECTIVE_BUCKETS_V1)
  const styleBucket = value.styleBucket === null ? null : enumValue(value.styleBucket, DESIGN_ASSISTANCE_STYLE_BUCKETS_V1)
  const siteType = cleanSiteType(value.siteType)

  if (industryBucket === null && value.industryBucket !== null) errors.push("context.industryBucket no es valido.")
  if (objectiveBucket === null && value.objectiveBucket !== null) errors.push("context.objectiveBucket no es valido.")
  if (styleBucket === null && value.styleBucket !== null) errors.push("context.styleBucket no es valido.")
  if (siteType === undefined) errors.push("context.siteType no es valido.")

  return {
    industryBucket,
    objectiveBucket,
    styleBucket,
    siteType: siteType ?? null,
  }
}

function normalizeConstraints(value: unknown, errors: string[]): DesignAssistanceConstraintsV1 | undefined {
  if (value === undefined) return undefined
  if (!isPlainRecord(value)) {
    errors.push("constraints debe ser un objeto.")
    return undefined
  }

  if (hasPrivateKey(value) || !hasOnlyKeys(value, ["preserveStyle", "preserveTheme", "theme"])) {
    errors.push("constraints contiene campos no permitidos.")
    return undefined
  }

  const constraints: DesignAssistanceConstraintsV1 = {}

  if (value.preserveStyle !== undefined) {
    if (typeof value.preserveStyle !== "boolean") errors.push("constraints.preserveStyle debe ser boolean.")
    else constraints.preserveStyle = value.preserveStyle
  }

  if (value.preserveTheme !== undefined) {
    if (typeof value.preserveTheme !== "boolean") errors.push("constraints.preserveTheme debe ser boolean.")
    else constraints.preserveTheme = value.preserveTheme
  }

  if (value.theme !== undefined) {
    const theme = normalizeTheme(value.theme, errors, "constraints.theme")
    if (theme) constraints.theme = theme
  }

  if (constraints.preserveTheme === true && !constraints.theme) {
    errors.push("constraints.preserveTheme requiere constraints.theme con buckets abstractos.")
  }

  return Object.keys(constraints).length ? constraints : undefined
}

export function validateDesignAssistanceRequestV1(value: unknown): DesignAssistanceValidationResultV1<DesignAssistanceRequestV1> {
  const errors: string[] = []

  if (!isPlainRecord(value)) {
    return { ok: false, errors: ["La solicitud de asistencia debe ser un objeto."] }
  }

  if (hasPrivateKey(value) || !hasOnlyKeys(value, ["version", "roleKey", "strategyKey", "context", "constraints"])) {
    errors.push("La solicitud de asistencia contiene campos no permitidos.")
  }

  const roleKey = enumValue(value.roleKey, DESIGN_ASSISTANCE_ROLE_KEYS_V1)
  const strategyKey = enumValue(value.strategyKey, DESIGN_ASSISTANCE_STRATEGY_KEYS_V1)
  const context = normalizeContext(value.context, errors)
  const constraints = normalizeConstraints(value.constraints, errors)

  if (value.version !== DESIGN_ASSISTANCE_CONTRACT_V1_VERSION) errors.push("version no es valida.")
  if (!roleKey) errors.push("roleKey no es valido.")
  if (!strategyKey) errors.push("strategyKey no es valido.")

  if (errors.length || !roleKey || !strategyKey || !context) return { ok: false, errors }

  return {
    ok: true,
    value: {
      version: DESIGN_ASSISTANCE_CONTRACT_V1_VERSION,
      roleKey,
      strategyKey,
      context,
      ...(constraints ? { constraints } : {}),
    },
  }
}

export function validateDesignAssistanceProposalV1(value: unknown): DesignAssistanceValidationResultV1<DesignAssistanceProposalV1> {
  const errors: string[] = []

  if (!isPlainRecord(value)) {
    return { ok: false, errors: ["La propuesta de asistencia debe ser un objeto."] }
  }

  if (hasPrivateKey(value) || !hasOnlyKeys(value, ["version", "roleKey", "strategyKey", "theme"])) {
    errors.push("La propuesta de asistencia contiene campos no permitidos.")
  }

  const roleKey = enumValue(value.roleKey, DESIGN_ASSISTANCE_ROLE_KEYS_V1)
  const strategyKey = enumValue(value.strategyKey, DESIGN_ASSISTANCE_STRATEGY_KEYS_V1)
  const theme = normalizeTheme(value.theme, errors, "theme")

  if (value.version !== DESIGN_ASSISTANCE_CONTRACT_V1_VERSION) errors.push("version no es valida.")
  if (!roleKey) errors.push("roleKey no es valido.")
  if (!strategyKey) errors.push("strategyKey no es valido.")
  if (theme && Object.keys(theme).length === 0) errors.push("theme debe contener al menos un bucket.")

  if (errors.length || !roleKey || !strategyKey || !theme) return { ok: false, errors }

  return {
    ok: true,
    value: {
      version: DESIGN_ASSISTANCE_CONTRACT_V1_VERSION,
      roleKey,
      strategyKey,
      theme,
    },
  }
}

export function validateDesignAssistanceAttributionV1(value: unknown): DesignAssistanceValidationResultV1<DesignAssistanceAttributionV1> {
  const errors: string[] = []

  if (!isPlainRecord(value)) {
    return { ok: false, errors: ["La attribution de asistencia debe ser un objeto."] }
  }

  if (hasPrivateKey(value) || !hasOnlyKeys(value, [
    "version",
    "roleKey",
    "strategyKey",
    "providerKey",
    "modelKey",
    "status",
    "inputFingerprint",
    "outputFingerprint",
    "failureCode",
  ])) {
    errors.push("La attribution de asistencia contiene campos no permitidos.")
  }

  const roleKey = enumValue(value.roleKey, DESIGN_ASSISTANCE_ROLE_KEYS_V1)
  const strategyKey = enumValue(value.strategyKey, DESIGN_ASSISTANCE_STRATEGY_KEYS_V1)
  const status = enumValue(value.status, DESIGN_ASSISTANCE_STATUSES_V1)
  const failureCode = value.failureCode === undefined
    ? undefined
    : enumValue(value.failureCode, DESIGN_ASSISTANCE_FAILURE_CODES_V1)

  if (value.version !== DESIGN_ASSISTANCE_CONTRACT_V1_VERSION) errors.push("version no es valida.")
  if (!roleKey) errors.push("roleKey no es valido.")
  if (!strategyKey) errors.push("strategyKey no es valido.")
  if (!isProviderModelKey(value.providerKey)) errors.push("providerKey no es valido.")
  if (!isProviderModelKey(value.modelKey)) errors.push("modelKey no es valido.")
  if (!status) errors.push("status no es valido.")
  if (typeof value.inputFingerprint !== "string" || !SHA256_HEX_PATTERN.test(value.inputFingerprint)) {
    errors.push("inputFingerprint no es valido.")
  }

  const hasOutput = value.outputFingerprint !== undefined
  if (hasOutput && (typeof value.outputFingerprint !== "string" || !SHA256_HEX_PATTERN.test(value.outputFingerprint))) {
    errors.push("outputFingerprint no es valido.")
  }

  if ((status === "requested" || status === "failed") && hasOutput) {
    errors.push(`${status} no debe incluir outputFingerprint.`)
  }

  if ((status === "applied" || status === "rejected") && !hasOutput) {
    errors.push(`${status} requiere outputFingerprint.`)
  }

  if (status !== "failed" && value.failureCode !== undefined) {
    errors.push("failureCode solo se permite con status failed.")
  }

  if (value.failureCode !== undefined && !failureCode) {
    errors.push("failureCode no es valido.")
  }

  if (errors.length || !roleKey || !strategyKey || !status) return { ok: false, errors }

  return {
    ok: true,
    value: {
      version: DESIGN_ASSISTANCE_CONTRACT_V1_VERSION,
      roleKey,
      strategyKey,
      providerKey: value.providerKey as string,
      modelKey: value.modelKey as string,
      status,
      inputFingerprint: value.inputFingerprint as string,
      ...(typeof value.outputFingerprint === "string" ? { outputFingerprint: value.outputFingerprint } : {}),
      ...(failureCode ? { failureCode } : {}),
    },
  }
}

export function createDesignAssistanceInputFingerprintV1(request: DesignAssistanceRequestV1) {
  const validation = validateDesignAssistanceRequestV1(request)
  if (validation.ok === false) {
    throw new Error(`DesignAssistanceRequestV1 invalido: ${validation.errors.join(" ")}`)
  }

  const { version, roleKey, strategyKey, context, constraints } = validation.value
  return hashCanonical({
    version,
    roleKey,
    strategyKey,
    context,
    ...(constraints ? { constraints } : {}),
  })
}

export function createDesignAssistanceOutputFingerprintV1(proposal: DesignAssistanceProposalV1) {
  const validation = validateDesignAssistanceProposalV1(proposal)
  if (validation.ok === false) {
    throw new Error(`DesignAssistanceProposalV1 invalido: ${validation.errors.join(" ")}`)
  }

  return hashCanonical(validation.value)
}
