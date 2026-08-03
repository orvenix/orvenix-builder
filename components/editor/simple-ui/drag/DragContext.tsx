"use client"

import {
  createContext,
  useContext,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react"

interface SortableHandleContextValue {
  attributes: HTMLAttributes<HTMLElement>
  listeners: Record<string, unknown> | undefined
  setActivatorNodeRef: Ref<HTMLButtonElement>
  dragging: boolean
}

const SortableHandleContext =
  createContext<SortableHandleContextValue | null>(null)

interface SortableHandleProviderProps
  extends SortableHandleContextValue {
  children: ReactNode
}

export function SortableHandleProvider({
  children,
  attributes,
  listeners,
  setActivatorNodeRef,
  dragging,
}: SortableHandleProviderProps) {
  return (
    <SortableHandleContext.Provider
      value={{
        attributes,
        listeners,
        setActivatorNodeRef,
        dragging,
      }}
    >
      {children}
    </SortableHandleContext.Provider>
  )
}

export function useSortableHandle() {
  return useContext(SortableHandleContext)
}
