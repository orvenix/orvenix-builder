"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react"

import { getParentId } from "@/lib/editor/selection-model"
import { canReorderWithinParent, computeSiblingDrop } from "@/lib/editor/structure-rules"
import { useEditorStore } from "@/store/useEditorStore"
import type { NodeId } from "@/types/editor"

import { measureNode, type Box } from "./measure-node"

export type SiblingDragState =
  | { active: false }
  | { active: true; valid: boolean; line: Box | null; pointer: { x: number; y: number } }

const AUTOSCROLL_EDGE = 48
const AUTOSCROLL_STEP = 16
const DROP_MARGIN = 32

/** Siblings laid out side by side (a row) vs stacked (a column), from their measured boxes. */
function isRow(boxes: Box[]): boolean {
  if (boxes.length < 2) return false
  const [first, ...rest] = boxes
  return rest.every((box) => box.top < first.top + first.height * 0.6 && first.top < box.top + box.height * 0.6)
}

/**
 * VE-3 semantic sibling drag for the customer canvas: the pointer chooses a
 * position BETWEEN siblings of the same container (insertion line), never a
 * coordinate. Sibling boxes are measured once at drag start (container
 * coordinates are scroll-invariant), the website frame auto-scrolls near its
 * edges, and a drop outside the container, onto itself, or with no change
 * mutates nothing. A valid drop is ONE reorderChildren (one undo step).
 */
export function useSiblingDrag(containerRef: RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<SiblingDragState>({ active: false })
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanupRef.current?.(), [])

  const startSiblingDrag = useCallback((event: ReactPointerEvent, id: NodeId) => {
    const container = containerRef.current
    const { tree } = useEditorStore.getState()
    const parentId = getParentId(tree, id)
    if (!container || !parentId || !canReorderWithinParent(tree, id) || event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    const doc = container.ownerDocument
    const view = doc.defaultView ?? window
    const parentBox = measureNode(container, parentId)?.box
    const siblings = tree.nodes[parentId].children
      .filter((siblingId) => siblingId !== id)
      .map((siblingId) => ({ id: siblingId, box: measureNode(container, siblingId)?.box }))
      .filter((entry): entry is { id: NodeId; box: Box } => Boolean(entry.box))
    if (!parentBox || !siblings.length) return
    const row = isRow(siblings.map((entry) => entry.box))
    let drop: { targetId: NodeId; position: "before" | "after" } | null = null

    const onMove = (move: PointerEvent) => {
      if (move.clientY < AUTOSCROLL_EDGE) view.scrollBy(0, -AUTOSCROLL_STEP)
      else if (move.clientY > view.innerHeight - AUTOSCROLL_EDGE) view.scrollBy(0, AUTOSCROLL_STEP)
      const origin = container.getBoundingClientRect()
      const x = move.clientX - origin.left + container.scrollLeft
      const y = move.clientY - origin.top + container.scrollTop
      const inside = x >= parentBox.left - DROP_MARGIN && x <= parentBox.left + parentBox.width + DROP_MARGIN && y >= parentBox.top - DROP_MARGIN && y <= parentBox.top + parentBox.height + DROP_MARGIN
      if (!inside) {
        drop = null
        setState({ active: true, valid: false, line: null, pointer: { x, y } })
        return
      }
      const before = siblings.find((entry) => (row ? x < entry.box.left + entry.box.width / 2 : y < entry.box.top + entry.box.height / 2))
      const anchor = before ?? siblings[siblings.length - 1]
      const position = before ? "before" : "after"
      drop = computeSiblingDrop(useEditorStore.getState().tree, id, anchor.id, position) ? { targetId: anchor.id, position } : null
      const edge = row
        ? { top: anchor.box.top, left: position === "before" ? anchor.box.left - 2 : anchor.box.left + anchor.box.width - 1, width: 3, height: anchor.box.height }
        : { top: position === "before" ? anchor.box.top - 2 : anchor.box.top + anchor.box.height - 1, left: parentBox.left, width: parentBox.width, height: 3 }
      setState({ active: true, valid: true, line: drop ? edge : null, pointer: { x, y } })
    }
    const finish = (commit: boolean) => {
      cleanupRef.current?.()
      cleanupRef.current = null
      setState({ active: false })
      if (!commit || !drop) return
      const next = computeSiblingDrop(useEditorStore.getState().tree, id, drop.targetId, drop.position)
      if (next) useEditorStore.getState().reorderChildren(parentId, next)
    }
    const onUp = () => finish(true)
    const onKey = (key: KeyboardEvent) => {
      if (key.key === "Escape") {
        key.preventDefault()
        key.stopPropagation()
        finish(false)
      }
    }
    doc.addEventListener("pointermove", onMove)
    doc.addEventListener("pointerup", onUp)
    doc.addEventListener("pointercancel", () => finish(false), { once: true })
    doc.addEventListener("keydown", onKey, true)
    cleanupRef.current = () => {
      doc.removeEventListener("pointermove", onMove)
      doc.removeEventListener("pointerup", onUp)
      doc.removeEventListener("keydown", onKey, true)
    }
    setState({ active: true, valid: true, line: null, pointer: { x: 0, y: 0 } })
  }, [containerRef])

  return { siblingDrag: state, startSiblingDrag }
}
