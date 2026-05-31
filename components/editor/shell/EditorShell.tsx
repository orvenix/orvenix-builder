"use client";

import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type DragMoveEvent,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { useEffect, useRef, useState } from "react";
import { BlocksSidebar } from "@/components/editor/sidebar/BlocksSidebar";
import { Canvas } from "@/components/editor/Canvas";
import { SettingsPanel } from "@/components/editor/inspector/SettingsPanel";
import { TemplatesPanel } from "@/components/editor/sidebar/TemplatesPanel";
import { LayersPanel } from "@/components/editor/sidebar/LayersPanel";
import { AiAssistantPanel } from "@/components/editor/sidebar/AiAssistantPanel";
import { BindModePanel } from "@/components/editor/sidebar/BindModePanel";
import { AnimationsPanel } from "@/components/editor/sidebar/AnimationsPanel";
import { SEOPanel } from "@/components/editor/SEOPanel";
import { useAutosave } from "@/hooks/useAutosave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { FloatingSaveIndicator } from "@/components/editor/toolbar/FloatingSaveIndicator";
import { EditorContextMenu } from "@/components/editor/toolbar/EditorContextMenu";
import { MediaCenter } from "@/components/editor/MediaCenter";
import { getDefaultFreeBlockSize } from "@/components/editor/freeInsert";
import { resolveResponsiveProps } from "@/components/editor/responsive";
import * as Icons from "lucide-react";
import type { DeviceMode, EditorTree, NodeId } from "@/types/editor";

type SidebarTab = "ai" | "bloques" | "capas" | "templates" | "cms" | "animaciones";

const TABS: {
  id: SidebarTab;
  icon: keyof typeof Icons;
  label: string;
  accent: string;
}[] = [
  { id: "ai",          icon: "Sparkles",      label: "Orvenix AI",    accent: "#00b5f6" },
  { id: "bloques",     icon: "LayoutGrid",    label: "Bloques",       accent: "#009cd4" },
  { id: "capas",       icon: "Layers",        label: "Capas",         accent: "#0083b3" },
  { id: "templates",   icon: "LayoutTemplate",label: "Sitios reales", accent: "#00bbff" },
  { id: "cms",         icon: "Database",      label: "Datos CMS",     accent: "#00b5f6" },
  { id: "animaciones", icon: "PlayCircle",    label: "Animaciones",   accent: "#006a91" },
];

export function EditorShell() {
  useAutosave();
  useKeyboardShortcuts();

  const rootChildCount = useEditorStore((s) => s.tree.nodes[s.tree.rootId]?.children?.length ?? 0);
  const websiteId = useEditorStore((s) => s.websiteId ?? "");
  const layersHighlightId = useEditorStore((s) => s.layersHighlightId);
  const seoOpen    = useEditorStore((s) => s.seoOpen);
  const setSeoOpen = useEditorStore((s) => s.setSeoOpen);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>(
    rootChildCount === 0 ? "templates" : "bloques"
  );

  // Auto-switch to layers tab when a node is highlighted via context menu.
  // Deferred to avoid synchronous setState inside effect.
  useEffect(() => {
    if (!layersHighlightId) return;
    const id = window.setTimeout(() => setSidebarTab("capas"), 0);
    return () => window.clearTimeout(id);
  }, [layersHighlightId]);
  const latestPointerRef = useRef<{ x: number; y: number } | null>(null);
  const latestCanvasPointRef = useRef<{ x: number; y: number } | null>(null);
  const tree = useEditorStore((s) => s.tree);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const currentDevice = useEditorStore((s) => s.currentDevice);
  const canvasZoom = useEditorStore((s) => s.canvasZoom);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const select = useEditorStore((s) => s.select);
  const reorderChildren = useEditorStore((s) => s.reorderChildren);
  const addNode = useEditorStore((s) => s.addNode);
  const moveFreeNodesByDelta = useEditorStore((s) => s.moveFreeNodesByDelta);
  const bringNodeToFront = useEditorStore((s) => s.bringNodeToFront);
  const setSmartGuides = useEditorStore((s) => s.setSmartGuides);
  const clearSmartGuides = useEditorStore((s) => s.clearSmartGuides);
  const canvasGridSize = useEditorStore((s) => s.canvasGridSize);

  // Track Shift key for free-drag mode (disables snap)
  const shiftKeyRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const updatePointer = (event: PointerEvent | MouseEvent) => {
      latestPointerRef.current = { x: event.clientX, y: event.clientY };
      latestCanvasPointRef.current = getCanvasPointFromClient(latestPointerRef.current, canvasZoom);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Shift") shiftKeyRef.current = true; };
    const onKeyUp   = (e: KeyboardEvent) => { if (e.key === "Shift") shiftKeyRef.current = false; };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("pointerdown", updatePointer, { passive: true });
    window.addEventListener("mousemove", updatePointer, { passive: true });
    window.addEventListener("mousedown", updatePointer, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("pointerdown", updatePointer);
      window.removeEventListener("mousemove", updatePointer);
      window.removeEventListener("mousedown", updatePointer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [canvasZoom]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    const activeNode = tree.nodes[activeId];
    if (resolveResponsiveProps(activeNode?.props, currentDevice).positionMode !== "free") return;

    if (!selectedIds.includes(activeId)) {
      select(activeId);
    }
    bringNodeToFront(activeId);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const activeId = String(event.active.id);
    const activeNode = tree.nodes[activeId];
    const activeProps = resolveResponsiveProps(activeNode?.props, currentDevice);
    if (activeProps.positionMode !== "free") {
      clearSmartGuides();
      return;
    }

    const movingIds = getMovingFreeIds(tree, currentDevice, activeId, selectedIds);
    const scale = canvasZoom / 100 || 1;
    const deltaX = event.delta.x / scale;
    const deltaY = event.delta.y / scale;
    setSmartGuides(getSmartGuides(tree, currentDevice, movingIds, deltaX, deltaY));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeNode = tree.nodes[active.id as string];
    const activeProps = resolveResponsiveProps(activeNode?.props, currentDevice);
    if (activeProps.positionMode === "free") {
      const scale = canvasZoom / 100 || 1;
      const movingIds = getMovingFreeIds(tree, currentDevice, activeNode.id, selectedIds);
      const currentX = Number(activeProps.x ?? 0);
      const currentY = Number(activeProps.y ?? 0);
      const gridSize = canvasGridSize || Number(activeProps.gridSize ?? 24);
      const snapDisabled = shiftKeyRef.current || canvasGridSize === 0;
      const nextX = currentX + event.delta.x / scale;
      const nextY = currentY + event.delta.y / scale;
      const deltaX = nextX - currentX;
      const deltaY = nextY - currentY;

      let x = snapDisabled ? Math.round(nextX) : Math.round(nextX / gridSize) * gridSize;
      let y = snapDisabled ? Math.round(nextY) : Math.round(nextY / gridSize) * gridSize;

      // Magnetic snap to guides (overrides grid snap, disabled by Shift)
      if (!shiftKeyRef.current) {
        const guides = getSmartGuides(tree, currentDevice, movingIds, deltaX, deltaY);
        const vGuide = guides.find((g): g is Extract<typeof g, { type: "vertical" }> => g.type === "vertical" && g.snapCorrectionX !== undefined);
        const hGuide = guides.find((g): g is Extract<typeof g, { type: "horizontal" }> => g.type === "horizontal" && g.snapCorrectionY !== undefined);
        if (vGuide?.snapCorrectionX !== undefined) x = Math.round(currentX + deltaX + vGuide.snapCorrectionX);
        if (hGuide?.snapCorrectionY !== undefined) y = Math.round(currentY + deltaY + hGuide.snapCorrectionY);
      }

      moveFreeNodesByDelta(movingIds, Math.max(0, x) - currentX, Math.max(0, y) - currentY);
      clearSmartGuides();
      return;
    }
    clearSmartGuides();

    if (active.data.current?.kind === "new-block") {
      const freeDropProps = getCanvasDropProps(
        event,
        canvasZoom,
        active.data.current.blockType as string,
        latestPointerRef.current,
        getCanvasPointFromClient(latestPointerRef.current, canvasZoom) ?? latestCanvasPointRef.current
      );
      if (freeDropProps) {
        addNode({
          type: active.data.current.blockType as string,
          parentId: tree.rootId,
          props: freeDropProps,
        });
      }
      return;
    }
    if (over && active.id !== over.id) {
      const children = tree.nodes[tree.rootId]?.children ?? [];
      const oldIndex = children.indexOf(active.id as string);
      const newIndex = children.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderChildren(tree.rootId, arrayMove(children, oldIndex, newIndex));
      }
    }
  };

  const activeTab = TABS.find((t) => t.id === sidebarTab)!;
  const panelWidth =
    sidebarTab === "ai" || sidebarTab === "cms" || sidebarTab === "animaciones"
      ? "w-72 xl:w-80"
      : sidebarTab === "templates"
        ? "w-80 xl:w-96"
        : "w-56 xl:w-60";

  const editor = (
    <div className="flex min-h-0 min-w-0 flex-1 page-transition">
      <FloatingSaveIndicator />
      {!isPreviewMode && <EditorContextMenu />}
      {!isPreviewMode && <MediaCenter />}

      {!isPreviewMode && (
        <div className="flex min-h-0 shrink-0">

          {/* Icon rail */}
          <nav className="relative flex flex-col items-center gap-0.5 w-11 shrink-0 border-r border-white/[0.05] py-2"
            style={{ background: "linear-gradient(180deg, #112540 0%, #172f52 100%)" }}>

            {/* Top glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,181,246,0.20)] to-transparent" />

            {TABS.map((tab) => {
              const Icon = Icons[tab.icon] as React.ComponentType<{ size?: number }>;
              const isActive = sidebarTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  title={tab.label}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`relative grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "text-white"
                      : "text-slate-600 hover:text-slate-300"
                  }`}
                >
                  {/* Active background */}
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-xl editor-anim-scale-in"
                      style={{
                        background: `radial-gradient(circle at center, ${tab.accent}22 0%, ${tab.accent}0a 100%)`,
                        border: `1px solid ${tab.accent}30`,
                        boxShadow: `0 0 12px ${tab.accent}20`,
                      }}
                    />
                  )}

                  {/* Active left indicator */}
                  {isActive && (
                    <span
                      className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full editor-anim-scale-in"
                      style={{
                        background: `linear-gradient(to bottom, ${tab.accent}, ${tab.accent}88)`,
                        boxShadow: `0 0 6px ${tab.accent}`,
                      }}
                    />
                  )}

                  <span className="relative">
                    <Icon size={15} />
                  </span>

                  {/* Hover tooltip */}
                  <span className="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-md border border-white/[0.08] bg-[color:var(--bg-2)] px-2 py-1 text-[11px] font-medium text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1">
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* Separator */}
            <div className="my-1 h-px w-6 bg-white/[0.06] rounded-full" />

            {/* Extra actions */}
            {([
              { icon: "HelpCircle" as keyof typeof Icons, label: "Ayuda" },
              { icon: "Settings2" as keyof typeof Icons, label: "Configuración" },
            ] as const).map(({ icon, label }) => {
              const Icon = Icons[icon] as React.ComponentType<{ size?: number }>;
              return (
                <button
                  key={label}
                  type="button"
                  title={label}
                  className="relative group grid h-9 w-9 place-items-center rounded-xl text-slate-700 hover:text-slate-400 transition-colors"
                >
                  <Icon size={13} />
                  <span className="pointer-events-none absolute left-11 z-50 whitespace-nowrap rounded-md border border-white/[0.08] bg-[color:var(--bg-2)] px-2 py-1 text-[11px] font-medium text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-1">
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Panel content */}
          <div
            className={`${panelWidth} flex min-h-0 flex-col overflow-hidden border-r border-white/[0.05] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]`}
            style={{ background: "var(--bg)" }}
          >
            {/* Tab header */}
            <div
              className="flex items-center gap-2.5 px-4 py-2.5 border-b border-white/[0.05] shrink-0"
              style={{ background: "linear-gradient(180deg, var(--bg-2) 0%, var(--bg) 100%)" }}
            >
              <span
                className="text-[11px] font-semibold tracking-wide"
                style={{ color: activeTab.accent }}
              >
                {activeTab.label}
              </span>
              {/* Tab accent line */}
              <div className="flex-1 h-px rounded-full" style={{ background: `linear-gradient(to right, ${activeTab.accent}40, transparent)` }} />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <div className={sidebarTab === "ai" ? "section-transition h-full" : "hidden"}>
                <AiAssistantPanel />
              </div>
              <div className={sidebarTab === "bloques" ? "section-transition h-full" : "hidden"}>
                <BlocksSidebar />
              </div>
              <div className={sidebarTab === "capas" ? "section-transition h-full" : "hidden"}>
                <LayersPanel />
              </div>
              <div className={sidebarTab === "templates" ? "section-transition h-full" : "hidden"}>
                <TemplatesPanel />
              </div>
              <div className={sidebarTab === "cms" ? "section-transition h-full overflow-auto" : "hidden"}>
                <BindModePanel siteId={websiteId} />
              </div>
              <div className={sidebarTab === "animaciones" ? "section-transition h-full overflow-auto" : "hidden"}>
                <AnimationsPanel />
              </div>
            </div>
          </div>
        </div>
      )}

      <Canvas />
      {!isPreviewMode && <SettingsPanel />}
      {!isPreviewMode && seoOpen && (
        <SEOPanel onClose={() => setSeoOpen(false)} />
      )}
    </div>
  );

  if (isPreviewMode) return editor;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={clearSmartGuides}
    >
      {editor}
    </DndContext>
  );
}

type FreeRect = {
  id: NodeId;
  x: number;
  y: number;
  width: number;
  height: number;
};

const GUIDE_THRESHOLD = 6;
const CANVAS_WIDTH = 1200;
const CANVAS_MIN_HEIGHT = 720;

function getMovingFreeIds(tree: EditorTree, device: DeviceMode, activeId: NodeId, selectedIds: NodeId[]) {
  const baseIds = selectedIds.includes(activeId) ? selectedIds : [activeId];
  const groupIds = new Set(
    baseIds
      .map((id) => tree.nodes[id]?.props.groupId)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );
  const ids = new Set(baseIds);

  if (groupIds.size > 0) {
    Object.values(tree.nodes).forEach((node) => {
      if (typeof node.props.groupId === "string" && groupIds.has(node.props.groupId)) {
        ids.add(node.id);
      }
    });
  }

  return Array.from(ids).filter((id) => {
    const node = tree.nodes[id];
    const props = resolveResponsiveProps(node?.props, device);
    return Boolean(node && !node.locked && props.positionMode === "free");
  });
}

function getFreeRect(tree: EditorTree, device: DeviceMode, id: NodeId): FreeRect | null {
  const node = tree.nodes[id];
  const props = resolveResponsiveProps(node?.props, device);
  if (!node || props.positionMode !== "free") return null;
  return {
    id,
    x: toFiniteNumber(props.x, 0),
    y: toFiniteNumber(props.y, 0),
    width: toFiniteNumber(props.width, 320),
    height: toFiniteNumber(props.height, 120),
  };
}

function getSmartGuides(tree: EditorTree, device: DeviceMode, movingIds: NodeId[], deltaX: number, deltaY: number) {
  const movingSet = new Set(movingIds);
  const movingRects = movingIds
    .map((id) => getFreeRect(tree, device, id))
    .filter((rect): rect is FreeRect => Boolean(rect))
    .map((rect) => ({ ...rect, x: rect.x + deltaX, y: rect.y + deltaY }));

  const staticRects = Object.keys(tree.nodes)
    .filter((id) => !movingSet.has(id))
    .map((id) => getFreeRect(tree, device, id))
    .filter((rect): rect is FreeRect => Boolean(rect));

  const guides: ReturnType<typeof useEditorStore.getState>["smartGuides"] = [];
  const targets = [
    ...staticRects,
    {
      id: "canvas",
      x: 0,
      y: 0,
      width: CANVAS_WIDTH,
      height: Math.max(
        CANVAS_MIN_HEIGHT,
        ...Object.values(tree.nodes).map((node) => {
          const props = resolveResponsiveProps(node.props, device);
          return toFiniteNumber(props.y, 0) + toFiniteNumber(props.height, 120);
        })
      ),
    },
  ];

  for (const moving of movingRects) {
    const movingXPoints = [
      { value: moving.x, key: "left" },
      { value: moving.x + moving.width / 2, key: "center-x" },
      { value: moving.x + moving.width, key: "right" },
    ];
    const movingYPoints = [
      { value: moving.y, key: "top" },
      { value: moving.y + moving.height / 2, key: "center-y" },
      { value: moving.y + moving.height, key: "bottom" },
    ];

    for (const target of targets) {
      const targetXPoints = [
        { value: target.x, key: "left" },
        { value: target.x + target.width / 2, key: "center-x" },
        { value: target.x + target.width, key: "right" },
      ];
      const targetYPoints = [
        { value: target.y, key: "top" },
        { value: target.y + target.height / 2, key: "center-y" },
        { value: target.y + target.height, key: "bottom" },
      ];

      for (const source of movingXPoints) {
        for (const destination of targetXPoints) {
          if (Math.abs(source.value - destination.value) <= GUIDE_THRESHOLD) {
            // snapCorrectionX: extra delta to apply so this source point aligns to destination
            const snapCorrectionX = destination.value - source.value;
            guides.push({
              type: "vertical",
              x: destination.value,
              key: `v-${moving.id}-${target.id}-${source.key}-${destination.key}`,
              snapCorrectionX,
            });
          }
        }
      }

      for (const source of movingYPoints) {
        for (const destination of targetYPoints) {
          if (Math.abs(source.value - destination.value) <= GUIDE_THRESHOLD) {
            const snapCorrectionY = destination.value - source.value;
            guides.push({
              type: "horizontal",
              y: destination.value,
              key: `h-${moving.id}-${target.id}-${source.key}-${destination.key}`,
              snapCorrectionY,
            });
          }
        }
      }
    }
  }

  return guides.slice(0, 12);
}

function getCanvasDropProps(
  event: DragEndEvent,
  canvasZoom: number,
  blockType: string,
  latestPointer: { x: number; y: number } | null,
  latestCanvasPoint: { x: number; y: number } | null
) {
  const canvas = document.querySelector<HTMLElement>("[data-editor-canvas='true']");
  const size = getDefaultFreeBlockSize(blockType);
  if (!canvas) {
    return null;
  }

  const canvasPoint = latestCanvasPoint ?? getCanvasPointFromClient(
    [
      ...(latestPointer ? [latestPointer] : []),
      ...getDragEndPointers(event),
    ][0] ?? null,
    canvasZoom
  );
  if (!canvasPoint) return null;

  const { width, height } = size;
  const x = canvasPoint.x - width / 2;
  const y = canvasPoint.y - 32;

  return {
    positionMode: "free",
    x: Math.max(0, Math.round(x / 24) * 24),
    y: Math.max(0, Math.round(y / 24) * 24),
    width,
    height,
    snapToGrid: true,
    gridSize: 24,
  };
}

function getCanvasPointFromClient(pointer: { x: number; y: number } | null, canvasZoom: number) {
  const canvas = document.querySelector<HTMLElement>("[data-editor-canvas='true']");
  if (!canvas || !pointer) return null;

  const rect = canvas.getBoundingClientRect();
  const isInsideCanvas =
    pointer.x >= rect.left &&
    pointer.x <= rect.right &&
    pointer.y >= rect.top &&
    pointer.y <= rect.bottom;
  if (!isInsideCanvas) return null;

  const scale = canvasZoom / 100 || 1;
  return {
    x: (pointer.x - rect.left) / scale,
    y: (pointer.y - rect.top) / scale,
  };
}

function getDragEndPointers(event: DragEndEvent) {
  const pointers: Array<{ x: number; y: number }> = [];
  const translated = event.active.rect.current.translated;
  if (translated) {
    pointers.push({
      x: translated.left + translated.width / 2,
      y: translated.top + translated.height / 2,
    });
  }

  const activator = event.activatorEvent;
  if (isPointerLikeEvent(activator)) {
    pointers.push({
      x: activator.clientX + event.delta.x,
      y: activator.clientY + event.delta.y,
    });
  }

  if (isTouchLikeEvent(activator) && activator.changedTouches[0]) {
    pointers.push({
      x: activator.changedTouches[0].clientX + event.delta.x,
      y: activator.changedTouches[0].clientY + event.delta.y,
    });
  }

  return pointers;
}

function isPointerLikeEvent(event: Event): event is MouseEvent | PointerEvent {
  return "clientX" in event && "clientY" in event;
}

function isTouchLikeEvent(event: Event): event is TouchEvent {
  return "changedTouches" in event;
}

function toFiniteNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
