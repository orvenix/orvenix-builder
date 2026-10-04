"use client"

import { ChevronRight } from "lucide-react"
import { useMemo } from "react"

import { getAncestorPath, getNodeLabel } from "@/lib/editor/selection-model"
import { cn } from "@/lib/utils"
import { useEditorStore } from "@/store/useEditorStore"

/** Visible crumbs before the middle of a long path collapses into "…". */
const MAX_VISIBLE = 5

/**
 * VE-1: ancestor path of the current selection ("Página › Portada ›
 * Contenedor › Título"), derived from the real EditorTree. Clicking a crumb
 * selects that ancestor ("Página" clears the selection). Editor UI only --
 * nothing here is persisted or written to the tree.
 */
export function SelectionBreadcrumb({ className }: { className?: string }) {
  const tree = useEditorStore((state) => state.tree)
  const selectedId = useEditorStore((state) => state.selectedId)
  const select = useEditorStore((state) => state.select)
  const setEditingNode = useEditorStore((state) => state.setEditingNode)

  const crumbs = useMemo(
    () => getAncestorPath(tree, selectedId).map((id) => ({ id, label: getNodeLabel(tree, id) })),
    [tree, selectedId],
  )

  if (crumbs.length < 2) return null

  const visible: Array<{ id: string; label: string } | "gap"> =
    crumbs.length > MAX_VISIBLE ? [crumbs[0], "gap", ...crumbs.slice(-(MAX_VISIBLE - 2))] : crumbs

  return (
    <nav aria-label="Ruta de la selección" className={cn("min-w-0 overflow-x-auto", className)}>
      <ol className="flex min-w-max items-center gap-0.5 text-xs">
        {visible.map((crumb, index) => {
          if (crumb === "gap") {
            return (
              <li key="gap" className="flex items-center gap-0.5 text-slate-400" aria-hidden="true">
                <span className="px-1">…</span>
                <ChevronRight className="h-3 w-3" />
              </li>
            )
          }
          const isCurrent = crumb.id === selectedId
          const isPage = crumb.id === tree.rootId
          return (
            <li key={crumb.id} className="flex items-center gap-0.5">
              <button
                type="button"
                aria-current={isCurrent ? "location" : undefined}
                onClick={() => {
                  setEditingNode(null)
                  select(isPage ? null : crumb.id)
                }}
                className={cn(
                  "rounded-md px-2 py-1 font-semibold transition",
                  isCurrent
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {crumb.label}
              </button>
              {index < visible.length - 1 && <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
