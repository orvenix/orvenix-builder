"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"

import { SortableHandleProvider } from "./DragContext"

interface SortableSectionProps {
  id: string
  children: ReactNode
}

export function SortableSection({
  id,
  children,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  })

  return (
    <SortableHandleProvider
      attributes={attributes}
      listeners={listeners}
      setActivatorNodeRef={setActivatorNodeRef}
      dragging={isDragging}
    >
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={[
          "relative transition-[opacity,box-shadow] duration-200",
          isDragging
            ? "z-50 opacity-70 shadow-2xl"
            : "",
        ].join(" ")}
      >
        {children}
      </div>
    </SortableHandleProvider>
  )
}
