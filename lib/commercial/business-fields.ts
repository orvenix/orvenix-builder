import type { EditorNode, EditorTree } from "@/types/editor"
import { safeUrlV1 } from "@/lib/security/html-sanitizer"

/**
 * CV1-3 Business Fields V1 -- edit once, update the whole site coherently.
 *
 * Model (no schema change):
 *  - AUTHORITY: `businessFields` on the HOME page tree (SitePage.tree JSON).
 *  - BINDINGS: a node prop that represents a business datum carries
 *    `_businessFields[prop] = { field, format, ... }`, attached when an
 *    Orvenix commercial design is compiled (never inferred later).
 *  - MATERIALIZED VALUES: bound props hold the value derived from the
 *    authority, recomputed on every write path (business update, editor
 *    save, site creation). The renderer and static export stay unchanged.
 *  - REPLICAS: every page tree carries a copy of `businessFields` (and the
 *    legacy `brand` kit mirrors it) for the editor; replicas are rewritten
 *    with the authority and never accepted as input.
 *
 * Business Fields change CONTENT only: materialization never adds, removes,
 * reorders or retypes a node (see assertSameStructureV1).
 */

export const BUSINESS_SOCIAL_NETWORKS_V1 = ["facebook", "instagram", "tiktok", "youtube", "linkedin"] as const
export type BusinessSocialNetworkV1 = (typeof BUSINESS_SOCIAL_NETWORKS_V1)[number]

export const BUSINESS_FIELDS_TREE_KEY = "businessFields"
export const BUSINESS_FIELDS_SEO_KEY = "businessFieldsSeo"
export const BUSINESS_FIELDS_PROP = "_businessFields"

export interface BusinessFieldsV1 {
  version: 1
  businessName: string
  logo?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  hours?: string
  social: Partial<Record<BusinessSocialNetworkV1, string>>
}

export type BusinessFieldKeyV1 =
  | "businessName"
  | "logo"
  | "phone"
  | "whatsapp"
  | "email"
  | "address"
  | "hours"
  | `social.${BusinessSocialNetworkV1}`

export type BusinessFieldBindingV1 =
  /** Text with one `{value}` slot; `emptyValue` fills the slot while the field is empty (an empty state). */
  | { field: BusinessFieldKeyV1; format: "text"; template: string; emptyValue?: string }
  /** wa.me link; `message` may contain `{businessName}`. */
  | { field: "whatsapp"; format: "whatsappLink"; message?: string }
  | { field: "phone"; format: "telLink" }
  | { field: "email"; format: "mailtoLink" }
  | { field: `social.${BusinessSocialNetworkV1}`; format: "url" }
  | { field: "logo"; format: "imageSrc" }

export type BusinessFieldBindingsV1 = Record<string, BusinessFieldBindingV1>

/** Page SEO templates with a `{businessName}` slot. */
export interface BusinessFieldsSeoV1 {
  title?: string
  description?: string
}

const FIELD_KEYS: readonly BusinessFieldKeyV1[] = [
  "businessName", "logo", "phone", "whatsapp", "email", "address", "hours",
  ...BUSINESS_SOCIAL_NETWORKS_V1.map((network) => `social.${network}` as const),
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

/** The business fields a tree carries, or null (legacy / not connected). */
export function readBusinessFieldsV1(tree: Pick<EditorTree, "nodes"> & Record<string, unknown> | null | undefined): BusinessFieldsV1 | null {
  const raw = tree?.[BUSINESS_FIELDS_TREE_KEY]
  if (!isRecord(raw) || raw.version !== 1 || typeof raw.businessName !== "string") return null
  const social: BusinessFieldsV1["social"] = {}
  if (isRecord(raw.social)) {
    for (const network of BUSINESS_SOCIAL_NETWORKS_V1) {
      const url = optionalString(raw.social[network])
      if (url) social[network] = url
    }
  }
  return {
    version: 1,
    businessName: raw.businessName,
    ...(optionalString(raw.logo) ? { logo: raw.logo as string } : {}),
    ...(optionalString(raw.phone) ? { phone: raw.phone as string } : {}),
    ...(optionalString(raw.whatsapp) ? { whatsapp: raw.whatsapp as string } : {}),
    ...(optionalString(raw.email) ? { email: raw.email as string } : {}),
    ...(optionalString(raw.address) ? { address: raw.address as string } : {}),
    ...(optionalString(raw.hours) ? { hours: raw.hours as string } : {}),
    social,
  }
}

export function businessFieldValueV1(fields: BusinessFieldsV1, field: BusinessFieldKeyV1): string {
  if (field.startsWith("social.")) return fields.social[field.slice(7) as BusinessSocialNetworkV1] ?? ""
  return (fields[field as Exclude<BusinessFieldKeyV1, `social.${string}`>] as string | undefined) ?? ""
}

function isBinding(value: unknown): value is BusinessFieldBindingV1 {
  return isRecord(value) && typeof value.field === "string" && (FIELD_KEYS as readonly string[]).includes(value.field) && typeof value.format === "string"
}

export function nodeBusinessBindingsV1(node: Pick<EditorNode, "props"> | undefined): BusinessFieldBindingsV1 {
  const raw = node?.props?.[BUSINESS_FIELDS_PROP]
  if (!isRecord(raw)) return {}
  return Object.fromEntries(Object.entries(raw).filter(([, binding]) => isBinding(binding))) as BusinessFieldBindingsV1
}

/** Value a bound prop must hold for the given fields (undefined = leave the prop as is). */
export function renderBusinessBindingV1(binding: BusinessFieldBindingV1, fields: BusinessFieldsV1): string | undefined {
  const value = businessFieldValueV1(fields, binding.field)
  switch (binding.format) {
    case "text":
      return binding.template.split("{value}").join(value || binding.emptyValue || "")
    case "whatsappLink": {
      if (!value) return undefined
      const message = binding.message?.split("{businessName}").join(fields.businessName)
      return `https://wa.me/${value}${message ? `?text=${encodeURIComponent(message)}` : ""}`
    }
    case "telLink":
      return value ? `tel:${value}` : undefined
    case "mailtoLink":
      return value ? `mailto:${value}` : undefined
    case "url":
      return value || undefined
    case "imageSrc":
      return value || undefined
  }
}

/**
 * Re-derive every bound value from `fields`. Only props named by a binding
 * change (plus the replicas and SEO); node ids, types, children and every
 * other prop are kept, so the design's structure is untouched.
 */
export function materializeBusinessFieldsV1(tree: EditorTree, fields: BusinessFieldsV1): EditorTree {
  const nodes: Record<string, EditorNode> = {}
  for (const [id, node] of Object.entries(tree.nodes)) {
    const bindings = nodeBusinessBindingsV1(node)
    const keys = Object.keys(bindings)
    if (!keys.length) {
      nodes[id] = node
      continue
    }
    const props = { ...node.props }
    for (const key of keys) {
      const next = renderBusinessBindingV1(bindings[key], fields)
      if (next !== undefined) props[key] = next
      else if (bindings[key].format === "imageSrc") delete props[key]
    }
    nodes[id] = { ...node, props }
  }

  const seoTemplates = isRecord(tree[BUSINESS_FIELDS_SEO_KEY]) ? (tree[BUSINESS_FIELDS_SEO_KEY] as BusinessFieldsSeoV1) : undefined
  const fill = (template: string | undefined) => template?.split("{businessName}").join(fields.businessName)
  const seo = seoTemplates
    ? {
        ...(tree.seo ?? {}),
        ...(seoTemplates.title ? { title: fill(seoTemplates.title) } : {}),
        ...(seoTemplates.description ? { description: fill(seoTemplates.description) } : {}),
      }
    : tree.seo

  return {
    ...tree,
    nodes,
    ...(seo ? { seo } : {}),
    [BUSINESS_FIELDS_TREE_KEY]: fields,
    // The legacy brand kit (read by no block) mirrors the authority instead of drifting.
    brand: {
      ...(tree.brand ?? {}),
      businessName: fields.businessName,
      ...(fields.logo ? { logoUrl: fields.logo } : {}),
      contact: {
        ...(tree.brand?.contact ?? {}),
        phone: fields.phone,
        whatsapp: fields.whatsapp,
        email: fields.email,
        address: fields.address,
      },
      social: { ...fields.social },
    },
  } as EditorTree
}

/** How many bound representations each field has in a tree. */
export function countBusinessFieldUsesV1(tree: EditorTree): Partial<Record<BusinessFieldKeyV1, number>> {
  const counts: Partial<Record<BusinessFieldKeyV1, number>> = {}
  for (const node of Object.values(tree.nodes)) {
    for (const binding of Object.values(nodeBusinessBindingsV1(node))) {
      counts[binding.field] = (counts[binding.field] ?? 0) + 1
      if (binding.format === "whatsappLink" && binding.message?.includes("{businessName}")) counts.businessName = (counts.businessName ?? 0) + 1
    }
  }
  return counts
}

/** Fields whose bound representations may show an empty state (and so may be cleared). */
function fieldAllowsEmpty(field: BusinessFieldKeyV1, trees: EditorTree[]): boolean {
  for (const tree of trees) {
    for (const node of Object.values(tree.nodes)) {
      for (const binding of Object.values(nodeBusinessBindingsV1(node))) {
        // Text with an empty state, or a logo slot (the navigation falls back to the name), may be cleared.
        if (binding.field === field && !(binding.format === "text" && binding.emptyValue) && binding.format !== "imageSrc") return false
      }
    }
  }
  return true
}

export type BusinessFieldsPatchV1 = Partial<Omit<BusinessFieldsV1, "version" | "social">> & { social?: Partial<Record<BusinessSocialNetworkV1, string>> }
export type BusinessFieldsErrorsV1 = Partial<Record<BusinessFieldKeyV1, string>>

const EMAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/
const UPLOAD_IMAGE_RE = /^\/uploads\/[A-Za-z0-9._-]+\.(?:jpe?g|png|webp|gif|avif|svg)$/i

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/[<>{}`]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : ""
}

function phoneDigits(value: string): string | null {
  if (!value) return ""
  if (/[a-z]/i.test(value) || !/^[+\d\s().-]+$/.test(value)) return null
  const digits = value.replace(/\D/g, "")
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

/**
 * Validate and normalize an update against the current authority. The same
 * rules the commercial intake uses (digits-only phones, 10-digit MX
 * WhatsApp gets "52", https social links, safe image sources), plus: a field
 * shown in the site cannot be cleared unless its representation has an
 * empty state.
 */
export function normalizeBusinessFieldsUpdateV1(
  current: BusinessFieldsV1,
  patch: BusinessFieldsPatchV1,
  sitePages: EditorTree[],
): { ok: true; fields: BusinessFieldsV1 } | { ok: false; errors: BusinessFieldsErrorsV1 } {
  const errors: BusinessFieldsErrorsV1 = {}
  const next: BusinessFieldsV1 = { ...current, social: { ...current.social } }
  const has = (key: keyof BusinessFieldsPatchV1) => Object.prototype.hasOwnProperty.call(patch, key)

  if (has("businessName")) {
    const name = cleanText(patch.businessName, 120)
    if (!name) errors.businessName = "Escribe el nombre de tu negocio."
    else next.businessName = name
  }
  for (const key of ["phone", "whatsapp"] as const) {
    if (!has(key)) continue
    const digits = phoneDigits(cleanText(patch[key], 40))
    if (digits === null) errors[key] = "Revisa el número: usa de 10 a 15 dígitos."
    else next[key] = key === "whatsapp" && digits.length === 10 ? `52${digits}` : digits || undefined
  }
  if (has("email")) {
    const email = cleanText(patch.email, 160).toLowerCase()
    if (email && !EMAIL_RE.test(email)) errors.email = "Revisa el correo."
    else next.email = email || undefined
  }
  if (has("address")) next.address = cleanText(patch.address, 200) || undefined
  if (has("hours")) next.hours = cleanText(patch.hours, 120) || undefined
  if (has("logo")) {
    const logo = typeof patch.logo === "string" ? patch.logo.trim() : ""
    if (logo && !(UPLOAD_IMAGE_RE.test(logo) || (/^https:\/\//i.test(logo) && safeUrlV1(logo) === logo))) errors.logo = "Elige una imagen de tu biblioteca o un enlace https."
    else next.logo = logo || undefined
  }
  for (const network of BUSINESS_SOCIAL_NETWORKS_V1) {
    if (!patch.social || !Object.prototype.hasOwnProperty.call(patch.social, network)) continue
    const url = typeof patch.social[network] === "string" ? patch.social[network]!.trim() : ""
    if (url && !(/^https:\/\//i.test(url) && safeUrlV1(url) === url && url.length <= 300)) errors[`social.${network}`] = "Usa un enlace que empiece con https://"
    else if (url) next.social[network] = url
    else delete next.social[network]
  }

  for (const field of FIELD_KEYS) {
    if (errors[field] || businessFieldValueV1(next, field) || !businessFieldValueV1(current, field)) continue
    if (!fieldAllowsEmpty(field, sitePages)) errors[field] = "Este dato aparece en tu sitio; no puede quedar vacío."
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, fields: next }
}

/** Business Fields never change structure: same nodes, types and children. */
export function assertSameStructureV1(before: EditorTree, after: EditorTree): void {
  const a = Object.keys(before.nodes).sort()
  const b = Object.keys(after.nodes).sort()
  if (before.rootId !== after.rootId || a.join("|") !== b.join("|")) throw new Error("Business Fields cambiaron la estructura del sitio.")
  for (const id of a) {
    const x = before.nodes[id]
    const y = after.nodes[id]
    if (x.type !== y.type || x.children.join("|") !== y.children.join("|")) throw new Error("Business Fields cambiaron la estructura del sitio.")
  }
}

export interface BusinessFieldsSitePageV1 {
  slug: string
  isHome: boolean
  tree: EditorTree
}

/**
 * Apply one Business Fields update to every page of a site (pure). The
 * authority is the HOME tree's fields; every page -- home included -- is
 * re-materialized from the new value, and each result is checked to keep
 * the exact same structure.
 */
export function applyBusinessFieldsUpdateToSiteV1(
  pages: BusinessFieldsSitePageV1[],
  patch: BusinessFieldsPatchV1,
): { ok: true; fields: BusinessFieldsV1; pages: BusinessFieldsSitePageV1[] } | { ok: false; errors: BusinessFieldsErrorsV1; message?: string } {
  const home = pages.find((page) => page.isHome)
  const current = home ? readBusinessFieldsV1(home.tree) : null
  if (!current) return { ok: false, errors: {}, message: "Este sitio no tiene datos de negocio conectados." }
  const normalized = normalizeBusinessFieldsUpdateV1(current, patch, pages.map((page) => page.tree))
  if (!normalized.ok) return { ok: false, errors: "errors" in normalized ? normalized.errors : {} }
  const updated = pages.map((page) => {
    const tree = materializeBusinessFieldsV1(page.tree, normalized.fields)
    assertSameStructureV1(page.tree, tree)
    return { ...page, tree }
  })
  return { ok: true, fields: normalized.fields, pages: updated }
}

/** Site-wide usage of each field (for the Business panel). */
export function siteBusinessFieldUsesV1(trees: EditorTree[]): Partial<Record<BusinessFieldKeyV1, number>> {
  const total: Partial<Record<BusinessFieldKeyV1, number>> = {}
  for (const tree of trees) {
    for (const [field, count] of Object.entries(countBusinessFieldUsesV1(tree)) as Array<[BusinessFieldKeyV1, number]>) total[field] = (total[field] ?? 0) + count
  }
  return total
}
