"use client";

import { useState } from "react";
import { AlertCircle, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { extractContentChangesFromTree } from "@/lib/constructorContentSync";

type SyncState = "idle" | "syncing" | "success" | "error";

export function ConstructorSyncButton() {
  const websiteId = useEditorStore((state) => state.websiteId);
  const tree = useEditorStore((state) => state.tree);
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  if (!websiteId?.startsWith("draft:constructor:")) {
    return null;
  }

  const handleSync = async () => {
    if (state === "syncing") {
      return;
    }

    const changes = extractContentChangesFromTree(tree);
    const entries = Object.entries(changes);

    if (entries.length === 0) {
      setState("error");
      setMessage("No hay campos data-edit listos para sincronizar.");
      window.setTimeout(() => setState("idle"), 2600);
      return;
    }

    setState("syncing");
    setMessage(null);

    try {
      const response = await fetch("/api/content/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ changes }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; saved?: number; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "No se pudo sincronizar el contenido.");
      }

      setState("success");
      setMessage(`${payload.saved ?? entries.length} cambios enviados al CMS.`);
      window.setTimeout(() => setState("idle"), 3200);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Error de sincronizacion.");
      window.setTimeout(() => setState("idle"), 3200);
    }
  };

  if (state === "success") {
    return (
      <div className="flex h-7 items-center gap-1.5 rounded-lg border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] px-2.5 text-xs font-medium text-[color:var(--accent)]">
        <CheckCheck size={12} />
        <span className="hidden sm:inline">{message ?? "Contenido sincronizado"}</span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex h-7 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 text-xs font-medium text-red-300">
        <AlertCircle size={12} />
        <span className="hidden sm:inline">{message ?? "Error al sincronizar"}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      className="flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] px-2.5 text-xs font-semibold text-[color:var(--accent)] transition-all hover:border-[rgba(0,181,246,0.45)] hover:bg-[rgba(0,181,246,0.16)] active:scale-[0.98]"
    >
      {state === "syncing" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
      <span className="hidden sm:inline">
        {state === "syncing" ? "Sincronizando..." : "Sincronizar contenido"}
      </span>
    </button>
  );
}
