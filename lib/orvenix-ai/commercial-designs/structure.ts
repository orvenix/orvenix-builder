import { createHash } from "crypto"

import type { EditorNode, EditorTree } from "@/types/editor"

/**
 * CV1-1b: the COMPOSED structure of a commercial page -- what makes two
 * sites "the same design": node types, order, nesting, variants, layout and
 * composition props. Content that legitimately differs per business (names,
 * copy, phones, services text, prices, customer images, links) is excluded,
 * and repeated sibling items collapse to their smallest repeating unit, so a
 * business with three services and one with four share a structure while any
 * change of variant, layout, tone or section order does not.
 *
 * The older `structuralFingerprint` (resolved direction + skeleton) stays as
 * is; it cannot see composer decisions, which is how CSC demo/customer drift
 * went unnoticed.
 */

/** Content-bearing props: never part of the structure. */
const CONTENT_PROP_RE =
  /^(?:text|content|label|title|subtitle|eyebrow|description|alt|src|href|url|quote|author|role|name|value|price|caption|placeholder|icon|items|links|labelOverrides|logoSrc|logoUrl|ctaHref|ctaLabel|phone|email|whatsapp|address|hours|seo|creativeCopy|creativeCopyFallback|creativeCopyProvenance|compositionGraphFallback|commercialEmptyState|commercialEmptyPage|commercialDesignFidelity|_businessFields|productId|variantId|sku|stock)$|(?:Href|Url|Src|Label|Text|Title|Caption|Alt)$/

function structuralProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props).sort()) {
    if (CONTENT_PROP_RE.test(key)) continue
    const value = props[key]
    if (value === undefined) continue
    out[key] = value && typeof value === "object" && !Array.isArray(value) ? structuralProps(value as Record<string, unknown>) : value
  }
  return out
}

function nodeSignature(tree: EditorTree, id: string, depth: number, guard: Set<string>): string[] {
  const node: EditorNode | undefined = tree.nodes[id]
  if (!node || guard.has(id)) return []
  guard.add(id)
  const head = `${"  ".repeat(depth)}${node.type} ${JSON.stringify(structuralProps(node.props ?? {}))}`
  const childBlocks = node.children.map((child) => nodeSignature(tree, child, depth + 1, guard).join("\n"))
  guard.delete(id)
  return [head, ...minimalPeriod(childBlocks).flatMap((block) => (block ? block.split("\n") : []))]
}

/**
 * Repeated items collapse to their smallest repeating unit: [A,A,A] -> [A],
 * [A,A,B,B] -> [A,B], [A,B,A,B,A] -> [A,B] (alternating rows), so the NUMBER of services, FAQ
 * entries or contact lines never changes the structure -- a different item
 * shape, order or layout still does.
 */
function minimalPeriod(blocks: string[]): string[] {
  // Runs first ([A,A,B,B] -> [A,B]: eg. footer contact lines then fact lines), then periods.
  const runs = blocks.filter((block, index) => index === 0 || block !== blocks[index - 1])
  for (let period = 1; period < runs.length; period += 1) {
    if (runs.every((block, index) => block === runs[index % period])) return runs.slice(0, period)
  }
  return runs
}

/** Canonical, id-free structure lines of one page tree (root first). */
export function commercialComposedStructureV1(tree: EditorTree): string[] {
  return nodeSignature(tree, tree.rootId, 0, new Set())
}

/** Stable hash of every page's composed structure, keyed by slug. */
export function calculateCommercialComposedFingerprintV1(pages: Array<{ slug: string; tree: EditorTree }>): string {
  const payload = pages.map((page) => ({ slug: page.slug, structure: commercialComposedStructureV1(page.tree) }))
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex")
}
