"use client"

import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react"

import { isMovableSection } from "@/lib/editor/selection-model"
import { useEditorStore } from "@/store/useEditorStore"

import { useCustomerCanvas } from "./customer-canvas-context"
import { measureNode, type Box } from "./measure-node"
import { useSiblingDrag } from "./useSiblingDrag"
import { CustomerContextBar } from "./CustomerContextBar"

/**
 * VE-1 editor open parity: the ONE place customer selection chrome is drawn
 * (hover outline, selected outline, readable label, inline-edit and section
 * controls). It sits above the site in the canvas scroll container and is
 * never part of the website's layout or tree.
 */
export function CustomerSelectionOverlay({ containerRef }: { containerRef: RefObject<HTMLDivElement | null> }) {
  const canvas = useCustomerCanvas()
  const selectedId = useEditorStore((s) => s.selectedId)
  const hoveredId = useEditorStore((s) => s.hoveredId)
  const editingNodeId = useEditorStore((s) => s.editingNodeId)
  const currentDevice = useEditorStore((s) => s.currentDevice)
  const tree = useEditorStore((s) => s.tree)
  const [boxes, setBoxes] = useState<{ selected: Box | null; hovered: Box | null; canvasWidth: number }>({ selected: null, hovered: null, canvasWidth: 0 })
  const [observed, setObserved] = useState<Element[]>([])
  const { siblingDrag, startSiblingDrag } = useSiblingDrag(containerRef)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const selected = measureNode(container, selectedId)
    const hovered = hoveredId && hoveredId !== selectedId ? measureNode(container, hoveredId) : null
    setBoxes({ selected: selected?.box ?? null, hovered: hovered?.box ?? null, canvasWidth: container.clientWidth })
    setObserved((previous) => {
      const next = selected?.elements ?? []
      return previous.length === next.length && previous.every((element, index) => element === next[index]) ? previous : next
    })
  }, [containerRef, selectedId, hoveredId])

  // Selection, hover, tree, device or edit-state changes: measure after the site has rendered.
  useLayoutEffect(() => {
    measure()
  }, [measure, tree, currentDevice, editingNodeId])

  // Canvas scroll and window resize, throttled to one measurement per frame.
  useEffect(() => {
    const container = containerRef.current
    if (!container || (!selectedId && !hoveredId)) return
    let frame = 0
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure() })
    }
    const view = container.ownerDocument.defaultView ?? window
    container.addEventListener("scroll", schedule, { passive: true })
    view.addEventListener("resize", schedule)
    window.addEventListener("resize", schedule)
    return () => {
      container.removeEventListener("scroll", schedule)
      view.removeEventListener("resize", schedule)
      window.removeEventListener("resize", schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [containerRef, measure, selectedId, hoveredId])

  // The selected node's own geometry (images loading, text reflow): one observer for the selection only.
  useEffect(() => {
    const view = observed[0]?.ownerDocument.defaultView as (Window & typeof globalThis) | null | undefined
    const Observer = view?.ResizeObserver ?? (typeof ResizeObserver === "undefined" ? undefined : ResizeObserver)
    if (!observed.length || !Observer) return
    const observer = new Observer(() => measure())
    observed.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [observed, measure])

  const isSection = Boolean(selectedId && isMovableSection(tree, selectedId))
  const dragHandle = selectedId && isSection ? canvas?.sectionDragHandles.get(selectedId) : undefined

  const selected = boxes.selected
  const toolbarTop = selected ? (isSection ? selected.top + 12 : selected.top >= 52 ? selected.top - 48 : selected.top + selected.height + 8) : 0
  // Keep the bar inside the canvas horizontally (it may wrap on narrow viewports).
  const toolbarLeft = selected ? Math.max(8, Math.min(selected.left + (isSection ? 12 : 0), Math.max(8, boxes.canvasWidth - 428))) : 0

  return (
    <div className="pointer-events-none absolute inset-0 z-[60]" aria-hidden={!selected}>
      {boxes.hovered && (
        <div
          className="absolute rounded-[2px] outline outline-1 outline-cyan-400/70"
          style={{ top: boxes.hovered.top, left: boxes.hovered.left, width: boxes.hovered.width, height: boxes.hovered.height }}
        />
      )}
      {selected && selectedId && (
        <>
          <div
            className="absolute rounded-[2px] outline outline-2 outline-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.15)]"
            style={{ top: selected.top, left: selected.left, width: selected.width, height: selected.height }}
          />
          <div
            className="pointer-events-auto absolute"
            style={{ top: toolbarTop, left: toolbarLeft }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* VE-2: capability-driven context bar (key resets transient panels per selection). */}
            <CustomerContextBar key={selectedId} selectedId={selectedId} dragHandle={dragHandle} onStartSiblingDrag={startSiblingDrag} />
          </div>
        </>
      )}
      {/* VE-3: semantic drop feedback -- an insertion line between siblings, or an explicit refusal. */}
      {siblingDrag.active && siblingDrag.line && (
        <div className="absolute rounded-full bg-cyan-500 shadow-[0_0_0_3px_rgba(6,182,212,0.25)]" style={{ top: siblingDrag.line.top, left: siblingDrag.line.left, width: siblingDrag.line.width, height: siblingDrag.line.height }} />
      )}
      {siblingDrag.active && !siblingDrag.valid && (
        <div role="status" className="absolute rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg" style={{ top: siblingDrag.pointer.y + 14, left: siblingDrag.pointer.x + 14 }}>
          No se puede soltar aquí
        </div>
      )}
    </div>
  )
}
