"use client";

import { useEffect } from "react";
import { loadSavedTree } from "@/hooks/useAutosave";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { getConstructorPresetTree } from "@/lib/constructorPresets";
import { editorDebug, editorError, editorWarn } from "@/components/editor/logger";

interface ConstructorSourceBootstrapProps {
  websiteId: string;
  sourceFile: string;
}

export function ConstructorSourceBootstrap({
  websiteId,
  sourceFile,
}: ConstructorSourceBootstrapProps) {
  const initialize = useEditorStore((state) => state.initialize);

  useEffect(() => {
    if (!websiteId || !sourceFile) {
      editorError("[ConstructorSourceBootstrap] Missing websiteId or sourceFile", { websiteId, sourceFile });
      return;
    }

    try {
      editorDebug(`[ConstructorSourceBootstrap] Initializing for ${websiteId} (file: ${sourceFile})`);

      const savedTreeResult = loadSavedTree(websiteId, "home");
      if (savedTreeResult) {
        editorDebug("[ConstructorSourceBootstrap] Loaded from localStorage/DB.");
        return;
      }

      const presetTree = getConstructorPresetTree(sourceFile);
      if (!presetTree) {
        editorWarn(`[ConstructorSourceBootstrap] No preset found for: ${sourceFile}`);
        return;
      }

      initialize(websiteId, presetTree, null, {
        activePageSlug: "home",
        activePageName: "Inicio",
        availablePages: [],
      });
      editorDebug("[ConstructorSourceBootstrap] Editor initialized with preset.");
    } catch (err) {
      editorError("[ConstructorSourceBootstrap] Crash during initialization:", err);
    }
  }, [initialize, sourceFile, websiteId]);

  return null;
}
