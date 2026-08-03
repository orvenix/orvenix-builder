"use client"

/* eslint-disable react-hooks/refs */

import { GripVertical } from "lucide-react"

import { useSortableHandle } from "./DragContext"

interface DragHandleProps {
  label: string
}

export function DragHandle({ label }: DragHandleProps) {
  const sortable = useSortableHandle()

  if (!sortable) return null

  return (
    <button
      ref={sortable.setActivatorNodeRef}
      type="button"
      aria-label={`Mover ${label}`}
      title={`Arrastra para mover ${label}`}
      className={[
        "inline-flex h-9 w-9 touch-none items-center justify-center rounded-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        sortable.dragging
          ? "cursor-grabbing bg-cyan-400/15 text-cyan-300"
          : "cursor-grab text-slate-400 hover:bg-white/10 hover:text-cyan-300",
      ].join(" ")}
      {...sortable.attributes}
      {...sortable.listeners}
      onClick={(event) => event.stopPropagation()}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
