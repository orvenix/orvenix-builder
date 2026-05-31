"use client";

import React from "react";
import { useEditorStore } from "./store/useEditorStore";
import { MessageSquarePlus, CheckCircle2, Clock, X } from "lucide-react";
import type { EditorComment } from "@/types/editor";

export const CommentSidebar = () => {
  const comments = useEditorStore((s) => s.tree.comments ?? []);
  const resolve = useEditorStore((s) => s.resolveComment);
  const isCommentMode = useEditorStore((s) => s.isCommentMode);
  const setCommentMode = useEditorStore((s) => s.setCommentMode);
  const userRole = useEditorStore((s) => s.userRole);

  if (!isCommentMode) return null;

  const openComments = comments.filter((comment) => comment.status === "open");

  return (
    <div className="flex flex-col h-full bg-[#09101a] border-l border-white/5 w-80 animate-in slide-in-from-right duration-300 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-amber-400">
          <MessageSquarePlus size={18} />
          <span className="text-sm font-bold tracking-tight text-white">Ajustes Solicitados</span>
        </div>
        <button onClick={() => setCommentMode(false)} className="text-slate-500 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Listado */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {openComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-600">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-xs text-slate-500">No hay ajustes pendientes. ¡Todo listo!</p>
          </div>
        ) : (
          openComments.map((comment: EditorComment) => (
            <div 
              key={comment.id}
              onClick={() => window.dispatchEvent(new CustomEvent('orvenix:navigate-to-comment', { 
                detail: { x: comment.x, y: comment.y } 
              }))}
              className="group p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/30 transition-all cursor-pointer hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {comment.author[0]}
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">{comment.author}</span>
                </div>
                <span className="text-[9px] text-slate-600 flex items-center gap-1">
                  <Clock size={10} /> 
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                &quot;{comment.text}&quot;
              </p>
              {userRole === "admin" && (
                <button 
                  onClick={() => resolve(comment.id)}
                  className="w-full py-2 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-500 text-[10px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-emerald-500/20"
                >
                  <CheckCircle2 size={12} /> Marcar como resuelto
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-amber-500/5 border-t border-white/5">
        <p className="text-[10px] text-amber-500/60 leading-relaxed italic">
          Haz clic en cualquier parte del diseño para solicitar un cambio manual a nuestro equipo.
        </p>
      </div>
    </div>
  );
};
