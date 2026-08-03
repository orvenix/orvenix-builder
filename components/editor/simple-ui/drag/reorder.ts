import { arrayMove } from "@dnd-kit/sortable"

interface IdentifiableItem {
  id: string
}

export function reorderItemsById<T extends IdentifiableItem>(
  items: readonly T[],
  activeId: string,
  overId: string,
): T[] {
  if (activeId === overId) {
    return [...items]
  }

  const oldIndex = items.findIndex((item) => item.id === activeId)
  const newIndex = items.findIndex((item) => item.id === overId)

  if (oldIndex === -1 || newIndex === -1) {
    return [...items]
  }

  return arrayMove([...items], oldIndex, newIndex)
}
