"use client";

import { useMemo, useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { blockRegistry } from "@/blocks/registry";
import type { NodeId } from "@/types/editor";

export function LayersPanel() {
  const [query, setQuery] = useState("");
  const tree = useEditorStore((s) => s.tree);
  const selectedId = useEditorStore((s) => s.selectedId);
  const layersHighlightId = useEditorStore((s) => s.layersHighlightId);
  const clearLayersHighlight = useEditorStore((s) => s.clearLayersHighlight);
  const select = useEditorStore((s) => s.select);
  const removeNode = useEditorStore((s) => s.removeNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const toggleNodeHidden = useEditorStore((s) => s.toggleNodeHidden);
  const toggleNodeLocked = useEditorStore((s) => s.toggleNodeLocked);

  // Scroll to highlighted node and auto-clear after 2s
  useEffect(() => {
    if (!layersHighlightId) return;
    const el = document.getElementById(`layer-${layersHighlightId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = window.setTimeout(() => clearLayersHighlight(), 2000);
    return () => window.clearTimeout(timer);
  }, [layersHighlightId, clearLayersHighlight]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const next = new Set<NodeId>();
    Object.values(tree.nodes).forEach((node) => {
      const def = blockRegistry[node.type as keyof typeof blockRegistry];
      const haystack = `${def?.label ?? ""} ${node.type} ${node.id}`.toLowerCase();
      if (haystack.includes(q)) next.add(node.id);
    });
    return next;
  }, [query, tree.nodes]);

  const renderNode = (id: NodeId, depth: number): React.ReactNode => {
    const node = tree.nodes[id];
    if (!node) return null;
    const def = blockRegistry[node.type as keyof typeof blockRegistry];
    const isRoot = id === tree.rootId;
    const isSelected = selectedId === id;
    const isHidden = Boolean(node.hidden);
    const isLocked = Boolean(node.locked);
    const isGrouped = typeof node.props.groupId === "string";
    const isMatch = matches?.has(id) ?? true;
    const childMatches = node.children.some((childId) => matches?.has(childId));
    if (matches && !isMatch && !childMatches && !isRoot) return null;

    const Icon = def?.icon
      ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[def.icon]
      : null;

    const isHighlighted = layersHighlightId === id;

    return (
      <div key={id}>
        <div
          id={`layer-${id}`}
          className={`group flex items-center gap-1.5 rounded-md py-1 pr-2 transition-all cursor-pointer ${
            isHighlighted
              ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
              : isSelected
              ? "bg-indigo-500/15 text-indigo-200"
              : isHidden
                ? "text-slate-600 hover:bg-white/[0.04] hover:text-slate-400"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
          }`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={() => select(isRoot ? null : id)}
        >
          {/* Indent line */}
          {depth > 0 && (
            <span className="shrink-0 text-slate-700">
              <Icons.CornerDownRight size={10} />
            </span>
          )}

          {/* Block icon */}
          <span className={`shrink-0 ${isSelected ? "text-indigo-300" : isHidden ? "text-slate-700" : "text-slate-500"}`}>
            {Icon ? <Icon size={11} /> : <Icons.Square size={11} />}
          </span>

          {/* Label */}
          <span className={`flex-1 truncate text-[11px] font-medium ${isHidden ? "line-through decoration-slate-700" : ""}`}>
            {def?.label ?? node.type}
          </span>

          {isGrouped && (
            <Icons.Group size={9} className="shrink-0 text-cyan-400/70" />
          )}

          {/* ID badge */}
          <span className="font-mono text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
            #{id.slice(-4)}
          </span>

          {/* Duplicate/delete (only non-root, visible on hover/select) */}
          {!isRoot && (
            <>
              <button
                type="button"
                title={isHidden ? "Mostrar" : "Ocultar"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeHidden(id);
                }}
                className={`shrink-0 grid h-4 w-4 place-items-center rounded transition-opacity hover:bg-white/[0.08] ${
                  isHidden
                    ? "text-slate-500 opacity-100"
                    : "text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300"
                }`}
              >
                {isHidden ? <Icons.EyeOff size={9} /> : <Icons.Eye size={9} />}
              </button>
              <button
                type="button"
                title={isLocked ? "Desbloquear" : "Bloquear"}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeLocked(id);
                }}
                className={`shrink-0 grid h-4 w-4 place-items-center rounded transition-opacity hover:bg-white/[0.08] ${
                  isLocked
                    ? "text-amber-400 opacity-100"
                    : "text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-300"
                }`}
              >
                {isLocked ? <Icons.Lock size={9} /> : <Icons.Unlock size={9} />}
              </button>
              <button
                type="button"
                title="Duplicar"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateNode(id);
                }}
                disabled={isLocked}
                className="shrink-0 grid h-4 w-4 place-items-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/[0.08] hover:text-slate-300 text-slate-600 disabled:cursor-not-allowed disabled:opacity-25"
              >
                <Icons.Copy size={9} />
              </button>
              <button
                type="button"
                title="Eliminar"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(id);
                }}
                disabled={isLocked}
                className="shrink-0 grid h-4 w-4 place-items-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400 text-slate-600 disabled:cursor-not-allowed disabled:opacity-25"
              >
                <Icons.X size={9} />
              </button>
            </>
          )}
        </div>

        {/* Children */}
        {node.children.map((childId) => renderNode(childId, depth + 1))}
      </div>
    );
  };

  const nodeCount = Object.keys(tree.nodes).length;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Capas
        </span>
        <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
          {nodeCount}
        </span>
      </div>

      <div className="border-b border-white/[0.05] px-3 py-2">
        <div className="relative">
          <Icons.Search
            size={12}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar capa..."
            className="motion-glass w-full rounded-lg border border-white/[0.06] bg-white/[0.04] py-2 pl-8 pr-8 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-white/[0.06]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              title="Limpiar"
              className="motion-button absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-slate-600 hover:bg-white/[0.06] hover:text-slate-300"
            >
              <Icons.X size={11} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {renderNode(tree.rootId, 0)}
      </div>
    </div>
  );
}
