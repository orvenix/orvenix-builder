"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { resolveResponsiveProps } from "@/components/editor/responsive";

export function useKeyboardShortcuts() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const removeNode = useEditorStore((s) => s.removeNode);
  const removeNodes = useEditorStore((s) => s.removeNodes);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const copyNode = useEditorStore((s) => s.copyNode);
  const pasteNodeAfter = useEditorStore((s) => s.pasteNodeAfter);
  const pasteNodeAt = useEditorStore((s) => s.pasteNodeAt);
  const moveFreeNodesByDelta = useEditorStore((s) => s.moveFreeNodesByDelta);
  const select = useEditorStore((s) => s.select);
  const setEditingNode = useEditorStore((s) => s.setEditingNode);
  const closeContextMenu = useEditorStore((s) => s.closeContextMenu);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const currentDevice = useEditorStore((s) => s.currentDevice);
  const lastCanvasPoint = useEditorStore((s) => s.lastCanvasPoint);
  const tree = useEditorStore((s) => s.tree);
  const rootId = useEditorStore((s) => s.tree.rootId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (isPreviewMode) {
        if (e.key === "Escape") {
          e.preventDefault();
          setPreviewMode(false);
        }
        return;
      }

      if (e.key === "Escape" && target.isContentEditable) {
        setEditingNode(null);
        target.blur();
        return;
      }

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      const selectedEditableIds = selectedIds.filter((id) => id !== rootId && tree.nodes[id]);
      const selectedUnlockedIds = selectedEditableIds.filter((id) => !tree.nodes[id]?.locked);
      const selectedFreeIds = expandGroupedIds(
        selectedUnlockedIds.filter((id) => resolveResponsiveProps(tree.nodes[id]?.props, currentDevice).positionMode === "free"),
        tree,
        currentDevice
      );
      const arrowDelta = e.shiftKey ? 10 : 1;
      const arrowMove = getArrowMove(e.key, arrowDelta);

      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (selectedId && selectedId !== rootId) copyNode(selectedId);
      } else if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        if (lastCanvasPoint) {
          pasteNodeAt(rootId, lastCanvasPoint);
        } else if (selectedId && selectedId !== rootId) {
          pasteNodeAfter(selectedId);
        }
      } else if (mod && e.key === "d") {
        e.preventDefault();
        if (selectedId && selectedId !== rootId) duplicateNode(selectedId);
      } else if (arrowMove && selectedFreeIds.length > 0) {
        e.preventDefault();
        moveFreeNodesByDelta(selectedFreeIds, arrowMove.x, arrowMove.y);
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedId &&
        selectedId !== rootId
      ) {
        e.preventDefault();
        if (selectedUnlockedIds.length > 1) {
          removeNodes(selectedUnlockedIds);
        } else if (selectedUnlockedIds.length === 1) {
          removeNode(selectedUnlockedIds[0]);
        }
      } else if (e.key === "Escape") {
        closeContextMenu();
        select(null);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    undo,
    redo,
    removeNode,
    removeNodes,
    duplicateNode,
    copyNode,
    pasteNodeAfter,
    pasteNodeAt,
    moveFreeNodesByDelta,
    select,
    setEditingNode,
    closeContextMenu,
    isPreviewMode,
    setPreviewMode,
    selectedId,
    selectedIds,
    currentDevice,
    lastCanvasPoint,
    tree,
    rootId,
  ]);
}

function getArrowMove(key: string, amount: number) {
  switch (key) {
    case "ArrowLeft":
      return { x: -amount, y: 0 };
    case "ArrowRight":
      return { x: amount, y: 0 };
    case "ArrowUp":
      return { x: 0, y: -amount };
    case "ArrowDown":
      return { x: 0, y: amount };
    default:
      return null;
  }
}

function expandGroupedIds(ids: string[], tree: ReturnType<typeof useEditorStore.getState>["tree"], currentDevice: ReturnType<typeof useEditorStore.getState>["currentDevice"]) {
  const groupIds = new Set(
    ids
      .map((id) => tree.nodes[id]?.props.groupId)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );
  if (groupIds.size === 0) return ids;

  const expanded = new Set(ids);
  Object.values(tree.nodes).forEach((node) => {
    if (
      !node.locked &&
      typeof node.props.groupId === "string" &&
      groupIds.has(node.props.groupId) &&
      resolveResponsiveProps(node.props, currentDevice).positionMode === "free"
    ) {
      expanded.add(node.id);
    }
  });
  return Array.from(expanded);
}
