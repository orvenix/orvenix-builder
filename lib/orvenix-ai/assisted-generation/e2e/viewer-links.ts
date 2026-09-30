import { parseInternalPageLink } from "@/lib/builder-core/tree/pageLinks"
import type { EditorTree } from "@/types/editor"

/**
 * FULL-SITE-5A: DEV/E2E-ONLY link adapter for the assisted comparison viewer.
 *
 * Generated trees keep the canonical `page:<slug>` contract. PublicRenderer
 * resolves that contract from the pathname (`/p/...` published, else preview
 * -> `/preview/<siteId>?page=<slug>`), and the viewer's synthetic siteId has
 * no preview route, so every internal link was dead there. The viewer hands
 * PublicRenderer a COPY of the tree whose internal hrefs point at the viewer
 * itself. The stored artifact, the compiler output and the renderer contract
 * are untouched; viewer routes never leave this module and its viewer page.
 *
 * Resolution is exact against the artifact's own page universe -- no fuzzy
 * matching. An internal target outside that universe becomes "#" (inert),
 * never a guessed route. Anchors, external URLs, mailto:/tel: and anything
 * else pass through unchanged.
 */

export const ASSISTED_VIEWER_BASE_PATH_V1 = "/dev-assisted-generation-e2e/view"

export type AssistedViewerVariantV1 = string

export function buildAssistedViewerPageHrefV1(variant: AssistedViewerVariantV1, slug: string): string {
  return `${ASSISTED_VIEWER_BASE_PATH_V1}/${variant}/${encodeURIComponent(slug)}`
}

export const UNRESOLVED_INTERNAL_HREF_V1 = "#"

/** Internal page slug an href targets, or null when it is not an internal page link. */
export function internalPageSlugOfHrefV1(href: string): string | null {
  const trimmed = href.trim()
  const pageSlug = parseInternalPageLink(trimmed)
  if (pageSlug) return pageSlug
  // Site-relative page paths ("/", "/productos"); "//host" is protocol-relative, not internal.
  if (trimmed === "/") return "home"
  const match = /^\/([^/?#]+)\/?$/.exec(trimmed)
  if (!match || trimmed.startsWith("//")) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export interface AssistedViewerLinkStatsV1 {
  internal: number
  resolved: number
  dead: string[]
}

export function resolveAssistedViewerHrefV1(
  href: string,
  variant: AssistedViewerVariantV1,
  pageSlugs: ReadonlySet<string>,
): { href: string; internal: boolean; resolved: boolean; slug: string | null } {
  // COMMERCE-6: dynamic product-detail targets need the store runtime (DB); the artifact viewer has none -> inert.
  if (/^product(?:-ref)?:/.test(href.trim())) return { href: UNRESOLVED_INTERNAL_HREF_V1, internal: false, resolved: false, slug: null }
  const slug = internalPageSlugOfHrefV1(href)
  if (slug === null) return { href, internal: false, resolved: false, slug: null }
  if (!pageSlugs.has(slug)) return { href: UNRESOLVED_INTERNAL_HREF_V1, internal: true, resolved: false, slug }
  return { href: buildAssistedViewerPageHrefV1(variant, slug), internal: true, resolved: true, slug }
}

const isHrefKey = (key: string) => key === "href" || key.endsWith("Href")

/** Returns a rewritten copy of `tree` (never mutates it) plus link stats. */
export function rewriteTreeForAssistedViewerV1(
  tree: EditorTree,
  variant: AssistedViewerVariantV1,
  pageSlugs: ReadonlySet<string>,
): { tree: EditorTree; stats: AssistedViewerLinkStatsV1 } {
  const stats: AssistedViewerLinkStatsV1 = { internal: 0, resolved: 0, dead: [] }

  const rewrite = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(rewrite)
    if (!value || typeof value !== "object") return value
    const out: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "string" && isHrefKey(key)) {
        const result = resolveAssistedViewerHrefV1(entry, variant, pageSlugs)
        if (result.internal) {
          stats.internal += 1
          if (result.resolved) stats.resolved += 1
          else stats.dead.push(entry)
        }
        out[key] = result.href
      } else {
        out[key] = rewrite(entry)
      }
    }
    return out
  }

  const nodes: EditorTree["nodes"] = {}
  for (const [id, node] of Object.entries(tree.nodes)) {
    nodes[id] = { ...node, props: rewrite(node.props) as typeof node.props }
  }
  return { tree: { ...tree, nodes }, stats }
}
