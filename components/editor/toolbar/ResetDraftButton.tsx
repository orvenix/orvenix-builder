"use client";

import { RotateCcw } from "lucide-react";
import { clearSavedTree } from "@/hooks/useAutosave";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { EditorTree } from "@/types/editor";

export function ResetDraftButton({ initialTree }: { initialTree: EditorTree }) {
  const websiteId = useEditorStore((s) => s.websiteId);
  const initialize = useEditorStore((s) => s.initialize);

  if (!websiteId?.startsWith("draft:")) return null;

  return (
    <button
      type="button"
      title="Nuevo lienzo"
      onClick={() => {
        clearSavedTree(websiteId, "home");
        initialize(websiteId, initialTree, null, {
          activePageSlug: "home",
          activePageName: "Inicio",
          availablePages: [],
        });
      }}
      className="motion-button hidden h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 text-xs font-semibold text-slate-400 transition-all hover:border-cyan-300/20 hover:bg-cyan-300/[0.08] hover:text-cyan-100 sm:flex"
    >
      <RotateCcw size={12} />
      Nuevo lienzo
    </button>
  );
}
