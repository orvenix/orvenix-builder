"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { validateTree } from "@/types/validateTree";
import type { EditorTree } from "@/types/editor";

const DEBOUNCE_MS = 800;
const STORAGE_VERSION = "v3";

export type SavedTreeRecoveryStatus = "missing" | "invalid" | "legacy" | "stale" | "recovered";

export type SavedTreeRecoveryResult =
  | { status: Exclude<SavedTreeRecoveryStatus, "recovered">; tree: null }
  | { status: "recovered"; tree: EditorTree; savedAt: number; baseServerVersion: string | null };

type SavedTreeEnvelope = {
  version: 3;
  websiteId: string;
  pageSlug: string;
  tree: EditorTree;
  savedAt: number;
  baseServerVersion: string | null;
};

function getStorageKey(websiteId: string) {
  return `orvenix_editor_tree:${STORAGE_VERSION}:${websiteId}`;
}

function getLegacyStorageKey(websiteId: string) {
  return `orvenix_editor_tree:v2:${websiteId}`;
}

function getStorageKeyForPage(websiteId: string, pageSlug: string) {
  return `${getStorageKey(websiteId)}:${pageSlug}`;
}

function getLegacyStorageKeyForPage(websiteId: string, pageSlug: string) {
  return `${getLegacyStorageKey(websiteId)}:${pageSlug}`;
}

function isDraftWebsiteId(websiteId: string) {
  return websiteId.startsWith("draft:");
}

function getAutosaveScopeKey(websiteId: string, pageSlug: string) {
  return `${websiteId}:${pageSlug}`;
}

function normalizeServerVersion(serverVersion: string | null | undefined) {
  const normalized = typeof serverVersion === "string" ? serverVersion.trim() : "";
  return normalized || null;
}

function isSavedTreeEnvelope(value: unknown): value is SavedTreeEnvelope {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 3 &&
    typeof candidate.websiteId === "string" &&
    typeof candidate.pageSlug === "string" &&
    typeof candidate.savedAt === "number" &&
    Number.isFinite(candidate.savedAt) &&
    (typeof candidate.baseServerVersion === "string" || candidate.baseServerVersion === null) &&
    typeof candidate.tree === "object" &&
    candidate.tree !== null
  );
}

export function saveSavedTree({
  websiteId,
  pageSlug,
  tree,
  baseServerVersion,
}: {
  websiteId: string;
  pageSlug: string;
  tree: EditorTree;
  baseServerVersion?: string | null;
}) {
  if (typeof window === "undefined") return;
  const envelope: SavedTreeEnvelope = {
    version: 3,
    websiteId,
    pageSlug,
    tree,
    savedAt: Date.now(),
    baseServerVersion: normalizeServerVersion(baseServerVersion),
  };
  localStorage.setItem(getStorageKeyForPage(websiteId, pageSlug), JSON.stringify(envelope));
}

export function inspectSavedTreeRecovery(
  websiteId: string,
  pageSlug = "home",
  currentServerVersion?: string | null,
): SavedTreeRecoveryResult {
  if (typeof window === "undefined") return { status: "missing", tree: null };
  try {
    const raw = localStorage.getItem(getStorageKeyForPage(websiteId, pageSlug));
    if (!raw) {
      return localStorage.getItem(getLegacyStorageKeyForPage(websiteId, pageSlug))
        ? { status: "legacy", tree: null }
        : { status: "missing", tree: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isSavedTreeEnvelope(parsed)) return { status: "legacy", tree: null };
    if (parsed.websiteId !== websiteId || parsed.pageSlug !== pageSlug) return { status: "stale", tree: null };

    const expectedServerVersion = normalizeServerVersion(currentServerVersion);
    if (parsed.baseServerVersion !== expectedServerVersion) return { status: "stale", tree: null };

    return {
      status: "recovered",
      tree: validateTree(parsed.tree),
      savedAt: parsed.savedAt,
      baseServerVersion: parsed.baseServerVersion,
    };
  } catch {
    return { status: "invalid", tree: null };
  }
}

export function loadSavedTree(
  websiteId: string,
  pageSlug = "home",
  currentServerVersion?: string | null,
): EditorTree | null {
  const result = inspectSavedTreeRecovery(websiteId, pageSlug, currentServerVersion);
  return result.status === "recovered" ? result.tree : null;
}

export function useAutosave() {
  const tree = useEditorStore((s) => s.tree);
  const websiteId = useEditorStore((s) => s.websiteId);
  const activePageSlug = useEditorStore((s) => s.activePageSlug);
  const serverVersion = useEditorStore((s) => s.serverVersion);
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
            saveSavedTree({
              websiteId: currentBeforeSave.websiteId,
              pageSlug: currentBeforeSave.activePageSlug,
              tree: currentBeforeSave.tree,
              baseServerVersion: currentBeforeSave.serverVersion,
            });
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
            saveSavedTree({
              websiteId: currentAfterSave.websiteId,
              pageSlug: currentAfterSave.activePageSlug,
              tree: currentAfterSave.tree,
              baseServerVersion: currentAfterSave.serverVersion,
            });
            lastSavedRevRef.current = currentAfterSave.lastSavedRev;
          }
        } catch (error) {
          try {
            const currentAfterError = useEditorStore.getState();
            if (
              currentAfterError.websiteId &&
              getAutosaveScopeKey(currentAfterError.websiteId, currentAfterError.activePageSlug) === scheduledScope
            ) {
              saveSavedTree({
                websiteId: currentAfterError.websiteId,
                pageSlug: currentAfterError.activePageSlug,
                tree: currentAfterError.tree,
                baseServerVersion: currentAfterError.serverVersion,
              });
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
  }, [activePageSlug, lastSavedRev, markError, markSaved, markSaving, rev, saveToServer, serverVersion, websiteId]);

  useEffect(() => {
    if (!websiteId) return;

    const flushLocalBackup = () => {
      if (!websiteId) return;
      try {
        saveSavedTree({
          websiteId,
          pageSlug: activePageSlug,
          tree,
          baseServerVersion: serverVersion,
        });
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
  }, [activePageSlug, lastSavedRev, rev, serverVersion, tree, websiteId]);
}

export function clearSavedTree(websiteId: string, pageSlug = "home") {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKeyForPage(websiteId, pageSlug));
}
