"use client"

import type {
  PointerEventHandler,
} from "react"

import { useDragContext } from "./DragContext"

interface UseDropOptions {
  id: string
}

export function useDrop({ id }: UseDropOptions) {
  const {
    draggingId,
    overId,
    setDragOver,
  } = useDragContext()

  const onPointerEnter: PointerEventHandler<HTMLElement> = () => {
    if (!draggingId || draggingId === id) return

    setDragOver(id)
  }

  const onPointerLeave: PointerEventHandler<HTMLElement> = () => {
    if (overId === id) {
      setDragOver(null)
    }
  }

  return {
    isOver: overId === id,
    onPointerEnter,
    onPointerLeave,
  }
}
