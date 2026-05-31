"use client";

import { useState } from "react";
import { Sparkles, Save, Trash2 } from "lucide-react";

/**
 * Detecta diseños locales pendientes tras el registro/login
 * e invita al usuario a sincronizarlos con su cuenta.
 */
export function PostLoginSync() {
  const [pendingDraft, setPendingDraft] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const keys = Object.keys(localStorage);
    return keys.find((key) => key.startsWith("orvenix_backup_draft:")) ?? null;
  });

  if (!pendingDraft) return null;

  const handleClaim = () => {
    const data = localStorage.getItem(pendingDraft);
    if (data) {
      // El flujo actual de creación vive en /constructor; la ruta /editor/new ya no existe.
      window.location.href = "/constructor";
    }
  };

  const handleDiscard = () => {
    localStorage.removeItem(pendingDraft);
    setPendingDraft(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] max-w-sm w-full bg-[#0f172a] border border-indigo-500/30 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
          <Sparkles size={20} />
        </div>
        <h4 className="text-sm font-bold text-white">¡Diseño recuperado!</h4>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mb-5">
        Hemos encontrado el diseño que creaste antes de registrarte. ¿Quieres guardarlo en tu cuenta ahora?
      </p>
      <div className="flex items-center gap-2">
        <button onClick={handleClaim} className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all">
          <Save size={14} /> Sincronizar
        </button>
        <button onClick={handleDiscard} className="px-3 py-2 text-slate-500 hover:text-red-400 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
