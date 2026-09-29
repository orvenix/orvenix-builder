import { randomUUID } from "crypto"
import { getBlockCapability } from "@/lib/orvenix-ai/capabilities"
import type { EditorNode, EditorTree, NodeProps } from "@/types/editor"

/**
 * COMMERCE-1/2A: the ONE cart-shell injection, shared by the compiler
 * (bound cards at generation time) and the COMMERCE-2A confirm-time binder
 * (pending cards bound to freshly provisioned rows). Adds the EXISTING
 * `store-cart-button` + `store-cart-drawer` blocks once per page, right
 * after the navigation section (the root child containing a `siteNav`),
 * ONLY when the page contains a bound `store-product-card`. Idempotent: a
 * page that already has a cart drawer is returned unchanged.
 */

export const STORE_CART_SHELL_DISPLAY_NAME_V1 = "Carrito de la tienda"

function node(type: string, displayName: string, props: NodeProps, children: string[] = []): EditorNode {
  const capability = getBlockCapability(type)
  if (!capability) throw new Error(`Store shell: bloque desconocido "${type}"`)
  return {
    id: `ai-${type}-${randomUUID()}`,
    type,
    displayName,
    props: { ...capability.defaults, ...props },
    children,
    version: capability.version ?? 1,
  }
}

export function isBoundStoreProductCardNodeV1(candidate: EditorNode): boolean {
  return candidate.type === "store-product-card" && typeof candidate.props.productId === "string" && typeof candidate.props.variantId === "string"
}

/** COMMERCE-6: the dynamic detail runtime's block also sells, so it also needs the cart shell. */
export function isStoreProductDetailNodeV1(candidate: EditorNode): boolean {
  return candidate.type === "store-product-detail" && typeof candidate.props.productId === "string"
}

function subtreeHasType(nodes: Record<string, EditorNode>, rootId: string, type: string): boolean {
  const stack = [rootId]
  const seen = new Set<string>()
  while (stack.length) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    const current = nodes[id]
    if (!current) continue
    if (current.type === type) return true
    stack.push(...current.children)
  }
  return false
}

/** Mutates `nodes` and returns the new root children order. */
export function injectStoreCartShellNodesV1(
  nodes: Record<string, EditorNode>,
  rootId: string,
  children: string[],
  accentColor: string | undefined,
): string[] {
  if (!Object.values(nodes).some((candidate) => isBoundStoreProductCardNodeV1(candidate) || isStoreProductDetailNodeV1(candidate))) return children
  if (Object.values(nodes).some((candidate) => candidate.type === "store-cart-drawer")) return children

  const accent = accentColor ? { accentColor } : {}
  const button = node("store-cart-button", "Carrito (boton)", { label: "Carrito", ...accent })
  const drawer = node("store-cart-drawer", "Carrito (panel)", { checkoutLabel: "Ir a pagar", ...accent })
  const bar = node("genericWrapper", "Barra carrito", { tag: "div", className: "flex justify-end" }, [button.id])
  const shell = node("section", STORE_CART_SHELL_DISPLAY_NAME_V1, { maxWidth: "xl", paddingY: "lg", paddingX: "lg", background: "#0f172a" }, [bar.id, drawer.id])

  button.parentId = bar.id
  bar.parentId = shell.id
  drawer.parentId = shell.id
  shell.parentId = rootId
  for (const created of [button, drawer, bar, shell]) nodes[created.id] = created

  const insertAt = children.length > 0 && subtreeHasType(nodes, children[0], "siteNav") ? 1 : 0
  return [...children.slice(0, insertAt), shell.id, ...children.slice(insertAt)]
}

/** Pure tree variant (clones nodes) used by the confirm-time binder. */
export function injectStoreCartShellIntoTreeV1(tree: EditorTree, accentColor?: string): EditorTree {
  const nodes = structuredClone(tree.nodes) as Record<string, EditorNode>
  const root = nodes[tree.rootId]
  if (!root) return tree
  root.children = injectStoreCartShellNodesV1(nodes, tree.rootId, [...root.children], accentColor)
  return { ...tree, nodes }
}
