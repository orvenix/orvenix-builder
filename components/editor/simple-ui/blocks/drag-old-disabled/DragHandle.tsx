"use client"

import { GripVertical } from "lucide-react"
import type { PointerEventHandler } from "react"

interface DragHandleProps {
  label: string
  dragging?: boolean
  onPointerDown?: PointerEventHandler<HTMLButtonElement>
}

export function DragHandle({
  label,
  dragging = false,
  onPointerDown,
}: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label={`Mover ${label}`}
      title={`Mover ${label}`}
      className={[
        "inline-flex h-9 w-9 touch-none items-center justify-center rounded-lg",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-sky-500",
        dragging
          ? "cursor-grabbing bg-sky-500/15 text-sky-400"
          : "cursor-grab text-slate-400 hover:bg-white/10 hover:text-sky-300",
      ].join(" ")}
      onPointerDown={onPointerDown}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}
