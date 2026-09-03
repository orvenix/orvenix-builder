"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Settings2 } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { SaveStatus } from "./SaveStatus";
import { PublishButton } from "./PublishButton";
import { PreviewModeButton } from "./PreviewModeButton";

export function EditorOpsBar() {
  const websiteId = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const availablePages = useEditorStore((s) => s.availablePages);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const canManagePages = Boolean(websiteId && !websiteId.startsWith("draft:"));
  const pageOptions =
    availablePages.length > 0
      ? availablePages
      : [
          {
            id: null,
            siteId: websiteId ?? "draft",
            name: "Inicio",
            slug: "home",
            isHome: true,
            published: false,
            source: "legacy-site-tree" as const,
          },
        ];
  const currentPage = pageOptions.find((page) => page.slug === activePageSlug) ?? pageOptions[0] ?? null;

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
      <div className="flex min-w-0 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1">
        <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-muted)] sm:inline">
          Editando
        </span>
        <select
          value={activePageSlug}
          onChange={(event) => navigateToPage(event.target.value)}
          className="max-w-[150px] rounded-md border border-white/[0.08] bg-[color:var(--bg-2)] px-2 py-1 text-[11px] font-medium text-[color:var(--text-secondary)] outline-none sm:max-w-[190px]"
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

      <SaveStatus />
      <PreviewModeButton />

      {websiteId && (
        <a
          href={activePageSlug === "home" ? `/preview/${websiteId}` : `/preview/${websiteId}?page=${encodeURIComponent(activePageSlug)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 text-xs font-medium text-[color:var(--text-secondary)] transition-all hover:border-white/15 hover:bg-white/[0.08] hover:text-[color:var(--text)] sm:flex"
          title="Abrir vista previa"
        >
          <Eye size={12} />
          Ver
        </a>
      )}

      <PublishButton />
    </div>
  );
}
