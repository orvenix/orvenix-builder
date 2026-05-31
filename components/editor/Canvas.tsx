"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DynamicRenderer } from "@/components/editor/DynamicRenderer";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { DEVICE_WIDTHS } from "@/store/useEditorStore";
import { getFreeInsertProps } from "@/components/editor/freeInsert";
import { resolveResponsiveProps } from "@/components/editor/responsive";
import {
  ZoomIn, ZoomOut, Maximize2, Minimize2,
  LayoutTemplate, Sparkles, MousePointerClick,
  MessageSquarePlus,
} from "lucide-react";
import type { EditorTree, NodeId, EditorComment } from "@/types/editor";
import { generateSectionAI } from "@/app/actions/ai";

const ZOOM_STEPS = [50, 75, 100, 125, 150] as const;

const DEVICE_CONFIG: Record<string, { label: string; icon: string }> = {
  desktop: { label: "Escritorio",  icon: "🖥" },
  lg:      { label: "Laptop",      icon: "💻" },
  tablet:  { label: "Tablet",      icon: "⬜" },
  sm:      { label: "Móvil L",     icon: "▯" },
  mobile:  { label: "Móvil",       icon: "📱" },
};

type AIGenerateEvent = CustomEvent<{ prompt: string }>;
type NavigateToCommentEvent = CustomEvent<{ x: number; y: number }>;

function resetFrameHead(doc: Document) {
  doc.head.innerHTML = "";
}

function applyFrameEditorDevice(doc: Document, deviceMode: string) {
  doc.body.dataset.editorDevice = deviceMode;
  doc.documentElement.dataset.editorDevice = deviceMode;
}

export const Canvas = () => {
  const currentDevice = useEditorStore((s) => s.currentDevice);
  const websiteId = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const isPreviewMode = useEditorStore((s) => s.isPreviewMode);
  const isResponsivePreviewMode = useEditorStore((s) => s.isResponsivePreviewMode);
  const select        = useEditorStore((s) => s.select);
  const selectMany    = useEditorStore((s) => s.selectMany);
  const closeContextMenu = useEditorStore((s) => s.closeContextMenu);
  const setCanvasZoom = useEditorStore((s) => s.setCanvasZoom);
  const smartGuides   = useEditorStore((s) => s.smartGuides);
  const isCommentMode = useEditorStore((s) => s.isCommentMode);
  const addComment    = useEditorStore((s) => s.addComment);
  const resolveComment = useEditorStore((s) => s.resolveComment);
  const setLastCanvasPoint = useEditorStore((s) => s.setLastCanvasPoint);
  const comments      = useEditorStore((s) => s.tree.comments ?? {});
  const tree          = useEditorStore((s) => s.tree);
  const rootChildren  = useEditorStore((s) => s.tree.nodes[s.tree.rootId]?.children ?? []);
  const clipboardTree = useEditorStore((s) => s.clipboardTree);
  const pasteNodeAt = useEditorStore((s) => s.pasteNodeAt);
  const addNode = useEditorStore((s) => s.addNode);
  const rootId = useEditorStore((s) => s.tree.rootId);

  const [zoom, setZoom] = useState(100);
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  const setCanvasRefs = useCallback((node: HTMLDivElement | null) => {
    canvasRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  const changeZoom = (delta: number) => {
    setZoom((z) => {
      const idx = ZOOM_STEPS.indexOf(z as (typeof ZOOM_STEPS)[number]);
      if (idx === -1) return Math.min(150, Math.max(50, z + delta));
      const next = idx + (delta > 0 ? 1 : -1);
      return ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, next))] ?? z;
    });
  };

  const fitToWidth = useCallback(() => {
    const viewport = viewportRef.current;
    const deviceWidth = Number.parseInt(DEVICE_WIDTHS[currentDevice], 10);
    if (!viewport || Number.isNaN(deviceWidth)) { setZoom(100); return; }
    const available = Math.max(viewport.clientWidth - 48, 240);
    setZoom(Math.min(100, Math.max(50, Math.floor((available / deviceWidth) * 100))));
  }, [currentDevice]);

  useEffect(() => { fitToWidth(); }, [fitToWidth]);
  useEffect(() => { setCanvasZoom(zoom); }, [setCanvasZoom, zoom]);

  // Listener para Generación de Secciones con IA (Nivel 4)
  useEffect(() => {
    const handleAIGenerate = async (e: AIGenerateEvent) => {
      const { prompt } = e.detail;
      const rootId = useEditorStore.getState().tree.rootId;
      
      // Llamada al servidor (Server Action)
      const result = await generateSectionAI(prompt, [], [], {
        siteId: websiteId,
        pageSlug: activePageSlug,
        source: "canvas_quick_generate",
      });
      
      if (result.success) {
        useEditorStore.getState().insertTree({
          tree: result.tree,
          parentId: rootId
        });
      }
    };

    window.addEventListener("orvenix:ai-generate-section", handleAIGenerate as EventListener);
    return () => window.removeEventListener("orvenix:ai-generate-section", handleAIGenerate as EventListener);
  }, [activePageSlug, websiteId]);

  // Listener para Navegación a Comentarios (Fase 4.2)
  useEffect(() => {
    const handleNavigate = (e: NavigateToCommentEvent) => {
      const { x, y } = e.detail;
      viewportRef.current?.scrollTo({
        left: x * (zoom / 100) - viewportRef.current.clientWidth / 2,
        top: y * (zoom / 100) - 200,
        behavior: "smooth"
      });
    };
    window.addEventListener("orvenix:navigate-to-comment", handleNavigate as EventListener);
    return () => window.removeEventListener("orvenix:navigate-to-comment", handleNavigate as EventListener);
  }, [zoom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const ro = new ResizeObserver(() => {
      const deviceWidth = Number.parseInt(DEVICE_WIDTHS[currentDevice], 10);
      if (Number.isNaN(deviceWidth)) return;
      const available = Math.max(viewport.clientWidth - 48, 240);
      const maxZoom = Math.min(100, Math.max(50, Math.floor((available / deviceWidth) * 100)));
      setZoom((z) => Math.min(z, maxZoom));
    });
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [currentDevice]);

  const isEmpty = rootChildren.length === 0;
  const rendererMode = isPreviewMode ? "preview" : "edit";
  const freeCanvasHeight = getFreeCanvasHeight(tree, currentDevice);
  const deviceWidth = DEVICE_WIDTHS[currentDevice];
  const usesStrictViewport = currentDevice !== "desktop";
  const displayZoom = currentDevice === "desktop" ? 100 : zoom;
  const displayScale = displayZoom / 100;
  const scaledWidth = currentDevice === "desktop"
    ? "100%"
    : `calc(${deviceWidth} * ${displayScale})`;

  const dc = DEVICE_CONFIG[currentDevice] ?? DEVICE_CONFIG.desktop;
  const marqueeBox = marquee ? getMarqueeBox(marquee) : null;

  const startMarquee = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isInteractiveTarget = Boolean(
      target.closest(".editor-free-node, button, input, textarea, select, a, [contenteditable='true']")
    );
    if (event.button !== 0 || currentDevice !== "desktop" || isInteractiveTarget) return;

    const point = getCanvasPoint(event, canvasRef.current, zoom);
    if (!point) return;
    setLastCanvasPoint(point);

    closeContextMenu();
    setCanvasMenu(null);
    select(null);
    setMarquee({ startX: point.x, startY: point.y, currentX: point.x, currentY: point.y });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateMarquee = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getCanvasPoint(event, canvasRef.current, zoom);
    if (point) setLastCanvasPoint(point);
    if (!marquee) return;

    if (!point) return;

    const nextMarquee = { ...marquee, currentX: point.x, currentY: point.y };
    setMarquee(nextMarquee);
    selectMany(getNodesInsideMarquee(tree, currentDevice, getMarqueeBox(nextMarquee)));
  };

  const finishMarquee = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!marquee) return;
    setMarquee(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    const point = getCanvasPoint(event, canvasRef.current, zoom);
    if (point) setLastCanvasPoint(point);
    if (!isCommentMode) return;
    
    if (!point) return;

    const text = window.prompt("¿Qué ajuste necesitas en este punto?");
    if (text) {
      addComment(point.x, point.y, text);
    }
  };

  const openCanvasMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPreviewMode || isCommentMode) return;
    const target = event.target as HTMLElement;
    if (target.closest(".editor-free-node, button, input, textarea, select, a, [contenteditable='true']")) return;
    const point = getCanvasPoint(event, canvasRef.current, zoom);
    if (!point) return;

    event.preventDefault();
    event.stopPropagation();
    closeContextMenu();
    select(null);
    setLastCanvasPoint(point);
    setCanvasMenu({ x: event.clientX, y: event.clientY, point });
  };

  useEffect(() => {
    if (!canvasMenu) return;
    const close = () => setCanvasMenu(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCanvasMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", close);
    };
  }, [canvasMenu]);

  if (isPreviewMode && isResponsivePreviewMode) {
    return (
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#070b12]">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#070b12]/90 px-4 py-2 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-sky-300">Responsive preview</span>
            <span className="text-[11px] text-slate-600">Desktop · Tablet · Mobile</span>
          </div>
          <span className="text-[10px] text-slate-700">{rootChildren.length} bloques</span>
        </div>
        <div className="flex flex-1 items-start gap-5 overflow-auto p-5">
          <ResponsivePreviewFrame device="desktop" label="Desktop" widthLabel="100%" frameWidth={1180} tree={tree} />
          <ResponsivePreviewFrame device="tablet" label="Tablet" widthLabel={DEVICE_WIDTHS.tablet} frameWidth={768} tree={tree} />
          <ResponsivePreviewFrame device="mobile" label="Mobile" widthLabel={DEVICE_WIDTHS.mobile} frameWidth={375} tree={tree} />
        </div>
      </main>
    );
  }

  return (
    <main
      className={cn(
        "relative flex min-w-0 flex-1 flex-col overflow-hidden",
        isPreviewMode ? "bg-white" : "editor-canvas-bg"
      )}
      onClick={isPreviewMode ? undefined : () => select(null)}
    >
      {/* ── Device label bar ── */}
      {!isPreviewMode && (
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-1.5 shrink-0 border-b border-white/[0.04]"
        style={{ background: "rgba(17,37,64,0.85)", backdropFilter: "blur(12px)" }}>

        <div className="flex items-center gap-2">
          <span className="text-[11px]">{dc.icon}</span>
          <span className="text-[11px] font-medium text-slate-400">{dc.label}</span>
          <span className="text-[11px] font-mono text-slate-600">{DEVICE_WIDTHS[currentDevice]}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Node count */}
          <span className="text-[10px] text-slate-700 font-medium">
            {rootChildren.length} {rootChildren.length === 1 ? "bloque" : "bloques"}
          </span>
          {/* Zoom quick badge */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoom(100); }}
            className="text-[10px] font-mono text-slate-600 hover:text-slate-300 transition-colors px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08]"
          >
            {zoom}%
          </button>
        </div>
      </div>
      )}

      {/* ── Canvas scrollable ── */}
      <div
        ref={viewportRef}
        className={cn(
          "flex flex-1 items-start justify-center overflow-auto",
          isPreviewMode
            ? currentDevice === "desktop" ? "p-0" : "bg-[color:var(--bg)] p-6 lg:p-10"
            : currentDevice === "desktop" ? "p-0" : "p-3 lg:p-5"
        )}
        onClick={isPreviewMode ? undefined : () => select(null)}
      >
        <div className={cn("shrink-0", currentDevice === "desktop" && "w-full")} style={{ width: scaledWidth }}>
          <div style={{ transform: `scale(${displayScale})`, transformOrigin: "top center", width: deviceWidth }}>

            {/* Page shadow frame */}
            <div className="relative">
              {/* Canvas content */}
              <div
                ref={setCanvasRefs}
                data-editor-canvas="true"
                className={cn(
                  "editor-free-canvas relative min-h-[720px] overflow-visible bg-white transition-all duration-300",
                  !isPreviewMode && currentDevice !== "desktop" ? "rounded-lg" : "",
                  isOver && !isPreviewMode ? "ring-2 ring-[color:var(--accent)] ring-inset" : "",
                )}
                style={{
                  minHeight: freeCanvasHeight,
                  boxShadow: isPreviewMode && currentDevice === "desktop"
                    ? "none"
                    : currentDevice === "desktop" ? "none" : "0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
                  cursor: isCommentMode ? "crosshair" : "default"
                }}
                onClick={isCommentMode ? handleCanvasClick : (isPreviewMode ? undefined : (e) => e.stopPropagation())}
                onPointerDown={isPreviewMode ? undefined : startMarquee}
                onPointerMove={isPreviewMode ? undefined : updateMarquee}
                onPointerUp={isPreviewMode ? undefined : finishMarquee}
                onPointerCancel={isPreviewMode ? undefined : finishMarquee}
                onContextMenuCapture={openCanvasMenu}
                onContextMenu={openCanvasMenu}
              >
                {!isPreviewMode && smartGuides.map((guide) =>
                  guide.type === "vertical" ? (
                    <div key={guide.key} className="pointer-events-none absolute top-0 h-full" style={{ left: guide.x, zIndex: 998 }}>
                      <div className="absolute inset-y-0 left-0 w-px bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.75)]" />
                      <span className="absolute top-2 left-1 rounded bg-fuchsia-900/80 px-1 py-0.5 font-mono text-[9px] text-fuchsia-200 shadow">
                        {Math.round(guide.x)}
                      </span>
                    </div>
                  ) : (
                    <div key={guide.key} className="pointer-events-none absolute left-0 w-full" style={{ top: guide.y, zIndex: 998 }}>
                      <div className="absolute inset-x-0 top-0 h-px bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.75)]" />
                      <span className="absolute left-2 top-1 rounded bg-fuchsia-900/80 px-1 py-0.5 font-mono text-[9px] text-fuchsia-200 shadow">
                        {Math.round(guide.y)}
                      </span>
                    </div>
                  )
                )}

                {/* Comment Pins (DIFM Mode) */}
                {Object.values(comments).map((comment: EditorComment) => (
                  comment.status === "open" && (
                    <div
                      key={comment.id}
                      className="absolute z-[999] group"
                      style={{ left: comment.x, top: comment.y }}
                    >
                      <div className="relative -left-1/2 -top-1/2 w-6 h-6 bg-indigo-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform"
                           onClick={(e) => { e.stopPropagation(); if(confirm(`¿Resolver comentario: "${comment.text}"?`)) resolveComment(comment.id); }}>
                        <MessageSquarePlus size={12} />
                        <div className="absolute left-8 top-0 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                          <span className="font-bold block mb-0.5">{comment.author}</span>
                          {comment.text}
                        </div>
                      </div>
                    </div>
                  )
                ))}

                {usesStrictViewport ? (
                  <DeviceShell type={currentDevice}>
                    {isPreviewMode ? (
                      <StrictViewportFrame
                        title={`Preview ${dc.label}`}
                        deviceMode={currentDevice}
                        viewportWidth={deviceWidth}
                        onClick={undefined}
                      >
                        <DynamicRenderer mode={rendererMode} />
                      </StrictViewportFrame>
                    ) : (
                      <div
                        className="relative w-full bg-white"
                        data-editor-device={currentDevice}
                        style={{ minHeight: freeCanvasHeight }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DynamicRenderer mode={rendererMode} />
                      </div>
                    )}
                  </DeviceShell>
                ) : (
                  <DynamicRenderer mode={rendererMode} />
                )}

                {/* Drop overlay */}
                {isOver && !isPreviewMode && (
                  <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center px-4">
                    <div className="editor-anim-scale-in rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-950/90 px-8 py-5 text-center backdrop-blur-sm shadow-xl shadow-indigo-950/50">
                      <div className="text-2xl mb-2">⊕</div>
                      <div className="text-sm font-semibold text-indigo-200">Suelta para agregar bloque</div>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {isEmpty && !isOver && !isPreviewMode && (
                  <div className="pointer-events-none absolute inset-0 flex select-none flex-col items-center justify-center gap-5 px-6 py-32">
                    {/* Animated background circles */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-64 h-64 rounded-full opacity-[0.03]"
                        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", animation: "editor-glow-pulse 3s ease-in-out infinite" }} />
                    </div>

                    <div className="relative">
                      <div className="grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white text-slate-300 shadow-sm">
                        <LayoutTemplate size={26} />
                      </div>
                      {/* Floating sparkle */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 grid place-items-center"
                        style={{ animation: "editor-bounce-subtle 2s ease-in-out infinite" }}>
                        <Sparkles size={10} className="text-indigo-400" />
                      </div>
                    </div>

                    <div className="relative text-center max-w-[220px]">
                      <div className="text-sm font-bold text-slate-500 mb-1">Canvas vacío</div>
                      <div className="text-xs leading-relaxed text-slate-400">
                        Arrastra un bloque desde el panel izquierdo o haz clic en uno para comenzar
                      </div>
                    </div>

                    {/* Quick action hint */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">
                      <MousePointerClick size={11} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-medium">Clic en cualquier bloque del panel</span>
                    </div>
                  </div>
                )}

                {marqueeBox && !isPreviewMode && (
                  <div
                    className="pointer-events-none absolute z-[997] rounded border border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_18px_rgba(217,70,239,0.25)]"
                    style={{
                      left: marqueeBox.x,
                      top: marqueeBox.y,
                      width: marqueeBox.width,
                      height: marqueeBox.height,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zoom controls ── */}
      {!isPreviewMode && (
      <div className="sticky bottom-4 left-1/2 -translate-x-1/2 w-fit z-10 flex items-center gap-1 rounded-full border border-white/[0.08] px-2 py-1 shadow-2xl shadow-black/60 mx-auto mb-4 editor-anim-fade-up"
        style={{ background: "rgba(13,18,32,0.95)", backdropFilter: "blur(16px)" }}>

        <button type="button" title="Alejar (−)"
          onClick={() => changeZoom(-1)}
          disabled={zoom <= ZOOM_STEPS[0]}
          className="motion-button grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:text-slate-200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ZoomOut size={11} />
        </button>

        <div className="flex items-center gap-0.5">
          {ZOOM_STEPS.map((z) => (
            <button key={z} type="button" onClick={() => setZoom(z)}
              className={cn(
                "motion-button h-5 px-2 rounded text-[10px] font-medium transition-all",
                zoom === z
                  ? "bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/30"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.05]"
              )}
            >
              {z}%
            </button>
          ))}
        </div>

        <button type="button" title="Acercar (+)"
          onClick={() => changeZoom(1)}
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          className="motion-button grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:text-slate-200 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ZoomIn size={11} />
        </button>

        <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

        <button type="button" title="Ajustar ancho" onClick={fitToWidth}
          className="motion-button grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:text-slate-200 transition-colors">
          <Minimize2 size={10} />
        </button>

        <button type="button" title="Zoom 100%" onClick={() => setZoom(100)}
          className="motion-button grid h-6 w-6 place-items-center rounded-full text-slate-500 hover:text-slate-200 transition-colors">
          <Maximize2 size={10} />
        </button>
      </div>
      )}

      {!isPreviewMode && canvasMenu && createPortal(
        <div
          className="fixed z-[2100] w-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1020]/95 py-1.5 shadow-2xl shadow-black/70 backdrop-blur-xl editor-anim-scale-in"
          style={{ left: canvasMenu.x, top: canvasMenu.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            disabled={!clipboardTree}
            onClick={() => {
              pasteNodeAt(rootId, canvasMenu.point);
              setCanvasMenu(null);
            }}
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            Pegar aquí
            <span className="ml-auto font-mono text-[9px] text-slate-600">Ctrl+V</span>
          </button>
          <button
            type="button"
            onClick={() => {
              addNode({
                type: "text",
                parentId: rootId,
                props: {
                  ...getFreeInsertProps("text", canvasMenu.point, { centerY: true }),
                  content: "Nuevo texto",
                },
              });
              setCanvasMenu(null);
            }}
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Texto aquí
          </button>
          <button
            type="button"
            onClick={() => {
              addNode({
                type: "heading",
                parentId: rootId,
                props: {
                  ...getFreeInsertProps("heading", canvasMenu.point, { centerY: true }),
                  text: "Nuevo título",
                  level: 2,
                },
              });
              setCanvasMenu(null);
            }}
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Título aquí
          </button>
          <button
            type="button"
            onClick={() => {
              addNode({
                type: "ctaButton",
                parentId: rootId,
                props: {
                  ...getFreeInsertProps("ctaButton", canvasMenu.point, { centerY: true }),
                  label: "Llamada a la acción",
                  href: "#",
                },
              });
              setCanvasMenu(null);
            }}
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Botón aquí
          </button>
          <button
            type="button"
            onClick={() => {
              addNode({
                type: "image",
                parentId: rootId,
                props: {
                  ...getFreeInsertProps("image", canvasMenu.point, { centerY: true }),
                  src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&h=540&fit=crop&q=80&auto=format",
                  alt: "Imagen nueva",
                  objectFit: "cover",
                },
              });
              setCanvasMenu(null);
            }}
            className="flex h-8 w-full items-center gap-2 px-3 text-left text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            Imagen aquí
          </button>
        </div>,
        document.body
      )}
    </main>
  );
};

function DeviceShell({ type, children }: { type: string; children: React.ReactNode }) {
  if (type === "desktop") return <>{children}</>;

  const isMobileShell = type === "mobile" || type === "sm";
  const isLgShell = type === "lg";

  return (
    <div className={cn(
      "relative mx-auto transition-all duration-500",
      isMobileShell ? "w-[300px] sm:w-[375px]"
        : isLgShell  ? "w-[1024px]"
        : "w-[768px]"
    )}>
      {/* Marco de dispositivo estilo Apple */}
      <div className={cn(
        "relative z-10 bg-slate-950 p-3 shadow-2xl border-slate-800",
        isMobileShell
          ? "rounded-[3.5rem] border-[12px] aspect-[9/19.5] max-h-[800px]"
          : isLgShell
          ? "rounded-2xl border-[10px] aspect-[16/10]"
          : "rounded-3xl border-[16px] aspect-[4/3]"
      )}>
        {/* Sensores/Notch — solo en móvil */}
        {isMobileShell && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-950 rounded-b-3xl z-20 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/5" />
            <div className="w-10 h-1 bg-white/10 rounded-full" />
          </div>
        )}

        {/* Pantalla interna */}
        <div className="w-full h-full overflow-hidden rounded-[2rem] bg-white relative">
          {children}
        </div>

        {/* Botones físicos laterales — solo en móvil */}
        {isMobileShell && (
          <>
            <div className="absolute -left-[14px] top-24 w-[3px] h-12 bg-slate-800 rounded-l-md" />
            <div className="absolute -left-[14px] top-40 w-[3px] h-16 bg-slate-800 rounded-l-md" />
            <div className="absolute -right-[14px] top-32 w-[3px] h-20 bg-slate-800 rounded-r-md" />
          </>
        )}
      </div>

      {/* Sombra base */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-10 bg-black/40 blur-3xl rounded-full" />
    </div>
  );
}

function ResponsivePreviewFrame({
  device,
  label,
  widthLabel,
  frameWidth,
  tree,
}: {
  device: keyof typeof DEVICE_WIDTHS;
  label: string;
  widthLabel: string;
  frameWidth: number;
  tree: EditorTree;
}) {
  const minHeight = getFreeCanvasHeight(tree, device);

  return (
    <section className="shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-slate-300">{label}</span>
        <span className="font-mono text-[10px] text-slate-600">{widthLabel}</span>
      </div>
      <div
        className="overflow-hidden rounded-xl border border-white/[0.08] bg-white shadow-2xl shadow-black/35"
        style={{ width: frameWidth }}
      >
        <div
          className="editor-free-canvas relative bg-white"
          data-editor-device={device}
          style={{ minHeight }}
        >
          <DynamicRenderer mode="preview" deviceOverride={device} />
        </div>
      </div>
    </section>
  );
}

function StrictViewportFrame({
  title,
  deviceMode,
  viewportWidth,
  children,
  onClick,
}: {
  title: string;
  deviceMode: string;
  viewportWidth: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLIFrameElement>;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const originalMatchMediaRef = useRef<typeof window.matchMedia | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(420);

  const getViewportSignal = useCallback(() => {
    const frameWindow = iframeRef.current?.contentWindow;
    const width = frameWindow?.innerWidth ?? Number.parseInt(viewportWidth, 10) ?? 0;
    const height = frameWindow?.innerHeight ?? 0;

    return {
      device: deviceMode,
      width,
      height,
      isMobile: width <= 640 || deviceMode === "mobile",
      isTablet: width > 640 && width <= 1024 || deviceMode === "tablet",
      isDesktop: width > 1024 || deviceMode === "desktop",
      orientation: width > height ? "landscape" : "portrait",
    };
  }, [deviceMode, viewportWidth]);

  const emitViewportSignal = useCallback(() => {
    const frameWindow = iframeRef.current?.contentWindow;
    const signal = getViewportSignal();

    window.dispatchEvent(new CustomEvent("orvenix:editor-viewport-change", { detail: signal }));
    window.dispatchEvent(new Event("resize"));

    if (frameWindow) {
      frameWindow.dispatchEvent(new CustomEvent("orvenix:editor-viewport-change", { detail: signal }));
      frameWindow.dispatchEvent(new Event("resize"));
      frameWindow.dispatchEvent(new Event("orientationchange"));
      frameWindow.parent.postMessage(
        { type: "orvenix:editor-viewport-change", payload: signal },
        window.location.origin
      );
    }

    Object.assign(window, { __ORVENIX_EDITOR_VIEWPORT__: signal });
  }, [getViewportSignal]);

  const syncFrameHead = useCallback(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;

    resetFrameHead(doc);

    const viewportMeta = doc.createElement("meta");
    viewportMeta.name = "viewport";
    viewportMeta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
    doc.head.appendChild(viewportMeta);

    document.head
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => {
        doc.head.appendChild(node.cloneNode(true));
      });

    const baseStyle = doc.createElement("style");
    baseStyle.textContent = `
      html {
        width: 100%;
        min-width: 0;
        background: white;
      }

      body {
        width: 100%;
        min-width: 0;
        margin: 0;
        overflow-x: hidden;
        background: white;
      }

      #editor-frame-root {
        width: 100%;
        min-width: 0;
      }

      body[data-editor-device="mobile"] #editor-frame-root {
        --editor-device-width: 375px;
      }

      body[data-editor-device="sm"] #editor-frame-root {
        --editor-device-width: 640px;
      }

      body[data-editor-device="tablet"] #editor-frame-root {
        --editor-device-width: 768px;
      }

      body[data-editor-device="lg"] #editor-frame-root {
        --editor-device-width: 1024px;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(img, video, canvas, iframe, picture, svg),
      body[data-editor-device="sm"] #editor-frame-root :is(img, video, canvas, iframe, picture, svg) {
        max-width: 100% !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root img,
      body[data-editor-device="mobile"] #editor-frame-root video,
      body[data-editor-device="mobile"] #editor-frame-root canvas,
      body[data-editor-device="mobile"] #editor-frame-root iframe,
      body[data-editor-device="sm"] #editor-frame-root img,
      body[data-editor-device="sm"] #editor-frame-root video,
      body[data-editor-device="sm"] #editor-frame-root canvas,
      body[data-editor-device="sm"] #editor-frame-root iframe {
        width: 100% !important;
        height: auto;
        object-fit: cover;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(section, article, header, footer, main, aside, div),
      body[data-editor-device="sm"] #editor-frame-root :is(section, article, header, footer, main, aside, div) {
        max-width: 100%;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(.grid, [class*="grid-cols-"], [class*="lg:grid-cols-"], [class*="xl:grid-cols-"]),
      body[data-editor-device="sm"] #editor-frame-root :is(.grid, [class*="grid-cols-"], [class*="lg:grid-cols-"], [class*="xl:grid-cols-"]) {
        grid-template-columns: minmax(0, 1fr) !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is([class*="flex-row"], [class*="md:flex-row"], [class*="lg:flex-row"], [class*="xl:flex-row"]),
      body[data-editor-device="sm"] #editor-frame-root :is([class*="flex-row"], [class*="md:flex-row"], [class*="lg:flex-row"], [class*="xl:flex-row"]) {
        flex-direction: column !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(.flex, [class*="flex"]),
      body[data-editor-device="sm"] #editor-frame-root :is(.flex, [class*="flex"]) {
        max-width: 100%;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(nav, header) :is(ul, ol, [class*="space-x"], [class*="gap-6"], [class*="gap-8"]),
      body[data-editor-device="sm"] #editor-frame-root :is(nav, header) :is(ul, ol, [class*="space-x"], [class*="gap-6"], [class*="gap-8"]) {
        display: none !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root nav::after,
      body[data-editor-device="mobile"] #editor-frame-root header::after,
      body[data-editor-device="sm"] #editor-frame-root nav::after,
      body[data-editor-device="sm"] #editor-frame-root header::after {
        content: "";
        display: inline-block;
        width: 1.25rem;
        height: 0.875rem;
        margin-left: auto;
        flex: 0 0 auto;
        background:
          linear-gradient(currentColor, currentColor) 0 0 / 100% 2px no-repeat,
          linear-gradient(currentColor, currentColor) 0 50% / 100% 2px no-repeat,
          linear-gradient(currentColor, currentColor) 0 100% / 100% 2px no-repeat;
        color: inherit;
        opacity: 0.72;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(.px-6, .px-8, .px-10, .px-12),
      body[data-editor-device="sm"] #editor-frame-root :is(.px-6, .px-8, .px-10, .px-12) {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(.py-16, .py-20, .py-24, .py-32),
      body[data-editor-device="sm"] #editor-frame-root :is(.py-16, .py-20, .py-24, .py-32) {
        padding-top: 3rem !important;
        padding-bottom: 3rem !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(.text-5xl, .text-6xl, .text-7xl, [class*="text-7xl"]),
      body[data-editor-device="sm"] #editor-frame-root :is(.text-5xl, .text-6xl, .text-7xl, [class*="text-7xl"]) {
        font-size: clamp(2rem, 12vw, 3rem) !important;
        line-height: 1.08 !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root :is(.min-w-max, [class*="min-w-"]),
      body[data-editor-device="sm"] #editor-frame-root :is(.min-w-max, [class*="min-w-"]) {
        min-width: 0 !important;
      }

      body[data-editor-device="mobile"] #editor-frame-root table,
      body[data-editor-device="sm"] #editor-frame-root table {
        min-width: 34rem;
      }
    `;
    doc.head.appendChild(baseStyle);
  }, []);

  const setupFrame = useCallback(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;

    syncFrameHead();
    applyFrameEditorDevice(doc, deviceMode);
    setMountNode(doc.getElementById("editor-frame-root"));
    requestAnimationFrame(emitViewportSignal);
  }, [deviceMode, emitViewportSignal, syncFrameHead]);

  useEffect(() => {
    setupFrame();
  }, [setupFrame]);

  useEffect(() => {
    const frameWindow = iframeRef.current?.contentWindow;
    const frameDocument = iframeRef.current?.contentDocument;
    if (!frameWindow) return;

    if (frameDocument) {
      applyFrameEditorDevice(frameDocument, deviceMode);
    }

    originalMatchMediaRef.current = originalMatchMediaRef.current ?? window.matchMedia.bind(window);
    const originalMatchMedia = originalMatchMediaRef.current;

    window.matchMedia = ((query: string) => {
      return frameWindow.matchMedia?.(query) ?? originalMatchMedia(query);
    }) as typeof window.matchMedia;

    emitViewportSignal();

    return () => {
      window.matchMedia = originalMatchMedia;
      delete (window as typeof window & { __ORVENIX_EDITOR_VIEWPORT__?: unknown }).__ORVENIX_EDITOR_VIEWPORT__;
      window.dispatchEvent(new Event("resize"));
    };
  }, [deviceMode, emitViewportSignal, viewportWidth, mountNode]);

  useEffect(() => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc || !mountNode) return;

    const updateHeight = () => {
      const nextHeight = Math.max(
        420,
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
        mountNode.scrollHeight
      );
      setHeight(nextHeight);
      emitViewportSignal();
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(doc.documentElement);
    resizeObserver.observe(mountNode);

    const mutationObserver = new MutationObserver(updateHeight);
    mutationObserver.observe(mountNode, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });

    const frameWindow = frame.contentWindow;
    const forwardKeyDown = (event: KeyboardEvent) => {
      const forwarded = new KeyboardEvent("keydown", {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(forwarded);
      if (forwarded.defaultPrevented) event.preventDefault();
    };

    frameWindow?.addEventListener("resize", updateHeight);
    frameWindow?.addEventListener("keydown", forwardKeyDown);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      frameWindow?.removeEventListener("resize", updateHeight);
      frameWindow?.removeEventListener("keydown", forwardKeyDown);
    };
  }, [mountNode, children, deviceMode, emitViewportSignal, viewportWidth]);

  return (
    <>
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc='<!doctype html><html><head></head><body><div id="editor-frame-root"></div></body></html>'
        className="block w-full border-0 bg-white"
        style={{ height }}
        onLoad={setupFrame}
        onClick={onClick}
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </>
  );
}

type MarqueeState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

type CanvasMenuState = {
  x: number;
  y: number;
  point: { x: number; y: number };
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function getCanvasPoint(
  event: Pick<React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>, "clientX" | "clientY">,
  canvas: HTMLElement | null,
  zoom: number
) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const scale = zoom / 100 || 1;
  return {
    x: Math.max(0, (event.clientX - rect.left) / scale),
    y: Math.max(0, (event.clientY - rect.top) / scale),
  };
}

function getMarqueeBox(marquee: MarqueeState): Rect {
  const x = Math.min(marquee.startX, marquee.currentX);
  const y = Math.min(marquee.startY, marquee.currentY);
  return {
    x,
    y,
    width: Math.abs(marquee.currentX - marquee.startX),
    height: Math.abs(marquee.currentY - marquee.startY),
  };
}

function getNodesInsideMarquee(tree: EditorTree, device: keyof typeof DEVICE_WIDTHS, marquee: Rect) {
  if (marquee.width < 4 || marquee.height < 4) return [];

  return Object.values(tree.nodes)
    .filter((node) => node.id !== tree.rootId && resolveResponsiveProps(node.props, device).positionMode === "free")
    .filter((node) => {
      const props = resolveResponsiveProps(node.props, device);
      const nodeRect = {
        x: toFiniteNumber(props.x, 0),
        y: toFiniteNumber(props.y, 0),
        width: toFiniteNumber(props.width, 320),
        height: toFiniteNumber(props.height, 120),
      };
      return rectsIntersect(marquee, nodeRect);
    })
    .map((node) => node.id as NodeId);
}

function getFreeCanvasHeight(tree: EditorTree, device: keyof typeof DEVICE_WIDTHS) {
  const bottom = Object.values(tree.nodes).reduce((height, node) => {
    const props = resolveResponsiveProps(node.props, device);
    if (props.positionMode !== "free") return height;
    return Math.max(
      height,
      toFiniteNumber(props.y, 0) + toFiniteNumber(props.height, 120)
    );
  }, 720);

  return Math.max(720, bottom + 96);
}

function rectsIntersect(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function toFiniteNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
