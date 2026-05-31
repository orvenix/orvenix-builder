"use client";

import { useDraggable } from "@dnd-kit/core";
import * as Icons from "lucide-react";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  blockRegistry,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type EditorBlockDefinition,
} from "@/blocks/registry";
import { getFreeInsertProps } from "@/components/editor/freeInsert";
import { useEditorStore } from "@/store/useEditorStore";
import { loadUserComponents, deleteUserComponent, type SavedComponent } from "@/lib/editor/userComponents";

export function BlocksSidebar() {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [userComponents, setUserComponents] = useState<SavedComponent[]>([]);
  const [showUserComponents, setShowUserComponents] = useState(true);

  const insertTree = useEditorStore((s) => s.insertTree);
  const rootId     = useEditorStore((s) => s.tree.rootId);

  const refreshUserComponents = useCallback(() => {
    setUserComponents(loadUserComponents());
  }, []);

  useEffect(() => {
    // Deferred initial load so setState isn't called synchronously in effect
    const id = window.setTimeout(refreshUserComponents, 0);
    window.addEventListener("orvenix:user-component-saved", refreshUserComponents);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("orvenix:user-component-saved", refreshUserComponents);
    };
  }, [refreshUserComponents]);

  const handleDeleteUserComponent = (id: string) => {
    deleteUserComponent(id);
    refreshUserComponents();
  };

  const handleInsertUserComponent = (component: SavedComponent) => {
    insertTree({ tree: component.tree, parentId: rootId });
  };

  const groups = useMemo(() => {
    const map = new Map<string, EditorBlockDefinition[]>();
    for (const def of Object.values(blockRegistry)) {
      const arr = map.get(def.category) ?? [];
      arr.push(def);
      map.set(def.category, arr);
    }
    return map;
  }, []);

  const query = search.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!query) return null;
    const result = new Map<string, EditorBlockDefinition[]>();
    for (const [cat, items] of groups) {
      const matches = items.filter(
        (d) =>
          d.label.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.type.toLowerCase().includes(query)
      );
      if (matches.length) result.set(cat, matches);
    }
    return result;
  }, [query, groups]);

  const displayGroups = filteredGroups ?? groups;

  const toggleCollapse = (cat: string) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <aside className="flex h-full flex-col bg-[#0d1117] text-slate-100">
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Icons.Search
            size={12}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar bloques…"
            className="motion-glass w-full rounded-lg border border-white/[0.06] bg-white/[0.04] py-2 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/40 focus:bg-white/[0.06] focus:outline-none transition-all duration-300"
          />
          {search && (
            <button
              type="button"
              title="Limpiar búsqueda"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <Icons.X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Saved user components */}
      {userComponents.length > 0 && (
        <div className="border-b border-white/[0.05] px-2 pb-2">
          <button
            type="button"
            onClick={() => setShowUserComponents((s) => !s)}
            className="flex w-full items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/[0.03] group"
          >
            <div className="flex items-center gap-2">
              <Icons.Bookmark size={10} className="text-amber-400/70" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-400/70">
                Mis componentes
              </span>
              <span className="rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400/70">
                {userComponents.length}
              </span>
            </div>
            <Icons.ChevronRight
              size={11}
              className={`text-slate-600 transition-transform ${showUserComponents ? "rotate-90" : ""}`}
            />
          </button>

          {showUserComponents && (
            <div className="grid grid-cols-1 gap-1 px-1 pb-1 mt-1">
              {userComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="group flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 transition-colors hover:border-amber-400/20 hover:bg-amber-400/5"
                >
                  <Icons.Puzzle size={11} className="shrink-0 text-amber-400/50" />
                  <span className="flex-1 truncate text-[11px] text-slate-300">{comp.name}</span>
                  <button
                    type="button"
                    title="Insertar"
                    onClick={() => handleInsertUserComponent(comp)}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-amber-400/15 hover:text-amber-300"
                  >
                    <Icons.Plus size={10} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => handleDeleteUserComponent(comp.id)}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-400"
                  >
                    <Icons.X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Block palette */}
      <div className="flex-1 overflow-y-auto pb-6 space-y-1 px-2">
        {displayGroups.size === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Icons.SearchX size={20} className="text-slate-600" />
            <p className="text-xs text-slate-500">Sin resultados para &quot;{search}&quot;</p>
          </div>
        )}

        {CATEGORY_ORDER.map((category) => {
          const items = displayGroups.get(category);
          if (!items?.length) return null;
          const isCollapsed = collapsed[category];

          return (
            <section key={category}>
              <button
                type="button"
                onClick={() => toggleCollapse(category)}
              className="motion-button flex w-full items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-white/[0.03] group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 group-hover:text-slate-400">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                    {items.length}
                  </span>
                </div>
                <Icons.ChevronRight
                  size={11}
                  className={`text-slate-600 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                />
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-1.5 px-1 pb-2">
                  {items.map((def) => (
                    <BlockCard key={def.type} definition={def} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <SidebarFooter />
    </aside>
  );
}

function BlockCard({ definition }: { definition: EditorBlockDefinition }) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${definition.type}`,
    data: { kind: "new-block", blockType: definition.type },
  });

  const addNode = useEditorStore((s) => s.addNode);
  const rootId = useEditorStore((s) => s.tree.rootId);
  const lastCanvasPoint = useEditorStore((s) => s.lastCanvasPoint);

  const Icon = (Icons as unknown as Record<
    string,
    React.ComponentType<{ size?: number; strokeWidth?: number }>
  >)[definition.icon];

  const captureStart = (clientX: number, clientY: number) => {
    pointerStartRef.current = { x: clientX, y: clientY };
    pointerMovedRef.current = false;
    const markMoved = (moveEvent: PointerEvent | MouseEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;
      if (Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) > 6) {
        pointerMovedRef.current = true;
      }
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", markMoved);
      window.removeEventListener("mousemove", markMoved);
      window.removeEventListener("pointerup", cleanup);
      window.removeEventListener("mouseup", cleanup);
    };
    window.addEventListener("pointermove", markMoved, { passive: true });
    window.addEventListener("mousemove", markMoved, { passive: true });
    window.addEventListener("pointerup", cleanup, { once: true });
    window.addEventListener("mouseup", cleanup, { once: true });
  };

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      onPointerDown={(event) => {
        captureStart(event.clientX, event.clientY);
        listeners?.onPointerDown?.(event);
      }}
      onMouseDown={(event) => captureStart(event.clientX, event.clientY)}
      onClick={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        const moved = start
          ? Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
          : false;
        if (isDragging || moved || pointerMovedRef.current) return;

        addNode({
          type: definition.type,
          parentId: rootId,
          props: getFreeInsertProps(definition.type, lastCanvasPoint),
        });
      }}
      title={definition.description}
      className={`motion-card motion-glass group relative flex flex-col items-start gap-2 rounded-xl border border-white/[0.05] bg-white/2 p-3 text-left hover:border-indigo-400/20 hover:bg-white/4 ${
        isDragging ? "opacity-40 scale-[0.97]" : ""
      }`}
    >
      <div className="grid h-7 w-7 place-items-center rounded-lg bg-linear-to-br from-slate-800 to-slate-900 text-indigo-300 ring-1 ring-white/6 transition-colors group-hover:text-indigo-200">
        {Icon ? <Icon size={14} strokeWidth={2} /> : null}
      </div>
      <div className="min-w-0 w-full">
        <div className="truncate text-[11px] font-semibold text-slate-200">
          {definition.label}
        </div>
        <div className="truncate text-[10px] leading-tight text-slate-500 mt-0.5">
          {definition.description}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 rounded-xl bg-linear-to-br from-indigo-500/0 via-transparent to-indigo-500/5" />
      </div>
    </button>
  );
}

function SidebarFooter() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const selectedType = useEditorStore((s) =>
    s.selectedId ? s.tree.nodes[s.selectedId]?.type : null
  );

  return (
    <div className="border-t border-white/[0.05] px-4 py-2.5">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">
        Selección
      </div>
      <div className="mt-0.5 truncate text-[11px] text-slate-400">
        {selectedId && selectedType ? (
          <>
            <span className="text-indigo-300">
              {blockRegistry[selectedType as keyof typeof blockRegistry]?.label ??
                selectedType}
            </span>
            <span className="ml-2 font-mono text-[9px] text-slate-600">
              #{selectedId.slice(-6)}
            </span>
          </>
        ) : (
          <span className="text-slate-600">Ningún bloque seleccionado</span>
        )}
      </div>
    </div>
  );
}
