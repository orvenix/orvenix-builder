"use client";

import React, { useEffect, useRef } from "react";
import { useEditorStore } from "./useEditorStore";
import { Trash2, ArrowUp, ArrowDown, Sparkles, Files } from "lucide-react";

export const EditorContextMenu = () => {
  const menu = useEditorStore((s) => s.contextMenu);
  const closeMenu = useEditorStore((s) => s.closeContextMenu);
  const duplicate = useEditorStore((s) => s.duplicateSelected);
  const remove = useEditorStore((s) => s.removeNodes);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const bringToFront = useEditorStore((s) => s.bringNodeToFront);
  const sendToBack = useEditorStore((s) => s.sendNodeToBack);
  const improveIA = useEditorStore((s) => s.improveTextWithIA);
  const nodes = useEditorStore((s) => s.tree.nodes);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menu.isOpen && !containerRef.current?.contains(e.target as Node)) {
        closeMenu();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menu.isOpen, closeMenu]);

  if (!menu.isOpen) return null;

  const handleAction = (fn: () => void) => {
    fn();
    closeMenu();
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] min-w-[180px] bg-white border border-slate-200 shadow-xl rounded-lg p-1 animate-in fade-in zoom-in duration-100"
      style={{ top: menu.y, left: menu.x }}
    >
      {selectedIds.length === 1 && nodes[selectedIds[0]]?.props.text && (
        <button
          onClick={() => handleAction(() => improveIA(selectedIds[0], String(nodes[selectedIds[0]].props.text)))}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors font-medium border-b border-slate-100 mb-1"
        >
          <Sparkles size={14} /> Mejorar con IA
        </button>
      )}
      
      <Item icon={<Files size={14} />} label="Duplicar" shortcut="Ctrl+D" onClick={() => handleAction(duplicate)} />
      
      <div className="h-px bg-slate-100 my-1" />
      
      <Item 
        icon={<ArrowUp size={14} />} 
        label="Traer al frente" 
        onClick={() => handleAction(() => selectedIds.forEach(bringToFront))} 
      />
      <Item 
        icon={<ArrowDown size={14} />} 
        label="Enviar al fondo" 
        onClick={() => handleAction(() => selectedIds.forEach(sendToBack))} 
      />
      
      <div className="h-px bg-slate-100 my-1" />
      
      <Item 
        icon={<Trash2 size={14} />} 
        label="Eliminar" 
        shortcut="Del" 
        variant="danger" 
        onClick={() => handleAction(() => remove(selectedIds))} 
      />
    </div>
  );
};

type ItemProps = {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  variant?: "default" | "danger";
};

const Item = ({ icon, label, shortcut, onClick, variant = "default" }: ItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
      variant === "danger" ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100"
    }`}
  >
    <span className="flex items-center gap-2">{icon} {label}</span>
    {shortcut && <span className="text-[10px] text-slate-400 font-mono">{shortcut}</span>}
  </button>
);
