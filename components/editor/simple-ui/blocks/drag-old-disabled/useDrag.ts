"use client"

import type { PointerEventHandler } from "react"

import { useDragContext } from "./DragContext"

interface UseDragOptions {
  id: string
}

export function useDrag({ id }: UseDragOptions) {
  const {
    draggingId,
    startDragging,
    stopDragging,
  } = useDragContext()

  const onPointerDown: PointerEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    startDragging(id)
  }

  const onPointerUp: PointerEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    if (
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    stopDragging()
  }

  return {
    dragging: draggingId === id,
    onPointerDown,
    onPointerUp,
  }
}
