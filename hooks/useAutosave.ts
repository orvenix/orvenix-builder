"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { validateTree } from "@/types/validateTree";
import type { EditorTree } from "@/types/editor";

const DEBOUNCE_MS = 800;
const STORAGE_VERSION = "v2";

function getStorageKey(websiteId: string) {
  return `orvenix_editor_tree:${STORAGE_VERSION}:${websiteId}`;
}

function getStorageKeyForPage(websiteId: string, pageSlug: string) {
  return `${getStorageKey(websiteId)}:${pageSlug}`;
}

function isDraftWebsiteId(websiteId: string) {
  return websiteId.startsWith("draft:");
}

export function useAutosave() {
  const tree = useEditorStore((s) => s.tree);
  const websiteId = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const rev = useEditorStore((s) => s.rev);
  const lastSavedRev = useEditorStore((s) => s.lastSavedRev);
  const markSaved = useEditorStore((s) => s.markSaved);
  const markSaving = useEditorStore((s) => s.markSaving);
  const markError = useEditorStore((s) => s.markError);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRevRef = useRef(0);

  useEffect(() => {
    lastSavedRevRef.current = lastSavedRev;
  }, [lastSavedRev]);

  useEffect(() => {
    if (!websiteId) return;

    // No guardar si no hubo cambios reales
    if (rev === lastSavedRevRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    markSaving();

    timerRef.current = setTimeout(() => {
      void (async () => {
        try {
          if (isDraftWebsiteId(websiteId)) {
            localStorage.setItem(getStorageKeyForPage(websiteId, activePageSlug), JSON.stringify(tree));
            lastSavedRevRef.current = rev;
            markSaved(rev);
            return;
          }

          const response = await fetch(`/api/editor/${websiteId}?page=${encodeURIComponent(activePageSlug)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tree }),
          });

          if (!response.ok) {
            const payload = (await response.json()) as { error?: string };
            throw new Error(payload.error ?? "No se pudo guardar");
          }

          localStorage.setItem(getStorageKey(websiteId), JSON.stringify(tree));
          lastSavedRevRef.current = rev;
          markSaved(rev);
        } catch (error) {
          try {
            localStorage.setItem(getStorageKeyForPage(websiteId, activePageSlug), JSON.stringify(tree));
          } catch {
            // Ignorar backup local fallido
          }

          markError(
            error instanceof Error ? error.message : "No se pudo guardar"
          );
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activePageSlug, markError, markSaved, markSaving, rev, tree, websiteId]);

  useEffect(() => {
    if (!websiteId) return;

    const flushLocalBackup = () => {
      if (!websiteId) return;
      try {
        localStorage.setItem(getStorageKeyForPage(websiteId, activePageSlug), JSON.stringify(tree));
      } catch {
        // Ignorar errores de almacenamiento local
      }
    };

    const handleBeforeUnload = () => {
      if (rev === lastSavedRevRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      flushLocalBackup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [activePageSlug, rev, tree, websiteId]);
}

export function loadSavedTree(websiteId: string, pageSlug = "home"): EditorTree | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKeyForPage(websiteId, pageSlug));
    return raw ? validateTree(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearSavedTree(websiteId: string, pageSlug = "home") {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKeyForPage(websiteId, pageSlug));
}
