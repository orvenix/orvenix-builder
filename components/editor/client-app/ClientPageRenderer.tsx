"use client"

import { DynamicRenderer } from "@/components/editor/DynamicRenderer"
import { useEditorStore } from "@/store/useEditorStore"

export function ClientPageRenderer() {
  const tree = useEditorStore((state) => state.tree)

  const root = tree.nodes[tree.rootId]

  if (!root) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-white px-6 text-center">
        <div>
          <p className="text-sm font-bold text-slate-800">
            No pudimos cargar esta página
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Intenta recargarla nuevamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DynamicRenderer nodeId={root.id} mode="edit" />
  )
}
