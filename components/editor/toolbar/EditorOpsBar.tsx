"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceBetween,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalSpaceBetween,
  Code2,
  Download,
  FileCode2,
  Globe,
  Eye,
  EyeOff,
  Group,
  Lock,
  Move,
  Search,
  Settings2,
  Ungroup,
  Unlock,
} from "lucide-react";
import { useEditorStore, type CanvasGridSize } from "@/store/useEditorStore";
import { resolveResponsiveProps } from "@/components/editor/responsive";
import { runSeoAudit } from "@/lib/audit/seoAudit";
import { runWcagAudit } from "@/lib/audit/wcagAudit";
import { runPerformanceAudit } from "@/lib/audit/performanceAudit";
import { SaveStatus } from "./SaveStatus";
import { PublishButton } from "./PublishButton";
import { PreviewModeButton } from "./PreviewModeButton";

export function EditorOpsBar() {
  const websiteId   = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const availablePages = useEditorStore((s) => s.availablePages);
  const tree        = useEditorStore((s) => s.tree);
  const rev         = useEditorStore((s) => s.rev);
  const lastSavedRev = useEditorStore((s) => s.lastSavedRev);
  const liberatePageLayout = useEditorStore((s) => s.liberatePageLayout);
  const alignSelectedFreeNodes = useEditorStore((s) => s.alignSelectedFreeNodes);
  const distributeSelectedFreeNodes = useEditorStore((s) => s.distributeSelectedFreeNodes);
  const toggleSelectedHidden = useEditorStore((s) => s.toggleSelectedHidden);
  const toggleSelectedLocked = useEditorStore((s) => s.toggleSelectedLocked);
  const groupSelectedFreeNodes = useEditorStore((s) => s.groupSelectedFreeNodes);
  const ungroupSelectedNodes = useEditorStore((s) => s.ungroupSelectedNodes);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const currentDevice = useEditorStore((s) => s.currentDevice);
  const isDirty      = rev !== lastSavedRev;
  const editorMode      = useEditorStore((s) => s.editorMode);
  const setEditorMode   = useEditorStore((s) => s.setEditorMode);
  const canvasGridSize  = useEditorStore((s) => s.canvasGridSize);
  const setCanvasGridSize = useEditorStore((s) => s.setCanvasGridSize);
  const seoOpen    = useEditorStore((s) => s.seoOpen);
  const setSeoOpen = useEditorStore((s) => s.setSeoOpen);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const canManagePages = Boolean(websiteId && !websiteId.startsWith("draft:"));
  const pageOptions = availablePages.length > 0
    ? availablePages
    : [{ id: null, siteId: websiteId ?? "draft", name: "Inicio", slug: "home", isHome: true, published: false, source: "legacy-site-tree" as const }];
  const currentPage = pageOptions.find((page) => page.slug === activePageSlug) ?? pageOptions[0] ?? null;

  const auditErrors = useMemo(() => {
    const seoIssues  = runSeoAudit(tree);
    const wcagIssues = runWcagAudit(tree);
    const performanceIssues = runPerformanceAudit(tree);
    return [...seoIssues, ...wcagIssues, ...performanceIssues].filter((i) => i.severity === "error").length;
  }, [tree]);
  const [gridOpen, setGridOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) setGridOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Ctrl+Shift+D → toggle modo Visual/Dev
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setEditorMode(editorMode === "visual" ? "dev" : "visual");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editorMode, setEditorMode]);

  const stats = useMemo(() => {
    const nodes    = Object.values(tree.nodes);
    const editable = nodes.filter((n) => n.id !== tree.rootId).length;
    const sections = nodes.filter((n) => n.type === "section").length;
    return { editable, sections };
  }, [tree]);
  const selectedFreeCount = useMemo(
    () =>
      selectedIds.filter((id) => {
        const node = tree.nodes[id];
        return resolveResponsiveProps(node?.props, currentDevice).positionMode === "free";
      }).length,
    [currentDevice, selectedIds, tree]
  );
  const selectedEditableIds = useMemo(
    () => selectedIds.filter((id) => id !== tree.rootId && tree.nodes[id]),
    [selectedIds, tree]
  );
  const hasSelection = selectedEditableIds.length > 0;
  const allSelectedHidden = hasSelection && selectedEditableIds.every((id) => tree.nodes[id]?.hidden);
  const allSelectedLocked = hasSelection && selectedEditableIds.every((id) => tree.nodes[id]?.locked);
  const hasSelectedGroup = selectedEditableIds.some((id) => typeof tree.nodes[id]?.props.groupId === "string");

  const handleExport = () => {
    const payload = JSON.stringify({ websiteId, exportedAt: new Date().toISOString(), rev, tree }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${websiteId ?? "orvenix"}-tree.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navigateToPage = (slug: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (slug === "home") {
      params.delete("page");
    } else {
      params.set("page", slug);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleCreatePage = async () => {
    if (!websiteId || isCreatingPage || !canManagePages) return;

    const rawName = window.prompt("Nombre de la nueva página", "Nueva página");
    if (!rawName?.trim()) return;

    setIsCreatingPage(true);
    setPageError(null);
    try {
      const response = await fetch(`/api/editor/${websiteId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rawName.trim() }),
      });

      const payload = (await response.json()) as { error?: string; page?: { slug: string } };
      if (!response.ok || !payload.page?.slug) {
        throw new Error(payload.error ?? "No se pudo crear la página.");
      }

      navigateToPage(payload.page.slug);
      router.refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "No se pudo crear la página.");
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleEditPage = async () => {
    if (!websiteId || !canManagePages || !currentPage?.id) return;

    const rawName = window.prompt("Nombre de la página", currentPage.name);
    if (!rawName?.trim()) return;

    const rawSlug = window.prompt("Slug de la página", currentPage.slug);
    if (!rawSlug?.trim()) return;

    setIsCreatingPage(true);
    setPageError(null);
    try {
      const response = await fetch(`/api/editor/${websiteId}/pages/${currentPage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rawName.trim(), slug: rawSlug.trim() }),
      });

      const payload = (await response.json()) as { error?: string; page?: { slug: string } };
      if (!response.ok || !payload.page?.slug) {
        throw new Error(payload.error ?? "No se pudo actualizar la página.");
      }

      navigateToPage(payload.page.slug);
      router.refresh();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "No se pudo actualizar la página.");
    } finally {
      setIsCreatingPage(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">

      <div className="hidden items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 md:flex">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-muted)]">
          Página
        </span>
        <select
          value={activePageSlug}
          onChange={(event) => navigateToPage(event.target.value)}
          className="rounded-md border border-white/[0.08] bg-[color:var(--bg-2)] px-2 py-1 text-[11px] font-medium text-[color:var(--text-secondary)] outline-none"
        >
          {pageOptions.map((page) => (
            <option key={`${page.slug}:${page.id ?? "legacy"}`} value={page.slug}>
              {page.name}
            </option>
          ))}
        </select>
        {canManagePages && (
          <button
            type="button"
            onClick={handleCreatePage}
            disabled={isCreatingPage}
            className="rounded-md border border-[rgba(0,181,246,0.20)] bg-[rgba(0,181,246,0.10)] px-2 py-1 text-[11px] font-semibold text-[color:var(--accent)] transition-colors hover:bg-[rgba(0,181,246,0.16)] disabled:opacity-60"
          >
            {isCreatingPage ? "Creando..." : "Nueva"}
          </button>
        )}
        {canManagePages && currentPage?.id && (
          <button
            type="button"
            onClick={handleEditPage}
            disabled={isCreatingPage}
            className="rounded-md border border-white/[0.10] bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-secondary)] transition-colors hover:bg-white/[0.08] disabled:opacity-60"
            title="Renombrar o cambiar slug de la página actual"
          >
            <span className="inline-flex items-center gap-1">
              <Settings2 size={11} />
              Editar
            </span>
          </button>
        )}
        {pageError && (
          <span className="max-w-[190px] truncate rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-200">
            {pageError}
          </span>
        )}
      </div>

      {/* Stats chip */}
      <div className="hidden items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 h-7 text-[11px] font-medium xl:flex">
        <span className="tabular-nums text-[color:var(--text-secondary)]">{stats.editable}</span>
        <span className="text-[color:var(--text-muted)]">bloques</span>
        <span className="h-3 w-px bg-white/[0.08]" />
        <span className="tabular-nums text-[color:var(--text-secondary)]">{stats.sections}</span>
        <span className="text-[color:var(--text-muted)]">secciones</span>
        {isDirty && (
          <>
            <span className="h-3 w-px bg-white/[0.08]" />
            <span className="flex items-center gap-1 text-amber-500/80">
              <span className="w-1 h-1 rounded-full bg-amber-400 editor-status-dot-live" />
              Rev {rev}
            </span>
          </>
        )}
      </div>

      {/* Toggle Visual / Dev */}
      <div className="flex h-7 items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/3">
        <button
          type="button"
          title="Modo Visual (Ctrl+Shift+D)"
          onClick={() => setEditorMode("visual")}
          className={`flex h-full items-center gap-1 px-2.5 text-[11px] font-semibold transition-colors ${
            editorMode === "visual"
              ? "bg-[rgba(0,131,179,0.16)] text-[color:var(--accent)]"
              : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
          }`}
        >
          Visual
        </button>
        <span className="h-4 w-px bg-white/[0.08]" />
        <button
          type="button"
          title="Modo Dev — CSS en vivo (Ctrl+Shift+D)"
          onClick={() => setEditorMode("dev")}
          className={`flex h-full items-center gap-1 px-2.5 text-[11px] font-semibold transition-colors ${
            editorMode === "dev"
              ? "bg-[rgba(0,181,246,0.16)] text-[color:var(--accent)]"
              : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
          }`}
        >
          <Code2 size={11} />
          Dev
        </button>
      </div>

      {/* Grid size picker */}
      <div ref={gridRef} className="relative">
        <button
          type="button"
          title="Configurar grid de snap"
          onClick={() => setGridOpen((o) => !o)}
          className={`flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${
            canvasGridSize === 0
              ? "border-white/[0.07] bg-white/[0.03] text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
              : "border-[rgba(0,181,246,0.22)] bg-[rgba(0,181,246,0.10)] text-[color:var(--accent)] hover:bg-[rgba(0,181,246,0.14)]"
          }`}
        >
          <Move size={11} />
          <span>{canvasGridSize === 0 ? "Grid off" : `${canvasGridSize}px`}</span>
        </button>

        {gridOpen && (
          <div className="absolute right-0 top-9 z-50 flex flex-col overflow-hidden rounded-xl border border-white/[0.1] bg-[color:var(--bg-2)] shadow-2xl shadow-black/50">
            {([8, 16, 24, 0] as CanvasGridSize[]).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => { setCanvasGridSize(size); setGridOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 text-left text-[11px] transition-colors hover:bg-white/[0.06] ${
                  canvasGridSize === size ? "text-[color:var(--accent)]" : "text-[color:var(--text-secondary)]"
                }`}
              >
                {size === 0 ? "Off — libre" : `${size}px`}
                {canvasGridSize === size && <span className="ml-auto text-[color:var(--accent)]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <SaveStatus />
      <PreviewModeButton />

      {selectedFreeCount >= 2 && (
        <div className="hidden h-7 items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] lg:flex">
          <AlignButton title="Alinear izquierda" onClick={() => alignSelectedFreeNodes("horizontal", "start")}>
            <AlignHorizontalJustifyStart size={12} />
          </AlignButton>
          <AlignButton title="Alinear centro horizontal" onClick={() => alignSelectedFreeNodes("horizontal", "center")}>
            <AlignHorizontalJustifyCenter size={12} />
          </AlignButton>
          <AlignButton title="Alinear derecha" onClick={() => alignSelectedFreeNodes("horizontal", "end")}>
            <AlignHorizontalJustifyEnd size={12} />
          </AlignButton>
          <span className="h-4 w-px bg-white/[0.08]" />
          <AlignButton title="Alinear arriba" onClick={() => alignSelectedFreeNodes("vertical", "start")}>
            <AlignVerticalJustifyStart size={12} />
          </AlignButton>
          <AlignButton title="Alinear medio vertical" onClick={() => alignSelectedFreeNodes("vertical", "center")}>
            <AlignVerticalJustifyCenter size={12} />
          </AlignButton>
          <AlignButton title="Alinear abajo" onClick={() => alignSelectedFreeNodes("vertical", "end")}>
            <AlignVerticalJustifyEnd size={12} />
          </AlignButton>
          {selectedFreeCount >= 3 && (
            <>
              <span className="h-4 w-px bg-white/[0.08]" />
              <AlignButton title="Distribuir horizontal" onClick={() => distributeSelectedFreeNodes("horizontal")}>
                <AlignHorizontalSpaceBetween size={12} />
              </AlignButton>
              <AlignButton title="Distribuir vertical" onClick={() => distributeSelectedFreeNodes("vertical")}>
                <AlignVerticalSpaceBetween size={12} />
              </AlignButton>
            </>
          )}
        </div>
      )}

      {hasSelection && (
        <div className="hidden h-7 items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] lg:flex">
          <AlignButton title={allSelectedLocked ? "Desbloquear selección" : "Bloquear selección"} onClick={toggleSelectedLocked}>
            {allSelectedLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </AlignButton>
          <AlignButton title={allSelectedHidden ? "Mostrar selección" : "Ocultar selección"} onClick={toggleSelectedHidden}>
            {allSelectedHidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </AlignButton>
          {selectedFreeCount >= 2 && (
            <AlignButton title="Agrupar selección" onClick={groupSelectedFreeNodes}>
              <Group size={12} />
            </AlignButton>
          )}
          {hasSelectedGroup && (
            <AlignButton title="Desagrupar selección" onClick={ungroupSelectedNodes}>
              <Ungroup size={12} />
            </AlignButton>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={liberatePageLayout}
        className="hidden h-7 items-center gap-1.5 rounded-lg border border-[rgba(0,181,246,0.18)] bg-[rgba(0,181,246,0.08)] px-2.5 text-xs font-semibold text-[color:var(--accent)] transition-all hover:border-[rgba(0,181,246,0.35)] hover:bg-[rgba(0,181,246,0.14)] lg:flex"
        title="Convertir los bloques principales en elementos libres X/Y"
      >
        <Move size={12} />
        Liberar página
      </button>

      {/* Preview link */}
      {websiteId && (
        <a
          href={activePageSlug === "home" ? `/preview/${websiteId}` : `/preview/${websiteId}?page=${encodeURIComponent(activePageSlug)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-7 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 text-xs font-medium text-[color:var(--text-secondary)] transition-all hover:bg-white/[0.08] hover:text-[color:var(--text)] hover:border-white/15 xl:flex"
          title="Abrir preview"
        >
          <Eye size={12} />
          Preview
        </a>
      )}

      {/* Export dropdown */}
      <ExportMenu websiteId={websiteId} onJsonExport={handleExport} />

      {/* SEO audit button */}
      <button
        type="button"
        title="Auditoría SEO, accesibilidad y performance"
        onClick={() => setSeoOpen(!seoOpen)}
        className={`relative flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${
          seoOpen
            ? "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.14)] text-[color:var(--accent)]"
            : auditErrors > 0
            ? "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "border-white/[0.07] bg-white/[0.03] text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
        }`}
      >
        <Search size={11} />
        <span className="hidden sm:inline">SEO</span>
        {auditErrors > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            {auditErrors}
          </span>
        )}
      </button>

      <PublishButton />
    </div>
  );
}

// ─── Export Menu ──────────────────────────────────────────────────────────────

function ExportMenu({ websiteId, onJsonExport }: { websiteId: string | null; onJsonExport: () => void }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<"static" | "nextjs" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);

  const download = async (format: "static" | "nextjs") => {
    if (!websiteId) return;
    setDownloading(format);
    setOpen(false);
    setExportError(null);
    try {
      const params = new URLSearchParams({ format });
      if (activePageSlug !== "home") {
        params.set("page", activePageSlug);
      }
      const res = await fetch(`/api/editor/${websiteId}/export?${params.toString()}`);
      if (!res.ok) {
        setExportError("No se pudo generar el export en este momento.");
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${websiteId}-${format}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div ref={ref} className="relative hidden xl:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!!downloading}
        className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/3 px-2.5 text-xs font-medium text-[color:var(--text-secondary)] transition-all hover:bg-white/8 hover:text-[color:var(--text)] hover:border-white/15 disabled:opacity-40"
        title="Exportar código"
      >
        {downloading ? (
          <span className="h-2.5 w-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <Download size={12} />
        )}
        Exportar
      </button>

      {exportError && (
        <div className="absolute right-0 top-9 z-50 mt-2 w-64 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200 shadow-xl shadow-black/20">
          {exportError}
        </div>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú de exportación"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-8 z-50 w-52 overflow-hidden rounded-xl border border-white/8 bg-[color:var(--bg-2)]/95 py-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl editor-anim-scale-in">
            <button type="button" onClick={() => { download("static"); }}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/6 transition-colors">
              <Globe size={13} className="shrink-0 mt-0.5 text-[color:var(--accent)]" />
              <div>
                <p className="text-[11px] font-semibold text-[color:var(--text)]">HTML estático</p>
                <p className="mt-0.5 text-[10px] text-[color:var(--text-secondary)]">index.html + styles.css</p>
              </div>
            </button>
            <button type="button" onClick={() => { download("nextjs"); }}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-white/6 transition-colors">
              <FileCode2 size={13} className="shrink-0 mt-0.5 text-[color:var(--accent)]" />
              <div>
                <p className="text-[11px] font-semibold text-[color:var(--text)]">Next.js 15</p>
                <p className="mt-0.5 text-[10px] text-[color:var(--text-secondary)]">App Router + Tailwind</p>
              </div>
            </button>
            <div className="border-t border-white/5 mt-1 px-3 py-1.5">
              <button type="button" onClick={() => { onJsonExport(); setOpen(false); }}
                className="text-[10px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-secondary)]">
                Descargar JSON del árbol →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AlignButton({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="grid h-7 w-7 place-items-center text-[color:var(--text-muted)] transition-colors hover:bg-white/[0.07] hover:text-[color:var(--text)]"
    >
      {children}
    </button>
  );
}
