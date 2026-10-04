"use client"

import { EDITOR_NODE_ATTRIBUTE } from "./customer-canvas-context"

export type Box = { top: number; left: number; width: number; height: number }

/** Rendered boxes of a node: a box-free (`display: contents`) wrapper is measured through its descendants. */
function renderedBoxes(element: Element): Element[] {
  // The site may live in the isolated viewport frame: use the element's own window.
  const view = element.ownerDocument.defaultView ?? window
  if (view.getComputedStyle(element).display !== "contents") return [element]
  return Array.from(element.children).flatMap(renderedBoxes)
}

/** Union of the node's rendered boxes, in the scroll container's content coordinates. Editor-only, never persisted. */
export function measureNode(container: HTMLElement, id: string | null): { box: Box; elements: Element[] } | null {
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
