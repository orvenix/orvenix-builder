"use client";

import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { cn } from "@/lib/utils";
import type { NodeId } from "@/types/editor";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import {
  Trash2, GripVertical, Copy, ChevronUp, ChevronDown, Move, Rows3,
  Eye, EyeOff, Lock, Unlock, Group,
} from "lucide-react";
import { blockRegistry } from "@/blocks/registry";
import { getEditorVisualStyle, resolveResponsiveProps } from "@/components/editor/responsive";

// Map block category → accent color
const CATEGORY_COLORS: Record<string, string> = {
  layout:       "#64748b",
  content:      "#3b82f6",
  action:       "#8b5cf6",
  ecommerce:    "#f59e0b",
  analytics:    "#7c3aed",
  crm:          "#2563eb",
  productivity: "#10b981",
  marketing:    "#ec4899",
  enterprise:   "#06b6d4",
  finance:      "#10b981",
  hr:           "#f97316",
  devops:       "#06b6d4",
};

interface EditableNodeProps {
  id: NodeId;
  children: React.ReactNode;
}

export const EditableNode = ({ id, children }: EditableNodeProps) => {
  const selectedId  = useEditorStore((s) => s.selectedId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const editingNodeId = useEditorStore((s) => s.editingNodeId);
  const hoveredId   = useEditorStore((s) => s.hoveredId);
  const select      = useEditorStore((s) => s.select);
  const openContextMenu = useEditorStore((s) => s.openContextMenu);
  const hover       = useEditorStore((s) => s.hover);
  const removeNode  = useEditorStore((s) => s.removeNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const toggleNodeHidden = useEditorStore((s) => s.toggleNodeHidden);
  const toggleNodeLocked = useEditorStore((s) => s.toggleNodeLocked);
  const bringNodeToFront = useEditorStore((s) => s.bringNodeToFront);
  const moveNodeUp  = useEditorStore((s) => s.moveNodeUp);
  const moveNodeDown = useEditorStore((s) => s.moveNodeDown);
  const setEditingNode = useEditorStore((s) => s.setEditingNode);
  const resizeFreeNode = useEditorStore((s) => s.resizeFreeNode);
  const canvasZoom = useEditorStore((s) => s.canvasZoom);
  const node        = useEditorStore((s) => s.tree.nodes[id]);
  const currentDevice = useEditorStore((s) => s.currentDevice);
  const rootId      = useEditorStore((s) => s.tree.rootId);
  const siblings    = useEditorStore((s) => {
    const parent = Object.values(s.tree.nodes).find((n) => n.children.includes(id));
    return parent?.children ?? [];
  });

  const isEditing = editingNodeId === id;
  const isLocked = Boolean(node?.locked);
  const isHidden = Boolean(node?.hidden);
  const isGrouped = typeof node?.props.groupId === "string";
  const hasBindings = node?.props._bindings
    ? Object.keys(node.props._bindings as Record<string, unknown>).length > 0
    : false;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: isEditing || isLocked });

  const isSelected    = selectedId === id || selectedIds.includes(id);
  const isPrimarySelection = selectedId === id;
  const isHovered     = hoveredId === id;
  const isRoot        = id === rootId;
  const siblingIndex  = siblings.indexOf(id);
  const canMoveUp     = siblingIndex > 0;
  const canMoveDown   = siblingIndex < siblings.length - 1;
  const resolvedProps = resolveResponsiveProps(node?.props, currentDevice);
  const isFreePosition = resolvedProps.positionMode === "free" && !isRoot;
  const freeX = toNumber(resolvedProps.x, 0);
  const freeY = toNumber(resolvedProps.y, 0);
  const freeWidth = toOptionalNumber(resolvedProps.width);
  const freeHeight = toOptionalNumber(resolvedProps.height);
  const freeZIndex = toOptionalNumber(resolvedProps.zIndex);
  const gridSize = toNumber(resolvedProps.gridSize, 24);
  const snapToGrid = resolvedProps.snapToGrid !== false;
  const visualStyle = getEditorVisualStyle(resolvedProps);

  const def = node ? blockRegistry[node.type as keyof typeof blockRegistry] : null;
  const accentColor = def ? (CATEGORY_COLORS[def.category] ?? "#6366f1") : "#6366f1";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : freeZIndex,
    ...(isFreePosition
      ? {
          left: freeX,
          top: freeY,
          width: freeWidth ? `${freeWidth}px` : "auto",
          height: freeHeight ? `${freeHeight}px` : undefined,
        }
      : {}),
  } satisfies React.CSSProperties;
  const freeDragProps = isFreePosition && !isEditing && !isLocked ? { ...attributes, ...listeners } : {};
  const toolbarDragProps = isFreePosition || isLocked ? {} : { ...attributes, ...listeners };
  const dragPreview = isFreePosition && isDragging
    ? {
        x: Math.max(0, Math.round(freeX + (transform?.x ?? 0) / (canvasZoom / 100 || 1))),
        y: Math.max(0, Math.round(freeY + (transform?.y ?? 0) / (canvasZoom / 100 || 1))),
      }
    : null;

  return (
    <div
      ref={setNodeRef}
      id={`node-${id}`}
      {...freeDragProps}
      onClick={(e) => {
        e.stopPropagation();
        if (isFreePosition && !isLocked && !(e.shiftKey || e.ctrlKey || e.metaKey)) bringNodeToFront(id);
        select(id, { additive: e.shiftKey || e.ctrlKey || e.metaKey });
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isRoot && !isLocked) setEditingNode(id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        select(id);
        openContextMenu(id, { x: e.clientX, y: e.clientY });
      }}
      onMouseEnter={(e) => { e.stopPropagation(); hover(id); }}
      onMouseLeave={() => hover(null)}
      className={cn(
        "outline-none group",
        "transition-[box-shadow] duration-150",
        isFreePosition ? (isEditing ? "absolute cursor-text editor-free-node" : isLocked ? "absolute cursor-default editor-free-node" : "absolute cursor-move editor-free-node editor-free-node-draggable") : "relative",
        isLocked ? "editor-node-locked" : "",
        isSelected
          ? "ring-2 ring-inset editor-glow-ring"
          : isHovered && !isSelected
          ? "ring-1 ring-inset editor-hover-ring"
          : "",
        isDragging ? "opacity-40 scale-[0.99]" : ""
      )}
      style={{
        ...visualStyle,
        ...style,
        ...(isSelected ? { "--tw-ring-color": isPrimarySelection ? accentColor : "#d946ef" } as React.CSSProperties : {}),
        ...(isSelected ? { boxShadow: `inset 0 0 0 2px ${isPrimarySelection ? accentColor : "#d946ef"}, 0 0 16px ${isPrimarySelection ? accentColor : "#d946ef"}22` } : {}),
      }}
    >
      {dragPreview && (
        <div className="pointer-events-none absolute -top-8 right-0 z-[80] rounded-md border border-slate-900/10 bg-slate-950 px-2 py-1 font-mono text-[10px] font-semibold text-white shadow-xl">
          x:{dragPreview.x} y:{dragPreview.y}
        </div>
      )}

      {/* ── CMS binding indicator ── */}
      {hasBindings && !isRoot && (
        <span
          className="pointer-events-none absolute top-0.5 left-0.5 z-[60] flex items-center gap-0.5 h-4 px-1 rounded text-[8px] font-bold text-sky-300 editor-anim-fade-in"
          style={{ background: "rgba(0,181,246,0.18)", border: "1px solid rgba(0,181,246,0.3)" }}
          title="Nodo con datos CMS vinculados"
        >
          DB
        </span>
      )}

      {/* ── Corner pin indicators (selected) ── */}
      {isSelected && (
        <>
          {/* Top-left */}
          <span className="pointer-events-none absolute top-0 left-0 z-50 w-3 h-3 editor-anim-fade-in"
            style={{ borderTop: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}`, borderRadius: "2px 0 0 0" }} />
          {/* Top-right */}
          <span className="pointer-events-none absolute top-0 right-0 z-50 w-3 h-3 editor-anim-fade-in"
            style={{ borderTop: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}`, borderRadius: "0 2px 0 0" }} />
          {/* Bottom-left */}
          <span className="pointer-events-none absolute bottom-0 left-0 z-50 w-3 h-3 editor-anim-fade-in"
            style={{ borderBottom: `2px solid ${accentColor}`, borderLeft: `2px solid ${accentColor}`, borderRadius: "0 0 0 2px" }} />
          {/* Bottom-right */}
          <span className="pointer-events-none absolute bottom-0 right-0 z-50 w-3 h-3 editor-anim-fade-in"
            style={{ borderBottom: `2px solid ${accentColor}`, borderRight: `2px solid ${accentColor}`, borderRadius: "0 0 2px 0" }} />
        </>
      )}

      {/* ── Floating toolbar ── */}
      {(isSelected || isHovered) && (
        <div
          className="absolute -top-9 left-0 z-50 flex items-center gap-0 rounded-lg shadow-xl shadow-black/50 editor-anim-fade-down overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #131929 0%, #0e1520 100%)",
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}25`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Category color accent */}
          <div className="h-full w-0.5 shrink-0 self-stretch" style={{ background: accentColor }} />

          {/* Drag handle */}
          <div
            {...toolbarDragProps}
            className="cursor-grab px-1.5 py-1 text-slate-600 hover:text-slate-300 transition-colors"
            title={isFreePosition ? "Arrastra el bloque completo" : "Arrastrar para reordenar"}
          >
            <GripVertical size={12} />
          </div>

          <div className="w-px h-4 bg-white/[0.08]" />

          {/* Block type label with category dot */}
          <div className="flex items-center gap-1.5 px-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate max-w-[100px]">
              {def?.label ?? node?.type}
            </span>
            {isGrouped && <Group size={10} className="shrink-0 text-cyan-300" />}
          </div>

          <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

          {!isRoot && (
            <ToolbarBtn
              onClick={() =>
                !isLocked &&
                updateNodeProps(
                  id,
                  isFreePosition
                    ? { positionMode: "flow" }
                    : {
                        positionMode: "free",
                        x: 48,
                        y: 48 + Math.max(0, siblingIndex) * 48,
                        width: getDefaultFreeWidth(node?.type),
                        height: getDefaultFreeHeight(node?.type),
                        snapToGrid: true,
                        gridSize: 24,
                      }
                )
              }
              disabled={isLocked}
              title={isFreePosition ? "Volver a flujo normal" : "Liberar posición X/Y"}
            >
              {isFreePosition ? <Rows3 size={11} /> : <Move size={11} />}
            </ToolbarBtn>
          )}

          <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

          {!isRoot && (
            <ToolbarBtn onClick={() => toggleNodeLocked(id)} title={isLocked ? "Desbloquear" : "Bloquear"}>
              {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
            </ToolbarBtn>
          )}

          {!isRoot && (
            <ToolbarBtn onClick={() => toggleNodeHidden(id)} title={isHidden ? "Mostrar" : "Ocultar"}>
              {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
            </ToolbarBtn>
          )}

          <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

          {/* Move up */}
          <ToolbarBtn
            onClick={() => moveNodeUp(id)}
            disabled={!canMoveUp || isRoot || isLocked}
            title="Subir (↑)"
          >
            <ChevronUp size={11} />
          </ToolbarBtn>

          {/* Move down */}
          <ToolbarBtn
            onClick={() => moveNodeDown(id)}
            disabled={!canMoveDown || isRoot || isLocked}
            title="Bajar (↓)"
          >
            <ChevronDown size={11} />
          </ToolbarBtn>

          {/* Duplicate */}
          {!isRoot && (
            <ToolbarBtn disabled={isLocked} onClick={() => duplicateNode(id)} title="Duplicar (⌘D)">
              <Copy size={11} />
            </ToolbarBtn>
          )}

          <div className="w-px h-4 bg-white/[0.08] mx-0.5" />

          {/* Delete */}
          {!isRoot && (
            <ToolbarBtn
              onClick={() => removeNode(id)}
              disabled={isLocked}
              title="Eliminar (Del)"
              variant="danger"
            >
              <Trash2 size={11} />
            </ToolbarBtn>
          )}

          {/* ID badge */}
          <div className="pl-1 pr-2">
            <span className="text-[9px] font-mono text-slate-700 select-none">
              #{id.slice(-4)}
            </span>
          </div>
        </div>
      )}

      {/* ── Hover label (type indicator) ── */}
      {isHovered && !isSelected && (
        <div
          className="pointer-events-none absolute -top-5 left-0 z-40 flex items-center gap-1 px-1.5 py-0.5 rounded-t text-[9px] font-semibold uppercase tracking-wide editor-anim-fade-in"
          style={{ color: accentColor, background: `${accentColor}18`, borderTop: `1px solid ${accentColor}30` }}
        >
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
          {def?.label ?? node?.type}
        </div>
      )}

      {children}

      {isFreePosition && isSelected && !isEditing && !isLocked && (
        <ResizeHandles
          accentColor={accentColor}
          x={freeX}
          y={freeY}
          width={freeWidth ?? 320}
          height={freeHeight ?? 120}
          scale={canvasZoom / 100 || 1}
          gridSize={gridSize}
          snapToGrid={snapToGrid}
          onResize={(next) => resizeFreeNode(id, next)}
        />
      )}
    </div>
  );
};

type ResizeHandle =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

function ResizeHandles({
  accentColor,
  x,
  y,
  width,
  height,
  scale,
  gridSize,
  snapToGrid,
  onResize,
}: {
  accentColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  gridSize: number;
  snapToGrid: boolean;
  onResize: (next: { x: number; y: number; width: number; height: number }) => void;
}) {
  const [preview, setPreview] = useState<{ width: number; height: number } | null>(null);
  const handles: { type: ResizeHandle; className: string; cursor: string }[] = [
    { type: "nw", className: "-left-1.5 -top-1.5", cursor: "nwse-resize" },
    { type: "n", className: "left-1/2 -top-1.5 -translate-x-1/2", cursor: "ns-resize" },
    { type: "ne", className: "-right-1.5 -top-1.5", cursor: "nesw-resize" },
    { type: "e", className: "-right-1.5 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
    { type: "se", className: "-right-1.5 -bottom-1.5", cursor: "nwse-resize" },
    { type: "s", className: "left-1/2 -bottom-1.5 -translate-x-1/2", cursor: "ns-resize" },
    { type: "sw", className: "-left-1.5 -bottom-1.5", cursor: "nesw-resize" },
    { type: "w", className: "-left-1.5 top-1/2 -translate-y-1/2", cursor: "ew-resize" },
  ];

  const startResize = (
    handle: ResizeHandle,
    event: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const start = { x, y, width, height };

    const move = (moveEvent: PointerEvent | MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      const next = getResizedRect(start, handle, deltaX, deltaY, gridSize, snapToGrid);
      setPreview({ width: next.width, height: next.height });
      onResize(next);
    };

    const stop = () => {
      setPreview(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  };

  return (
    <>
      {preview && (
        <div className="pointer-events-none absolute -bottom-8 left-1/2 z-[75] -translate-x-1/2 rounded-md border border-slate-900/10 bg-slate-950 px-2 py-1 font-mono text-[10px] font-semibold text-white shadow-xl">
          {preview.width} × {preview.height}
        </div>
      )}
      {handles.map((handle) => (
        <button
          key={handle.type}
          type="button"
          aria-label={`Redimensionar ${handle.type}`}
          onPointerDown={(event) => startResize(handle.type, event)}
          onMouseDown={(event) => startResize(handle.type, event)}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className={cn(
            "absolute z-[70] h-3 w-3 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125",
            handle.className
          )}
          style={{ backgroundColor: accentColor, cursor: handle.cursor }}
        />
      ))}
    </>
  );
}

function getResizedRect(
  start: { x: number; y: number; width: number; height: number },
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  gridSize: number,
  snapToGrid: boolean
) {
  const minWidth = 80;
  const minHeight = 40;
  let nextX = start.x;
  let nextY = start.y;
  let nextWidth = start.width;
  let nextHeight = start.height;

  if (handle.includes("e")) nextWidth = start.width + deltaX;
  if (handle.includes("s")) nextHeight = start.height + deltaY;
  if (handle.includes("w")) {
    nextWidth = start.width - deltaX;
    nextX = start.x + deltaX;
  }
  if (handle.includes("n")) {
    nextHeight = start.height - deltaY;
    nextY = start.y + deltaY;
  }

  if (nextWidth < minWidth) {
    if (handle.includes("w")) nextX -= minWidth - nextWidth;
    nextWidth = minWidth;
  }
  if (nextHeight < minHeight) {
    if (handle.includes("n")) nextY -= minHeight - nextHeight;
    nextHeight = minHeight;
  }

  if (snapToGrid) {
    nextX = snap(nextX, gridSize);
    nextY = snap(nextY, gridSize);
    nextWidth = snap(nextWidth, gridSize);
    nextHeight = snap(nextHeight, gridSize);
  } else {
    nextX = Math.round(nextX);
    nextY = Math.round(nextY);
    nextWidth = Math.round(nextWidth);
    nextHeight = Math.round(nextHeight);
  }

  return {
    x: Math.max(0, nextX),
    y: Math.max(0, nextY),
    width: Math.max(minWidth, nextWidth),
    height: Math.max(minHeight, nextHeight),
  };
}

function snap(value: number, gridSize: number) {
  const size = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 24;
  return Math.round(value / size) * size;
}

function ToolbarBtn({
  children,
  onClick,
  title,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "grid h-6 w-6 place-items-center rounded transition-all duration-150",
        "disabled:opacity-20 disabled:cursor-not-allowed",
        variant === "danger"
          ? "text-slate-500 hover:bg-red-500/15 hover:text-red-400 hover:scale-110"
          : "text-slate-500 hover:bg-white/8 hover:text-slate-100 hover:scale-110"
      )}
    >
      {children}
    </button>
  );
}

function toNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toOptionalNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function getDefaultFreeWidth(type: string | undefined) {
  if (type === "heading") return 520;
  if (type === "text") return 460;
  if (type === "ctaButton") return 220;
  if (type === "image") return 420;
  if (type === "section") return 760;
  return 420;
}

function getDefaultFreeHeight(type: string | undefined) {
  if (type === "heading") return 96;
  if (type === "text") return 120;
  if (type === "ctaButton") return 64;
  if (type === "image") return 260;
  if (type === "section") return 360;
  return 180;
}
