"use client"

import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react"

import { isMovableSection } from "@/lib/editor/selection-model"
import { useEditorStore } from "@/store/useEditorStore"

import { EDITOR_NODE_ATTRIBUTE, useCustomerCanvas } from "./customer-canvas-context"
import { CustomerContextBar } from "./CustomerContextBar"

type Box = { top: number; left: number; width: number; height: number }

/** Rendered boxes of a node: a box-free (`display: contents`) wrapper is measured through its descendants. */
function renderedBoxes(element: Element): Element[] {
  // The site may live in the isolated viewport frame: use the element's own window.
  const view = element.ownerDocument.defaultView ?? window
  if (view.getComputedStyle(element).display !== "contents") return [element]
  return Array.from(element.children).flatMap(renderedBoxes)
}

/** Union of the node's rendered boxes, in the scroll container's content coordinates. Editor-only, never persisted. */
function measureNode(container: HTMLElement, id: string | null): { box: Box; elements: Element[] } | null {
  if (!id) return null
  const element = container.querySelector(`[${EDITOR_NODE_ATTRIBUTE}="${CSS.escape(id)}"]`)
  if (!element) return null
  const elements = renderedBoxes(element)
  const rects = elements.map((entry) => entry.getBoundingClientRect()).filter((rect) => rect.width > 0 || rect.height > 0)
  if (!rects.length) return null
  const origin = container.getBoundingClientRect()
  const top = Math.min(...rects.map((rect) => rect.top))
  const left = Math.min(...rects.map((rect) => rect.left))
  const bottom = Math.max(...rects.map((rect) => rect.bottom))
  const right = Math.max(...rects.map((rect) => rect.right))
  return {
    box: { top: top - origin.top + container.scrollTop, left: left - origin.left + container.scrollLeft, width: right - left, height: bottom - top },
    elements,
  }
}

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
            <CustomerContextBar key={selectedId} selectedId={selectedId} dragHandle={dragHandle} />
          </div>
        </>
      )}
    </div>
  )
}
