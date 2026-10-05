import {
  BUSINESS_FIELDS_PROP,
  BUSINESS_FIELDS_SEO_KEY,
  BUSINESS_FIELDS_TREE_KEY,
  BUSINESS_SOCIAL_NETWORKS_V1,
  type BusinessFieldBindingV1,
  type BusinessFieldBindingsV1,
  type BusinessFieldsSeoV1,
  type BusinessFieldsV1,
} from "@/lib/commercial/business-fields"
import type { EditorNode, EditorTree } from "@/types/editor"

import type { BusinessFactsV1 } from "./business-facts"
import { COMMERCIAL_EMPTY_TEXT_V1 } from "./empty-states"

/**
 * CV1-3: attach Business Fields bindings to a freshly compiled demo-shape
 * customer page. This runs ONCE, at compile time, on a tree whose business
 * strings were just produced by the resolver from the customer's facts, so
 * each binding is fixed by (section role x exact resolver output):
 *
 *  - navigation  : siteNav brand title, logo slot (when the design shows a
 *                  logo), CTA link,
 *  - hero        : the standalone business-name label (eyebrow),
 *  - footer/contact : the business name heading, "WhatsApp: <n>" /
 *                  "Teléfono: <n>" / "Correo: <e>" / "Dirección: <a>" /
 *                  "Horario: <h>" lines, plain address/hours lines,
 *  - any section : wa.me / tel: / mailto: / social buttons whose href is
 *                  exactly the resolver's link for that fact.
 *
 * Prose that merely mentions the business name is design CONTENT and stays
 * unbound. After compile nothing is ever inferred from text again: updates
 * follow the recorded bindings only.
 */

export interface BusinessBindingContextV1 {
  /** The customer's REAL fields (the authority's initial value). */
  fields: BusinessFieldsV1
  /** Values as the compiled page shows them (shaped facts: empty states included). */
  shown: { hours?: string; address?: string }
  /** The design reserves a logo slot in its navigation. */
  showLogo: boolean
  /** The page's resolver SEO (built from real facts). */
  seo?: { title?: string; description?: string }
}

const ROLE_OF_TOKEN = (token: unknown) => (typeof token === "string" ? token.split("|")[0] : undefined)
/** Sections that show business details as standalone lines. */
const DETAIL_ROLES = new Set(["footer", "contact"])
/** Sections whose fact cards may show the plain hours/address value ("Horario de atención", "Ubicación"). */
const FACT_ROLES = new Set(["footer", "contact", "features"])
/** Sections that show the business name as a standalone label (hero eyebrow, footer/contact brand). */
const NAME_ROLES = new Set(["footer", "contact", "hero"])

/** Initial authority from the customer's real facts (digits already normalized by the intake). */
export function businessFieldsFromFactsV1(facts: BusinessFactsV1): BusinessFieldsV1 {
  const contact = facts.evidence.contact
  return {
    version: 1,
    businessName: facts.businessName,
    ...(facts.assets.logo ? { logo: facts.assets.logo.src } : {}),
    ...(contact?.phone ? { phone: contact.phone } : {}),
    ...(contact?.whatsapp ? { whatsapp: contact.whatsapp } : {}),
    ...(contact?.email ? { email: contact.email } : {}),
    ...(facts.address ? { address: facts.address } : {}),
    ...(facts.hours ? { hours: facts.hours } : {}),
    social: Object.fromEntries(facts.social.map((entry) => [entry.network, entry.url])),
  }
}

function sectionRoleByNode(tree: EditorTree): Map<string, string | undefined> {
  const roles = new Map<string, string | undefined>()
  const visit = (id: string, role: string | undefined) => {
    const node = tree.nodes[id]
    if (!node || roles.has(id)) return
    roles.set(id, role)
    node.children.forEach((child) => visit(child, role))
  }
  for (const id of tree.nodes[tree.rootId]?.children ?? []) visit(id, ROLE_OF_TOKEN(tree.nodes[id]?.props.compositionToken))
  return roles
}

function whatsappBinding(href: string, fields: BusinessFieldsV1): BusinessFieldBindingV1 | undefined {
  if (!fields.whatsapp) return undefined
  const base = `https://wa.me/${fields.whatsapp}`
  if (href === base) return { field: "whatsapp", format: "whatsappLink" }
  if (!href.startsWith(`${base}?text=`)) return undefined
  let message: string
  try {
    message = decodeURIComponent(href.slice(base.length + 6))
  } catch {
    return undefined
  }
  return { field: "whatsapp", format: "whatsappLink", message: message.split(fields.businessName).join("{businessName}") }
}

function linkBinding(href: unknown, fields: BusinessFieldsV1): BusinessFieldBindingV1 | undefined {
  if (typeof href !== "string" || !href) return undefined
  const whatsapp = whatsappBinding(href, fields)
  if (whatsapp) return whatsapp
  if (fields.phone && href === `tel:${fields.phone}`) return { field: "phone", format: "telLink" }
  if (fields.email && href === `mailto:${fields.email}`) return { field: "email", format: "mailtoLink" }
  for (const network of BUSINESS_SOCIAL_NETWORKS_V1) {
    if (fields.social[network] && href === fields.social[network]) return { field: `social.${network}`, format: "url" }
  }
  return undefined
}

function textBinding(text: unknown, role: string, ctx: BusinessBindingContextV1): BusinessFieldBindingV1 | undefined {
  if (typeof text !== "string" || !text) return undefined
  const { fields, shown } = ctx
  // A node that IS the name (not prose that mentions it) represents the field.
  if (NAME_ROLES.has(role) && text === fields.businessName) return { field: "businessName", format: "text", template: "{value}" }
  if (!DETAIL_ROLES.has(role)) {
    if (!FACT_ROLES.has(role)) return undefined
    if (shown.address && text === shown.address) return { field: "address", format: "text", template: "{value}", emptyValue: COMMERCIAL_EMPTY_TEXT_V1.address }
    if (shown.hours && text === shown.hours) return { field: "hours", format: "text", template: "{value}", emptyValue: COMMERCIAL_EMPTY_TEXT_V1.hours }
    return undefined
  }
  if (text === fields.businessName) return { field: "businessName", format: "text", template: "{value}" }
  const labelled: Array<[string, BusinessFieldBindingV1["field"], string | undefined, string | undefined]> = [
    ["WhatsApp: ", "whatsapp", fields.whatsapp, undefined],
    ["Teléfono: ", "phone", fields.phone, undefined],
    ["Correo: ", "email", fields.email, undefined],
    ["Dirección: ", "address", shown.address, COMMERCIAL_EMPTY_TEXT_V1.address],
    ["Horario: ", "hours", shown.hours, COMMERCIAL_EMPTY_TEXT_V1.hours],
  ]
  for (const [label, field, value, emptyValue] of labelled) {
    if (value && text === `${label}${value}`) return { field, format: "text", template: `${label}{value}`, ...(emptyValue ? { emptyValue } : {}) }
  }
  if (shown.address && text === shown.address) return { field: "address", format: "text", template: "{value}", emptyValue: COMMERCIAL_EMPTY_TEXT_V1.address }
  if (shown.hours && text === shown.hours) return { field: "hours", format: "text", template: "{value}", emptyValue: COMMERCIAL_EMPTY_TEXT_V1.hours }
  return undefined
}

function withBindings(node: EditorNode, bindings: BusinessFieldBindingsV1): EditorNode {
  return Object.keys(bindings).length ? { ...node, props: { ...node.props, [BUSINESS_FIELDS_PROP]: bindings } } : node
}

export function annotateCommercialBusinessBindingsV1(tree: EditorTree, ctx: BusinessBindingContextV1): EditorTree {
  const roles = sectionRoleByNode(tree)
  const nodes: Record<string, EditorNode> = {}
  for (const [id, node] of Object.entries(tree.nodes)) {
    const role = roles.get(id)
    const bindings: BusinessFieldBindingsV1 = {}
    if (node.type === "siteNav") {
      if (node.props.title === ctx.fields.businessName) bindings.title = { field: "businessName", format: "text", template: "{value}" }
      if (ctx.showLogo) bindings.logoSrc = { field: "logo", format: "imageSrc" }
      const cta = linkBinding(node.props.ctaHref, ctx.fields)
      if (cta) bindings.ctaHref = cta
    } else if (node.type === "ctaButton") {
      const link = linkBinding(node.props.href, ctx.fields)
      if (link) bindings.href = link
    } else if ((node.type === "heading" || node.type === "text") && role && (FACT_ROLES.has(role) || NAME_ROLES.has(role))) {
      const key = node.type === "heading" ? "text" : "content"
      const text = textBinding(node.props[key], role, ctx)
      if (text) bindings[key] = text
    }
    nodes[id] = withBindings(node, bindings)
  }

  const seoTemplate = (value: string | undefined) =>
    value && value.includes(ctx.fields.businessName) ? value.split(ctx.fields.businessName).join("{businessName}") : undefined
  const seo: BusinessFieldsSeoV1 = {
    ...(seoTemplate(ctx.seo?.title) ? { title: seoTemplate(ctx.seo?.title) } : {}),
    ...(seoTemplate(ctx.seo?.description) ? { description: seoTemplate(ctx.seo?.description) } : {}),
  }

  return {
    ...tree,
    nodes,
    [BUSINESS_FIELDS_TREE_KEY]: ctx.fields,
    ...(Object.keys(seo).length ? { [BUSINESS_FIELDS_SEO_KEY]: seo } : {}),
  } as EditorTree
}
