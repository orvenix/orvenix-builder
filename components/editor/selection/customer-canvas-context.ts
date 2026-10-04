"use client"

import { createContext, useContext } from "react"
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"

/** Editor-only data attribute marking the rendered element(s) of a node on the customer canvas. */
export const EDITOR_NODE_ATTRIBUTE = "data-editor-node-id"

export interface SectionDragHandle {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}

/**
 * VE-1 editor open parity: top-level sections register their sortable drag
 * handle here so the shared customer overlay can render it OUTSIDE the
 * site's layout. Ephemeral editor state only (never persisted).
 */
export interface CustomerCanvasContextValue {
  sectionDragHandles: Map<string, SectionDragHandle>
}

export const CustomerCanvasContext = createContext<CustomerCanvasContextValue | null>(null)

export function useCustomerCanvas(): CustomerCanvasContextValue | null {
  return useContext(CustomerCanvasContext)
}
