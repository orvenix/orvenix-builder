"use client"

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { useRef, useState } from "react"
import { ClientPageRenderer } from "@/components/editor/client-app"
import { MediaCenter } from "@/components/editor/MediaCenter"
import { ClientWorkspaceSidebar } from "@/components/editor/experience"
import { SelectionBreadcrumb } from "@/components/editor/selection/SelectionBreadcrumb"
import { CustomerSelectionOverlay } from "@/components/editor/selection/CustomerSelectionOverlay"
import { CustomerCanvasContext, type CustomerCanvasContextValue } from "@/components/editor/selection/customer-canvas-context"
import { FloatingSaveIndicator } from "@/components/editor/toolbar/FloatingSaveIndicator"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { computeSectionReorder } from "@/lib/editor/selection-model"
import { useEditorStore } from "@/store/useEditorStore"

import { ClientDeviceSwitcher } from "./ClientDeviceSwitcher"
import { CLIENT_VIEWPORT_WIDTHS, IsolatedViewportFrame, type ClientViewportDevice } from "./IsolatedViewportFrame"

/**
 * VE-1: a customer section drop changes only the page root's child order
 * (pinned blocks such as the site menu stay put); never coordinates.
 */
export function handleClientSectionDragEnd(event: Pick<DragEndEvent, "active" | "over">) {
  const { active, over } = event
  if (!over || active.id === over.id) return
  const { tree, reorderChildren } = useEditorStore.getState()
  const targetIndex = (tree.nodes[tree.rootId]?.children ?? []).indexOf(String(over.id))
  const next = computeSectionReorder(tree, String(active.id), targetIndex)
  if (next) reorderChildren(tree.rootId, next)
}

export function ClientShell() {
  // Keyboard events from inside the isolated website viewport are handled exactly like editor-window events.
  const [frameWindow, setFrameWindow] = useState<Window | null>(null)
  useKeyboardShortcuts({ extraWindow: frameWindow })

  const isPreviewMode = useEditorStore(
    (state) => state.isPreviewMode,
  )
  const hasSelection = useEditorStore((state) => Boolean(state.selectedId))
  const currentDevice = useEditorStore((state) => state.currentDevice)
  // A small activation distance keeps clicks on the drag handle from starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  // The WEBSITE's logical viewport width (its own media queries), independent of the editor chrome.
  const logicalWidth = CLIENT_VIEWPORT_WIDTHS[(currentDevice in CLIENT_VIEWPORT_WIDTHS ? currentDevice : "desktop") as ClientViewportDevice]
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasContext] = useState<CustomerCanvasContextValue>(() => ({ sectionDragHandles: new Map() }))

  return (
    <CustomerCanvasContext.Provider value={canvasContext}>
    <DndContext sensors={sensors} onDragEnd={handleClientSectionDragEnd}>
      <main className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#eef2f7]">
      <FloatingSaveIndicator />
      {!isPreviewMode && <MediaCenter />}

      {!isPreviewMode && <ClientWorkspaceSidebar />}

      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {!isPreviewMode && (
          <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-5 py-2.5 backdrop-blur-xl">
            <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between gap-4">
              {hasSelection ? (
                <SelectionBreadcrumb className="flex-1" />
              ) : (
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">
                    Vista de tu página
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    Haz clic en lo que quieras cambiar. Esc sube a la sección que lo contiene.
                  </p>
                </div>
              )}

              <ClientDeviceSwitcher />
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden bg-[#e8edf4] p-3 md:p-5">
          <IsolatedViewportFrame logicalWidth={logicalWidth} onFrameWindow={setFrameWindow}>
            <div
              ref={canvasRef}
              className="relative"
              onMouseLeave={() => useEditorStore.getState().hover(null)}
            >
              <div className="editor-site-canvas">
                <ClientPageRenderer />
              </div>
              {!isPreviewMode && <CustomerSelectionOverlay containerRef={canvasRef} />}
            </div>
          </IsolatedViewportFrame>
        </div>
      </section>
      </main>
    </DndContext>
    </CustomerCanvasContext.Provider>
  )
}
