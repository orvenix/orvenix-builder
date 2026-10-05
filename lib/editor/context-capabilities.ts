import { safeUrlV1 } from "@/lib/security/html-sanitizer"
import { nodeBusinessBindingsV1 } from "@/lib/commercial/business-fields"
import type { EditorNode, EditorTree, NodeId } from "@/types/editor"

import { getNodeLabel, isMovableSection } from "./selection-model"

/**
 * VE-2: what the customer may edit on the selected node, derived from the
 * node itself (pure, editor-only). The context bar renders actions from
 * these capabilities; every mutation then goes through the canonical store
 * actions (updateNodeProps / reorderChildren / duplicateNode / removeNode /
 * openAssetPicker), so history, dirty state and persistence are unchanged.
 *
 * Only bounded semantic choices are offered -- never CSS, classes, pixel
 * sizes, coordinates or raw colours.
 */

export type ContextOption<T extends string> = { value: T; label: string }

export const ALIGN_OPTIONS: ReadonlyArray<ContextOption<"left" | "center" | "right">> = [
  { value: "left", label: "Izquierda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
]

/** CtaButton variants offered to customers ("danger" is not a marketing style). */
export const BUTTON_VARIANT_OPTIONS: ReadonlyArray<ContextOption<"primary" | "secondary" | "ghost">> = [
  { value: "primary", label: "Principal" },
  { value: "secondary", label: "Secundario" },
  { value: "ghost", label: "Discreto" },
]

export const IMAGE_FIT_OPTIONS: ReadonlyArray<ContextOption<"cover" | "contain">> = [
  { value: "cover", label: "Rellenar" },
  { value: "contain", label: "Ajustar completa" },
]

export type ProtectedReason = "commerce" | "data-bound"

export interface NodeEditCapabilities {
  label: string
  /** Read-only for the visual editor (authoritative data lives elsewhere). */
  protected?: ProtectedReason
  text?: { key: "text" | "content" | "label" }
  link?: { key: "href" }
  image?: { srcKey: "src"; altKey: "alt" }
  align?: boolean
  buttonVariant?: boolean
  imageFit?: boolean
  navigation?: boolean
  section?: { movable: boolean; removable: boolean }
}

const TEXT_KEY: Record<string, "text" | "content" | "label"> = { heading: "text", text: "content", ctaButton: "label" }

/** Prop names that carry commerce/catalog authority wherever they appear. */
const COMMERCE_AUTHORITY_PROPS = ["productId", "variantId", "sku", "priceMxn", "price", "stock", "inventory", "storeBinding", "checkoutAmount"]

/**
 * Commerce blocks (store-*, ec-*) and any node carrying catalog identity
 * render AUTHORITATIVE data (price, stock, SKU, variant, product id). The
 * visual editor never edits them; catalog management does.
 */
export function isCommerceAuthoritativeNode(node: EditorNode | undefined): boolean {
  if (!node) return false
  if (node.type.startsWith("store-") || node.type.startsWith("ec-")) return true
  return COMMERCE_AUTHORITY_PROPS.some((key) => key in node.props)
}

/** Link props a Business Fields binding may own without owning the node's text. */
const BUSINESS_LINK_PROPS = new Set(["href"])

/**
 * Nodes whose visible values come from a data binding (CMS/catalog) instead
 * of their own props -- including CV1-3 Business Fields text bindings (the
 * name, contact lines, navigation brand): those change in the Business panel.
 */
export function isDataBoundNode(node: EditorNode | undefined): boolean {
  const bindings = node?.props._bindings
  if (bindings && typeof bindings === "object" && Object.keys(bindings as Record<string, unknown>).length > 0) return true
  return Object.keys(nodeBusinessBindingsV1(node)).some((prop) => !BUSINESS_LINK_PROPS.has(prop))
}

export function getProtectedReason(node: EditorNode | undefined): ProtectedReason | undefined {
  if (isCommerceAuthoritativeNode(node)) return "commerce"
  if (isDataBoundNode(node)) return "data-bound"
  return undefined
}

export function getNodeEditCapabilities(tree: EditorTree, id: NodeId): NodeEditCapabilities {
  const node = tree.nodes[id]
  const label = getNodeLabel(tree, id)
  if (!node || id === tree.rootId) return { label }
  const protectedReason = getProtectedReason(node)
  if (protectedReason) return { label, protected: protectedReason }
  if (node.locked) return { label }

  switch (node.type) {
    case "heading":
    case "text":
      return { label, text: { key: TEXT_KEY[node.type] }, align: true }
    case "ctaButton":
      // CV1-3: a button whose link is a Business Field (WhatsApp, phone, email, social) keeps
      // its editable label; the link itself changes from the Business panel.
      return nodeBusinessBindingsV1(node).href
        ? { label, text: { key: "label" }, buttonVariant: true }
        : { label, text: { key: "label" }, link: { key: "href" }, buttonVariant: true }
    case "image":
      return { label, image: { srcKey: "src", altKey: "alt" }, imageFit: true }
    case "siteNav":
      return { label, navigation: true }
    case "section": {
      const movable = isMovableSection(tree, id)
      return movable ? { label, section: { movable, removable: true } } : { label }
    }
    default:
      return { label }
  }
}

/* ------------------------------------------------------------------ */
/* Safe destinations and image sources                                 */
/* ------------------------------------------------------------------ */

const CUSTOMER_LINK_SCHEMES: ReadonlySet<string> = new Set(["https", "http", "mailto", "tel"])

/**
 * A customer-entered button/menu destination, or null when unsafe/invalid.
 * Allowed: an existing page (`page:<slug>`), an in-page anchor (`#id`),
 * https/http URLs, mailto: and tel:. Never javascript:, data:, vbscript:
 * or any other scheme (control-character tricks are stripped first).
 */
export function sanitizeCustomerHrefV1(value: unknown, pageSlugs: readonly string[]): string | null {
  if (typeof value !== "string") return null
  const href = value.trim()
  if (!href || href.length > 2048) return null
  if (href.startsWith("page:")) {
    const slug = href.slice(5)
    return pageSlugs.includes(slug) ? href : null
  }
  if (/^#[A-Za-z][\w-]*$/.test(href)) return href
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(href.replace(/[\u0000- \u007f-\u009f]/g, ""))
  if (!scheme) return null
  const safe = safeUrlV1(href, CUSTOMER_LINK_SCHEMES)
  if (!safe) return null
  if ((scheme[1].toLowerCase() === "https" || scheme[1].toLowerCase() === "http") && !/^https?:\/\/[^\s/?#]+[^\s]*$/i.test(safe)) return null
  if (scheme[1].toLowerCase() === "mailto" && !/^mailto:[^\s@]+@[^\s@]+$/i.test(safe)) return null
  if (scheme[1].toLowerCase() === "tel" && !/^tel:\+?[0-9\s()-]{6,20}$/.test(safe)) return null
  return safe
}

const DATA_IMAGE_RE = /^data:image\/(png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/

/**
 * Image sources the editor may write into an image node: https URLs,
 * site-relative paths (eg. /uploads/..., /commercial-demo/...) and the
 * base64 raster images produced by the existing editor upload. Never
 * javascript:, svg/html data URLs or protocol-relative hosts.
 */
export function isSafeEditorImageSrcV1(value: unknown): value is string {
  if (typeof value !== "string") return false
  // Exact value only (it is written as-is): no surrounding or embedded whitespace.
  const src = value
  if (!src || /\s/.test(src)) return false
  if (DATA_IMAGE_RE.test(src)) return true
  if (src.length > 2048) return false
  return /^https:\/\/[^/\s]+\/\S*$/i.test(src) || /^\/(?!\/)[^\\\s]+$/.test(src)
}

/* ------------------------------------------------------------------ */
/* Navigation labels (SiteNav `labelOverrides`, one "slug=Label" per line) */
/* ------------------------------------------------------------------ */

export function parseNavLabelOverrides(value: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (typeof value !== "string") return out
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const separator = trimmed.includes("=") ? "=" : ":"
    const [rawKey, ...rest] = trimmed.split(separator)
    const key = rawKey?.trim().toLowerCase()
    const label = rest.join(separator).trim()
    if (key && label) out[key] = label
  }
  return out
}

/** Labels only -- page slugs (route identity) come from the site's pages and are never edited here. */
export function serializeNavLabelOverrides(labels: Record<string, string>, pageSlugs: readonly string[]): string {
  return pageSlugs
    .filter((slug) => typeof labels[slug] === "string" && labels[slug].trim())
    .map((slug) => `${slug}=${labels[slug].replace(/[\r\n=]+/g, " ").trim().slice(0, 40)}`)
    .join("\n")
}
