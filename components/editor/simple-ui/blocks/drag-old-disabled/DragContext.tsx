"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

interface DragState {
  draggingId: string | null
  overId: string | null
  isDragging: boolean
}

interface DragContextValue extends DragState {
  startDragging: (id: string) => void
  setDragOver: (id: string | null) => void
  stopDragging: () => void
}

const DragContext = createContext<DragContextValue | null>(null)

interface DragProviderProps {
  children: ReactNode
}

export function DragProvider({ children }: DragProviderProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const value = useMemo<DragContextValue>(
    () => ({
      draggingId,
      overId,
      isDragging: draggingId !== null,
      startDragging(id) {
        setDraggingId(id)
        setOverId(null)
      },
      setDragOver(id) {
        setOverId(id)
      },
      stopDragging() {
        setDraggingId(null)
        setOverId(null)
      },
    }),
    [draggingId, overId],
  )

  return (
    <DragContext.Provider value={value}>
      {children}
    </DragContext.Provider>
  )
}

export function useDragContext() {
  const context = useContext(DragContext)

  if (!context) {
    throw new Error(
      "useDragContext debe utilizarse dentro de DragProvider",
    )
  }

  return context
}
