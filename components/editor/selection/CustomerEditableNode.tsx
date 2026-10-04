"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useLayoutEffect, type CSSProperties, type MouseEvent, type ReactNode } from "react"

import { useEditorExperience } from "@/components/editor/experience/ExperienceContext"
import { getEditorVisualStyle, resolveResponsiveProps } from "@/components/editor/responsive"
import { getRuntimeFreePositionStyle } from "@/lib/builder-core/runtime/rendering"
import { isMovableSection } from "@/lib/editor/selection-model"
import { useEditorStore } from "@/store/useEditorStore"
import type { NodeId } from "@/types/editor"

import { EDITOR_NODE_ATTRIBUTE, useCustomerCanvas } from "./customer-canvas-context"

/**
 * VE-1 editor open parity: customer-mode editing wrapper that never changes
 * the site's layout geometry.
 *
 * - nested nodes: a box-free wrapper (`display: contents`) -- the real block
 *   stays the direct child of its grid/flex/positioned container, exactly as
 *   in preview; clicks and hovers still bubble through it.
 * - free-position nodes (legacy trees): the SAME positioned wrapper preview
 *   renders (getRuntimeFreePositionStyle) -- never draggable here.
 * - top-level sections: a plain, unpositioned block box (needed by the
 *   sortable); the page root lays sections out vertically, so this box does
 *   not change their composition.
 *
 * All selection chrome lives in the shared CustomerSelectionOverlay.
 */
export function CustomerEditableNode({ id, children }: { id: NodeId; children: ReactNode }) {
  const { capabilities } = useEditorExperience()
  const isSection = useEditorStore((s) => capabilities.allowSectionReorder && isMovableSection(s.tree, id))
  const freeStyle = useEditorStore((s) => {
    const props = resolveResponsiveProps(s.tree.nodes[id]?.props, s.currentDevice)
    return props.positionMode === "free" ? JSON.stringify(getRuntimeFreePositionStyle(props, getEditorVisualStyle(props))) : null
  })
  const select = useEditorStore((s) => s.select)
  const hover = useEditorStore((s) => s.hover)
  const setEditingNode = useEditorStore((s) => s.setEditingNode)

  const handlers = {
    [EDITOR_NODE_ATTRIBUTE]: id,
    onClick: (event: MouseEvent) => {
      event.stopPropagation()
      window.dispatchEvent(new CustomEvent("orvenix:client-panel-request", { detail: { panel: "content" } }))
      select(id)
    },
    onDoubleClick: (event: MouseEvent) => {
      event.stopPropagation()
      if (!useEditorStore.getState().tree.nodes[id]?.locked) setEditingNode(id)
    },
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      select(id)
    },
    // Innermost node wins; the store is only touched when the hovered node actually changes.
    onMouseOver: (event: MouseEvent) => {
      event.stopPropagation()
      if (useEditorStore.getState().hoveredId !== id) hover(id)
    },
  }

  if (isSection) return <CustomerSectionBox id={id} handlers={handlers}>{children}</CustomerSectionBox>
  if (freeStyle) return <div {...handlers} style={JSON.parse(freeStyle) as CSSProperties}>{children}</div>
  return <div {...handlers} style={{ display: "contents" }}>{children}</div>
}

function CustomerSectionBox({ id, handlers, children }: { id: NodeId; handlers: Record<string, unknown>; children: ReactNode }) {
  const canvas = useCustomerCanvas()
  const isLocked = useEditorStore((s) => Boolean(s.tree.nodes[id]?.locked))
  const isEditingInside = useEditorStore((s) => s.editingNodeId !== null && s.selectedId !== null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: isLocked || isEditingInside })

  useLayoutEffect(() => {
    if (!canvas) return
    canvas.sectionDragHandles.set(id, { attributes, listeners })
    return () => {
      canvas.sectionDragHandles.delete(id)
    }
  }, [canvas, id, attributes, listeners])

  return (
    <div
      {...handlers}
      ref={setNodeRef}
      style={{
        ...(transform ? { transform: CSS.Transform.toString(transform) } : {}),
        ...(transition ? { transition } : {}),
        ...(isDragging ? { opacity: 0.4 } : {}),
      }}
    >
      {children}
    </div>
  )
}
