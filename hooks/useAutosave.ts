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

function getAutosaveScopeKey(websiteId: string, pageSlug: string) {
  return `${websiteId}:${pageSlug}`;
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
  const saveToServer = useEditorStore((s) => s.saveToServer);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRevRef = useRef(0);
  const autosaveScopeRef = useRef<string | null>(null);

  useEffect(() => {
    lastSavedRevRef.current = lastSavedRev;
  }, [lastSavedRev]);

  useEffect(() => {
    if (!websiteId) {
      autosaveScopeRef.current = null;
      lastSavedRevRef.current = lastSavedRev;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    const autosaveScope = getAutosaveScopeKey(websiteId, activePageSlug);
    if (autosaveScopeRef.current !== autosaveScope) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      autosaveScopeRef.current = autosaveScope;
      lastSavedRevRef.current = lastSavedRev;
    }

    // No guardar si no hubo cambios reales
    if (rev === lastSavedRevRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    markSaving();

    const scheduledScope = autosaveScope;

    timerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const currentBeforeSave = useEditorStore.getState();
          if (
            !currentBeforeSave.websiteId ||
            getAutosaveScopeKey(currentBeforeSave.websiteId, currentBeforeSave.activePageSlug) !== scheduledScope
          ) {
            return;
          }

          if (currentBeforeSave.rev === currentBeforeSave.lastSavedRev) {
            lastSavedRevRef.current = currentBeforeSave.lastSavedRev;
            return;
          }

          if (isDraftWebsiteId(websiteId)) {
            localStorage.setItem(
              getStorageKeyForPage(currentBeforeSave.websiteId, currentBeforeSave.activePageSlug),
              JSON.stringify(currentBeforeSave.tree),
            );
            lastSavedRevRef.current = currentBeforeSave.rev;
            markSaved(currentBeforeSave.rev);
            return;
          }

          const saveResult = await saveToServer();
          if (!saveResult.success) {
            throw new Error(saveResult.error ?? "No se pudo guardar");
          }

          const currentAfterSave = useEditorStore.getState();
          if (
            currentAfterSave.websiteId &&
            getAutosaveScopeKey(currentAfterSave.websiteId, currentAfterSave.activePageSlug) === scheduledScope
          ) {
            localStorage.setItem(
              getStorageKeyForPage(currentAfterSave.websiteId, currentAfterSave.activePageSlug),
              JSON.stringify(currentAfterSave.tree),
            );
            lastSavedRevRef.current = currentAfterSave.lastSavedRev;
          }
        } catch (error) {
          try {
            const currentAfterError = useEditorStore.getState();
            if (
              currentAfterError.websiteId &&
              getAutosaveScopeKey(currentAfterError.websiteId, currentAfterError.activePageSlug) === scheduledScope
            ) {
              localStorage.setItem(
                getStorageKeyForPage(currentAfterError.websiteId, currentAfterError.activePageSlug),
                JSON.stringify(currentAfterError.tree),
              );
            }
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
  }, [activePageSlug, lastSavedRev, markError, markSaved, markSaving, rev, saveToServer, websiteId]);

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
      if (rev === lastSavedRev) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      flushLocalBackup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
    };
  }, [activePageSlug, lastSavedRev, rev, tree, websiteId]);
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
