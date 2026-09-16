import { createHash } from "crypto"

import { INTERNAL_PAGE_LINK_PREFIX } from "@/lib/builder-core/tree/pageLinks"
import type { EditorTree, GlobalTheme } from "@/types/editor"
import { validateTree } from "@/types/validateTree"

export const SITE_CREATION_PLAN_V2_VERSION = 2

export interface SiteCreationPlanV2Identity {
  name: string
  industry?: string
  location?: string
  description?: string
}

export interface SiteCreationPlanV2NavigationItem {
  label: string
  slug: string
  href: string
}

export interface SiteCreationPlanV2Page {
  slug: string
  name: string
  isHome: boolean
  seo: {
    title: string
    description: string
  }
  tree: EditorTree
  treeHash: string
}

export interface SiteCreationPlanV2Quality {
  score: number
  warnings: string[]
  summary: string
}

export interface SiteCreationPlanV2 {
  version: typeof SITE_CREATION_PLAN_V2_VERSION
  identity: SiteCreationPlanV2Identity
  theme: GlobalTheme
  navigation: SiteCreationPlanV2NavigationItem[]
  pages: SiteCreationPlanV2Page[]
  quality: SiteCreationPlanV2Quality
}

export interface SiteCreationPlanV2ValidationLimits {
  maxPages: number
  maxBytes: number
}

export type SiteCreationPlanV2ValidationResult =
  | {
      ok: true
      plan: SiteCreationPlanV2
      planHash: string
      byteLength: number
      warnings: string[]
    }
  | {
      ok: false
      errors: string[]
      warnings: string[]
    }

export const SITE_CREATION_PLAN_V2_DEFAULT_LIMITS: SiteCreationPlanV2ValidationLimits = {
  maxPages: 12,
  maxBytes: 1_000_000,
}

const HOME_SLUG = "home"
const HASH_RE = /^[a-f0-9]{64}$/
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"])
const ARRAY_INDEX_RE = /^(0|[1-9]\d*)$/

type StrictJson = null | boolean | string | number | StrictJson[] | { [key: string]: StrictJson }

type StrictJsonResult =
  | { ok: true; value: StrictJson }
  | { ok: false; errors: string[] }

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function formatPath(path: string, key: string | number) {
  return typeof key === "number" ? `${path}[${key}]` : `${path}.${key}`
}

function isArrayIndexKey(key: string, length: number) {
  if (!ARRAY_INDEX_RE.test(key)) return false
  const index = Number(key)
  return Number.isSafeInteger(index) && index >= 0 && index < length
}

function inspectStrictJson(value: unknown, path = "$", ancestors = new WeakSet<object>()): StrictJsonResult {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return { ok: true, value: value as StrictJson }
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false, errors: [`${path}: numero no finito.`] }
    }

    if (Object.is(value, -0)) {
      return { ok: false, errors: [`${path}: -0 no es JSON canonico permitido.`] }
    }

    return { ok: true, value }
  }

  if (typeof value === "undefined") {
    return { ok: false, errors: [`${path}: undefined no es JSON valido.`] }
  }

  if (typeof value === "bigint") {
    return { ok: false, errors: [`${path}: BigInt no es JSON valido.`] }
  }

  if (typeof value === "function") {
    return { ok: false, errors: [`${path}: funcion no es JSON valido.`] }
  }

  if (typeof value === "symbol") {
    return { ok: false, errors: [`${path}: simbolo no es JSON valido.`] }
  }

  if (!value || typeof value !== "object") {
    return { ok: false, errors: [`${path}: valor no JSON invalido.`] }
  }

  if (ancestors.has(value)) {
    return { ok: false, errors: [`${path}: referencia circular.`] }
  }

  ancestors.add(value)

  if (Array.isArray(value)) {
    const errors: string[] = []
    const descriptors = Object.getOwnPropertyDescriptors(value)
    const symbolKeys = Object.getOwnPropertySymbols(value)

    if (symbolKeys.length > 0) {
      errors.push(`${path}: propiedades simbolo no permitidas.`)
    }

    for (const key of Object.keys(descriptors)) {
      if (key === "length") continue

      const descriptor = descriptors[key]
      if (!descriptor) continue

      if (!isArrayIndexKey(key, value.length)) {
        errors.push(`${path}: propiedad de array no canonica ${key}.`)
        continue
      }

      if (!descriptor.enumerable) {
        errors.push(`${formatPath(path, key)}: propiedad no enumerable.`)
      }

      if ("get" in descriptor || "set" in descriptor) {
        errors.push(`${formatPath(path, key)}: accessors no permitidos.`)
      }
    }

    const output: StrictJson[] = []
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index)) {
        errors.push(`${path}[${index}]: array con hueco no permitido.`)
        continue
      }

      const result = inspectStrictJson(value[index], `${path}[${index}]`, ancestors)
      if (result.ok) output.push(result.value)
      else if ("errors" in result) errors.push(...result.errors)
    }

    ancestors.delete(value)
    return errors.length > 0 ? { ok: false, errors } : { ok: true, value: output }
  }

  if (!isPlainRecord(value)) {
    ancestors.delete(value)
    return { ok: false, errors: [`${path}: objeto no plano o prototipo no permitido.`] }
  }

  const errors: string[] = []
  const output: Record<string, StrictJson> = {}
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const symbolKeys = Object.getOwnPropertySymbols(value)

  if (symbolKeys.length > 0) {
    errors.push(`${path}: propiedades simbolo no permitidas.`)
  }

  for (const key of Object.keys(descriptors).sort((a, b) => a.localeCompare(b))) {
    const descriptor = descriptors[key]
    if (!descriptor) continue

    if (UNSAFE_KEYS.has(key)) {
      errors.push(`${formatPath(path, key)}: clave reservada no permitida.`)
      continue
    }

    if (!descriptor.enumerable) {
      errors.push(`${formatPath(path, key)}: propiedad no enumerable.`)
      continue
    }

    if ("get" in descriptor || "set" in descriptor) {
      errors.push(`${formatPath(path, key)}: accessors no permitidos.`)
      continue
    }

    const result = inspectStrictJson(descriptor.value, formatPath(path, key), ancestors)
    if (result.ok) output[key] = result.value
    else if ("errors" in result) errors.push(...result.errors)
  }

  ancestors.delete(value)
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: output }
}

function assertStrictJson(value: unknown): StrictJson {
  const result = inspectStrictJson(value)
  if (!result.ok) {
    throw new Error(("errors" in result ? result.errors : []).join(" "))
  }

  return result.value
}

function stableObject(value: StrictJson): StrictJson {
  if (Array.isArray(value)) return value.map(stableObject)

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableObject(entry)]),
    ) as StrictJson
  }

  return value
}

function stableStringifyStrict(value: unknown): string {
  return JSON.stringify(stableObject(assertStrictJson(value)))
}

function cloneStrictJson<T>(value: T): T {
  return JSON.parse(stableStringifyStrict(value)) as T
}

function byteLengthFromCanonicalJson(canonicalJson: string): number {
  return Buffer.byteLength(canonicalJson, "utf8")
}

function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, maxLength)
  return normalized || undefined
}

function normalizeRequiredText(value: unknown, maxLength: number): string {
  return normalizeOptionalText(value, maxLength) ?? ""
}

function sameStableValue(a: unknown, b: unknown): boolean {
  try {
    return stableStringifyStrict(a) === stableStringifyStrict(b)
  } catch {
    return false
  }
}

export function normalizeSiteCreationSlug(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || HOME_SLUG
}

export function buildSiteCreationHref(slug: string): string {
  return `${INTERNAL_PAGE_LINK_PREFIX}${normalizeSiteCreationSlug(slug)}`
}

export function calculateSiteCreationTreeHash(tree: EditorTree): string {
  return createHash("sha256")
    .update(stableStringifyStrict(tree))
    .digest("hex")
}

export function calculateSiteCreationPlanHash(plan: SiteCreationPlanV2): string {
  return createHash("sha256")
    .update(stableStringifyStrict(plan))
    .digest("hex")
}

export function syncSiteCreationTreeTheme(tree: EditorTree, theme: GlobalTheme): EditorTree {
  const nextTree = validateTree(cloneStrictJson(tree))
  const nextTheme = cloneStrictJson(theme)

  return {
    ...nextTree,
    theme: nextTheme,
    globalTheme: cloneStrictJson(nextTheme),
  }
}

/** Detecta solo el discriminador de SiteCreationPlanV2. No valida ni autoriza el plan. */
export function hasSiteCreationPlanV2Discriminator(value: unknown): value is SiteCreationPlanV2 {
  if (!isPlainRecord(value)) return false

  return (
    value.version === SITE_CREATION_PLAN_V2_VERSION &&
    isPlainRecord(value.identity) &&
    isPlainRecord(value.theme) &&
    Array.isArray(value.navigation) &&
    Array.isArray(value.pages) &&
    isPlainRecord(value.quality)
  )
}


/** Detecta solo la forma legacy V1. No valida ni autoriza el plan. */
export function hasLegacySiteCreationPlanDiscriminator(value: unknown): boolean {
  if (!isPlainRecord(value) || value.version === SITE_CREATION_PLAN_V2_VERSION) return false

  return isPlainRecord(value.snapshot) && isPlainRecord(value.before) && isPlainRecord(value.after)
}


function collectNormalizedSlugCollisions(items: Array<{ rawSlug: unknown; label: string }>) {
  const seen = new Map<string, string>()
  const errors: string[] = []

  for (const item of items) {
    if (typeof item.rawSlug !== "string") continue

    const normalizedSlug = normalizeSiteCreationSlug(item.rawSlug)
    const previous = seen.get(normalizedSlug)

    if (previous && previous !== item.rawSlug) {
      errors.push(`${item.label}: slug normalizado colisiona con ${previous}.`)
      continue
    }

    seen.set(normalizedSlug, item.rawSlug)
  }

  return errors
}

function validateLimits(limits: SiteCreationPlanV2ValidationLimits) {
  const errors: string[] = []

  if (!Number.isInteger(limits.maxPages) || limits.maxPages < 1) {
    errors.push("El limite maximo de paginas es invalido.")
  }

  if (!Number.isInteger(limits.maxBytes) || limits.maxBytes < 1) {
    errors.push("El limite maximo de bytes es invalido.")
  }

  return errors
}

export function validateSiteCreationPlanV2(
  value: unknown,
  limits: SiteCreationPlanV2ValidationLimits,
): SiteCreationPlanV2ValidationResult {
  const errors = validateLimits(limits)
  const warnings: string[] = []
  const strictJson = inspectStrictJson(value)

  if (!strictJson.ok) {
    return {
      ok: false,
      errors: [...errors, ...("errors" in strictJson ? strictJson.errors : [])],
      warnings,
    }
  }

  if (!hasSiteCreationPlanV2Discriminator(value)) {
    return {
      ok: false,
      errors: [...errors, "El plan no cumple el contrato SiteCreationPlanV2."],
      warnings,
    }
  }

  if (!normalizeRequiredText(value.identity.name, 120)) {
    errors.push("La identidad del sitio requiere un nombre.")
  }

  if (value.pages.length < 1) {
    errors.push("El plan debe incluir al menos una pagina.")
  }

  if (value.pages.length > limits.maxPages) {
    errors.push("El plan excede el limite de paginas permitido.")
  }

  if (!isPlainRecord(value.theme)) {
    errors.push("El Theme compartido es invalido.")
  }

  const pageSlugCollisions = collectNormalizedSlugCollisions(
    value.pages.map((page, index) => ({ rawSlug: page.slug, label: `Pagina ${index + 1}` })),
  )
  errors.push(...pageSlugCollisions)

  const slugs = new Set<string>()
  const homePages = value.pages.filter((page) => page.isHome)

  if (homePages.length !== 1) {
    errors.push("El plan debe incluir exactamente una pagina home.")
  }

  if (homePages[0] && homePages[0].slug !== HOME_SLUG) {
    errors.push("La pagina home debe usar el slug canonico home.")
  }

  for (const [index, page] of value.pages.entries()) {
    const prefix = `Pagina ${index + 1}`

    if (!page.slug || page.slug !== normalizeSiteCreationSlug(page.slug)) {
      errors.push(`${prefix}: slug invalido o no normalizado.`)
    }

    if (slugs.has(page.slug)) {
      errors.push(`${prefix}: slug duplicado.`)
    }
    slugs.add(page.slug)

    if (!normalizeRequiredText(page.name, 120)) {
      errors.push(`${prefix}: nombre requerido.`)
    }

    if (!normalizeRequiredText(page.seo?.title, 160) || !normalizeRequiredText(page.seo?.description, 260)) {
      errors.push(`${prefix}: SEO requiere titulo y descripcion.`)
    }

    if (!isPlainRecord(page.tree) || typeof page.tree.rootId !== "string" || !page.tree.rootId.trim() || !isPlainRecord(page.tree.nodes)) {
      errors.push(`${prefix}: EditorTree invalido.`)
      continue
    }

    if (!Object.prototype.hasOwnProperty.call(page.tree.nodes, page.tree.rootId)) {
      errors.push(`${prefix}: rootId no existe en nodes.`)
    }

    const theme = page.tree.theme
    const globalTheme = page.tree.globalTheme

    if (!theme || !globalTheme || !sameStableValue(theme, globalTheme)) {
      errors.push(`${prefix}: theme y globalTheme deben estar sincronizados.`)
    }

    if (!sameStableValue(theme, value.theme)) {
      errors.push(`${prefix}: Theme de pagina no coincide con el Theme compartido.`)
    }

    if (!HASH_RE.test(page.treeHash) || page.treeHash !== calculateSiteCreationTreeHash(page.tree)) {
      errors.push(`${prefix}: treeHash no coincide con el arbol.`)
    }
  }

  const navigationSlugCollisions = collectNormalizedSlugCollisions(
    value.navigation.map((item, index) => ({ rawSlug: item.slug, label: `Navegacion ${index + 1}` })),
  )
  errors.push(...navigationSlugCollisions)

  const navigationSlugs = new Set<string>()
  for (const [index, item] of value.navigation.entries()) {
    const prefix = `Navegacion ${index + 1}`

    if (!normalizeRequiredText(item.label, 80)) {
      errors.push(`${prefix}: label requerido.`)
    }

    if (!item.slug || item.slug !== normalizeSiteCreationSlug(item.slug)) {
      errors.push(`${prefix}: slug invalido o no normalizado.`)
    }

    if (!slugs.has(item.slug)) {
      errors.push(`${prefix}: apunta a una pagina inexistente.`)
    }

    if (navigationSlugs.has(item.slug)) {
      errors.push(`${prefix}: destino duplicado.`)
    }
    navigationSlugs.add(item.slug)

    if (item.href !== buildSiteCreationHref(item.slug)) {
      errors.push(`${prefix}: href interno incoherente.`)
    }
  }

  if (!Number.isFinite(value.quality.score) || Object.is(value.quality.score, -0) || value.quality.score < 0 || value.quality.score > 100) {
    errors.push("El score de calidad debe estar entre 0 y 100.")
  }

  if (typeof value.quality.summary !== "string" || !value.quality.summary.trim()) {
    errors.push("El resumen de calidad es requerido.")
  }

  if (!Array.isArray(value.quality.warnings) || !value.quality.warnings.every((warning) => typeof warning === "string")) {
    errors.push("Las advertencias de calidad deben ser texto.")
  }

  const canonicalJson = stableStringifyStrict(value)
  const canonicalByteLength = byteLengthFromCanonicalJson(canonicalJson)

  if (canonicalByteLength > limits.maxBytes) {
    errors.push("El plan excede el limite de bytes permitido.")
  }


  if (errors.length > 0) {
    return { ok: false, errors, warnings }
  }

  return {
    ok: true,
    plan: JSON.parse(canonicalJson) as SiteCreationPlanV2,
    planHash: createHash("sha256").update(canonicalJson).digest("hex"),
    byteLength: canonicalByteLength,
    warnings,
  }
}

export function normalizeSiteCreationPlanV2(plan: SiteCreationPlanV2): SiteCreationPlanV2 {
  const strictJson = inspectStrictJson(plan)
  if (!strictJson.ok) {
    throw new Error(`SiteCreationPlanV2 invalido: ${("errors" in strictJson ? strictJson.errors : []).join(" ")}`)
  }

  if (!hasSiteCreationPlanV2Discriminator(plan)) {
    throw new Error("SiteCreationPlanV2 invalido: contrato no reconocido.")
  }

  const collisionErrors = collectNormalizedSlugCollisions(
    plan.pages.map((page, index) => ({ rawSlug: page.slug, label: `Pagina ${index + 1}` })),
  )
  collisionErrors.push(
    ...collectNormalizedSlugCollisions(
      plan.navigation.map((item, index) => ({ rawSlug: item.slug, label: `Navegacion ${index + 1}` })),
    ),
  )

  if (collisionErrors.length > 0) {
    throw new Error(`SiteCreationPlanV2 invalido: ${collisionErrors.join(" ")}`)
  }

  const theme = cloneStrictJson(plan.theme)
  const pages = plan.pages.map((page) => {
    const slug = page.isHome ? HOME_SLUG : normalizeSiteCreationSlug(page.slug)
    const tree = syncSiteCreationTreeTheme(page.tree, theme)

    return {
      slug,
      name: normalizeRequiredText(page.name, 120),
      isHome: Boolean(page.isHome),
      seo: {
        title: normalizeRequiredText(page.seo?.title, 160),
        description: normalizeRequiredText(page.seo?.description, 260),
      },
      tree,
      treeHash: calculateSiteCreationTreeHash(tree),
    }
  })

  const pageSlugs = new Set(pages.map((page) => page.slug))
  const navigation = plan.navigation.map((item) => {
    const slug = normalizeSiteCreationSlug(item.slug)

    if (!pageSlugs.has(slug)) {
      throw new Error(`SiteCreationPlanV2 invalido: navegacion apunta a una pagina inexistente (${slug}).`)
    }

    return {
      label: normalizeRequiredText(item.label, 80),
      slug,
      href: buildSiteCreationHref(slug),
    }
  })

  const normalized = {
    version: SITE_CREATION_PLAN_V2_VERSION,
    identity: {
      name: normalizeRequiredText(plan.identity.name, 120),
      industry: normalizeOptionalText(plan.identity.industry, 90),
      location: normalizeOptionalText(plan.identity.location, 120),
      description: normalizeOptionalText(plan.identity.description, 600),
    },
    theme,
    navigation,
    pages,
    quality: {
      score: Number.isFinite(plan.quality.score) && !Object.is(plan.quality.score, -0)
        ? Math.max(0, Math.min(100, plan.quality.score))
        : 0,
      warnings: Array.isArray(plan.quality.warnings)
        ? plan.quality.warnings
            .filter((warning): warning is string => typeof warning === "string")
            .map((warning) => warning.trim().slice(0, 220))
            .filter(Boolean)
            .slice(0, 20)
        : [],
      summary: normalizeRequiredText(plan.quality.summary, 360),
    },
  } satisfies SiteCreationPlanV2

  const result = validateSiteCreationPlanV2(normalized, SITE_CREATION_PLAN_V2_DEFAULT_LIMITS)
  if ("errors" in result) {
    throw new Error(`SiteCreationPlanV2 invalido: `)
  }

  return result.plan
}
