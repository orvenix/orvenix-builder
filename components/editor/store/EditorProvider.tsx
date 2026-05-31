"use client";
import { ReactNode, useEffect } from "react";
import { useEditorStore } from "./useEditorStore";
import { loadSavedTree } from "@/hooks/useAutosave";
import type { EditorTree } from "@/types/editor";
import type { SitePageListItem } from "@/lib/builder-core/tree/sitePages";

interface EditorProviderProps {
  children: ReactNode;
  websiteId: string;
  initialTree: EditorTree;
  initialPageSlug?: string;
  initialPageName?: string;
  availablePages?: SitePageListItem[];
}

export function EditorProvider({
  children,
  websiteId,
  initialTree,
  initialPageSlug = "home",
  initialPageName = "Inicio",
  availablePages = [],
}: EditorProviderProps) {
  const initialize = useEditorStore((s) => s.initialize);
  const isReady = useEditorStore((s) => s.websiteId === websiteId);

  useEffect(() => {
    const savedTree = loadSavedTree(websiteId, initialPageSlug);
    initialize(websiteId, savedTree ?? initialTree, null, {
      activePageSlug: initialPageSlug,
      activePageName: initialPageName,
      availablePages,
    });
  }, [availablePages, initialPageName, initialPageSlug, initialTree, initialize, websiteId]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-2xl shadow-black/40">
          <div className="flex h-12 items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <div className="ml-3 h-4 w-44 rounded-full bg-white/[0.06] editor-skeleton-line" />
            <div className="ml-auto h-6 w-28 rounded-full bg-indigo-400/10 editor-skeleton-line" />
          </div>
          <div className="grid min-h-[520px] grid-cols-[220px_1fr_260px] gap-px bg-white/[0.04]">
            <div className="space-y-3 bg-[#09101a] p-4">
              <div className="h-8 rounded-lg bg-white/[0.05] editor-skeleton-line" />
              <div className="h-20 rounded-xl bg-white/[0.04] editor-skeleton-line" />
              <div className="h-20 rounded-xl bg-white/[0.04] editor-skeleton-line" />
              <div className="h-20 rounded-xl bg-white/[0.04] editor-skeleton-line" />
            </div>
            <div className="flex items-center justify-center bg-[#0b1220] p-8">
              <div className="relative h-[380px] w-full max-w-2xl rounded-xl border border-white/[0.08] bg-white shadow-xl">
                <div className="absolute inset-0 editor-free-canvas opacity-70" />
                <div className="relative space-y-5 p-10">
                  <div className="h-8 w-2/3 rounded-full bg-slate-200 editor-skeleton-line" />
                  <div className="h-4 w-5/6 rounded-full bg-slate-100 editor-skeleton-line" />
                  <div className="grid grid-cols-3 gap-4 pt-8">
                    <div className="h-28 rounded-xl bg-slate-100 editor-skeleton-line" />
                    <div className="h-28 rounded-xl bg-slate-100 editor-skeleton-line" />
                    <div className="h-28 rounded-xl bg-slate-100 editor-skeleton-line" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4 bg-[#080c18] p-4">
              <div className="h-9 rounded-xl bg-white/[0.05] editor-skeleton-line" />
              <div className="h-28 rounded-xl bg-white/[0.04] editor-skeleton-line" />
              <div className="h-28 rounded-xl bg-white/[0.04] editor-skeleton-line" />
              <div className="h-16 rounded-xl bg-white/[0.04] editor-skeleton-line" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] bg-white/[0.025] px-4 py-3 text-xs font-semibold text-slate-400">
            <span className="h-2 w-2 rounded-full bg-indigo-400 editor-status-dot-live" />
            Abriendo diseño en el editor...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
