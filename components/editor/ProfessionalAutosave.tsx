"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { EditorTree } from "@/types/editor";

interface ProfessionalAutosaveProps {
  debounceMs?: number;
  onSaved?: (tree: EditorTree) => void;
}

export function ProfessionalAutosave({
  debounceMs = 800,
  onSaved,
}: ProfessionalAutosaveProps) {
  const websiteId = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const tree = useEditorStore((s) => s.tree);
  const rev = useEditorStore((s) => s.rev);
  const markSaving = useEditorStore((s) => s.markSaving);
  const markSaved = useEditorStore((s) => s.markSaved);
  const markError = useEditorStore((s) => s.markError);
  const lastSavedRevRef = useRef(rev);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!websiteId || rev === lastSavedRevRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    markSaving();

    timerRef.current = setTimeout(() => {
      void (async () => {
        try {
          if (websiteId.startsWith("draft:")) {
            localStorage.setItem(
              `orvenix_editor_tree:v2:${websiteId}:${activePageSlug}`,
              JSON.stringify(tree)
            );
            lastSavedRevRef.current = rev;
            markSaved(rev);
            onSaved?.(tree);
            return;
          }

          const response = await fetch(`/api/editor/${websiteId}?page=${encodeURIComponent(activePageSlug)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tree }),
          });

          const payload = (await response.json()) as { error?: string };
          if (!response.ok) {
            throw new Error(payload.error ?? "No se pudo guardar.");
          }

          lastSavedRevRef.current = rev;
          markSaved(rev);
          onSaved?.(tree);
        } catch (error) {
          try {
            localStorage.setItem(
              `orvenix_editor_tree:v2:${websiteId}:${activePageSlug}`,
              JSON.stringify(tree)
            );
          } catch {
            // Backup local best-effort.
          }
          markError(error instanceof Error ? error.message : "No se pudo guardar.");
        }
      })();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activePageSlug, debounceMs, markError, markSaved, markSaving, onSaved, rev, tree, websiteId]);

  return null;
}
