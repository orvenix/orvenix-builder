"use client"

import { DndContext } from "@dnd-kit/core"
import { ClientPageRenderer } from "@/components/editor/client-app"
import { MediaCenter } from "@/components/editor/MediaCenter"
import { ClientWorkspaceSidebar } from "@/components/editor/experience"
import { FloatingSaveIndicator } from "@/components/editor/toolbar/FloatingSaveIndicator"
import { useAutosave } from "@/hooks/useAutosave"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useEditorStore } from "@/store/useEditorStore"

export function ClientShell() {
  useAutosave()
  useKeyboardShortcuts()

  const isPreviewMode = useEditorStore(
    (state) => state.isPreviewMode,
  )

  return (
    <DndContext>
      <main className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[#eef2f7]">
      <FloatingSaveIndicator />
      {!isPreviewMode && <MediaCenter />}

      {!isPreviewMode && <ClientWorkspaceSidebar />}

      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {!isPreviewMode && (
          <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-700">
                  Vista de tu página
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Haz clic en una sección y doble clic sobre el texto para editar.
                </p>
              </div>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                Edición simple
              </span>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden bg-[#e8edf4] p-3 md:p-5">
          <div className="h-full overflow-auto bg-white">
  <ClientPageRenderer />
          </div>
        </div>
      </section>
      </main>
    </DndContext>
  )
}
