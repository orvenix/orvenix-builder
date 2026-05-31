"use client";

import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { blockRegistry, CATEGORY_LABELS } from "@/blocks/registry";
import { getFreeInsertProps } from "@/components/editor/freeInsert";
import { useEditorStore } from "@/store/useEditorStore";

type Command =
  | {
      id: string;
      label: string;
      meta: string;
      icon: string;
      run: () => void;
    };

export function EditorCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const addNode = useEditorStore((s) => s.addNode);
  const setDevice = useEditorStore((s) => s.setDevice);
  const select = useEditorStore((s) => s.select);
  const liberatePageLayout = useEditorStore((s) => s.liberatePageLayout);
  const alignSelectedFreeNodes = useEditorStore((s) => s.alignSelectedFreeNodes);
  const distributeSelectedFreeNodes = useEditorStore((s) => s.distributeSelectedFreeNodes);
  const toggleSelectedHidden = useEditorStore((s) => s.toggleSelectedHidden);
  const toggleSelectedLocked = useEditorStore((s) => s.toggleSelectedLocked);
  const groupSelectedFreeNodes = useEditorStore((s) => s.groupSelectedFreeNodes);
  const ungroupSelectedNodes = useEditorStore((s) => s.ungroupSelectedNodes);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const lastCanvasPoint = useEditorStore((s) => s.lastCanvasPoint);
  const tree = useEditorStore((s) => s.tree);
  const rootId = useEditorStore((s) => s.tree.rootId);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }

      if (!isTyping && event.key === "/" && !open) {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const blockCommands = Object.values(blockRegistry).map((def) => ({
      id: `add-${def.type}`,
      label: `Agregar ${def.label}`,
      meta: CATEGORY_LABELS[def.category as keyof typeof CATEGORY_LABELS] ?? def.category,
      icon: def.icon,
      run: () => {
        addNode({
          type: def.type,
          parentId: rootId,
          props: {
            ...def.defaults,
            ...getFreeInsertProps(def.type, lastCanvasPoint),
          },
        });
        setOpen(false);
        setQuery("");
      },
    }));

    const alignmentCommands: Command[] =
      selectedIds.length >= 2
        ? [
            {
              id: "align-left",
              label: "Alinear selección a la izquierda",
              meta: "Canvas libre X/Y",
              icon: "AlignHorizontalJustifyStart",
              run: () => {
                alignSelectedFreeNodes("horizontal", "start");
                setOpen(false);
              },
            },
            {
              id: "align-center-horizontal",
              label: "Centrar selección horizontal",
              meta: "Canvas libre X/Y",
              icon: "AlignHorizontalJustifyCenter",
              run: () => {
                alignSelectedFreeNodes("horizontal", "center");
                setOpen(false);
              },
            },
            {
              id: "align-right",
              label: "Alinear selección a la derecha",
              meta: "Canvas libre X/Y",
              icon: "AlignHorizontalJustifyEnd",
              run: () => {
                alignSelectedFreeNodes("horizontal", "end");
                setOpen(false);
              },
            },
            {
              id: "align-top",
              label: "Alinear selección arriba",
              meta: "Canvas libre X/Y",
              icon: "AlignVerticalJustifyStart",
              run: () => {
                alignSelectedFreeNodes("vertical", "start");
                setOpen(false);
              },
            },
            {
              id: "align-middle",
              label: "Centrar selección vertical",
              meta: "Canvas libre X/Y",
              icon: "AlignVerticalJustifyCenter",
              run: () => {
                alignSelectedFreeNodes("vertical", "center");
                setOpen(false);
              },
            },
            {
              id: "align-bottom",
              label: "Alinear selección abajo",
              meta: "Canvas libre X/Y",
              icon: "AlignVerticalJustifyEnd",
              run: () => {
                alignSelectedFreeNodes("vertical", "end");
                setOpen(false);
              },
            },
            ...(selectedIds.length >= 3
              ? [
                  {
                    id: "distribute-horizontal",
                    label: "Distribuir selección horizontal",
                    meta: "Canvas libre X/Y",
                    icon: "AlignHorizontalSpaceBetween",
                    run: () => {
                      distributeSelectedFreeNodes("horizontal");
                      setOpen(false);
                    },
                  },
                  {
                    id: "distribute-vertical",
                    label: "Distribuir selección vertical",
                    meta: "Canvas libre X/Y",
                    icon: "AlignVerticalSpaceBetween",
                    run: () => {
                      distributeSelectedFreeNodes("vertical");
                      setOpen(false);
                    },
                  },
                ]
              : []),
          ]
        : [];
    const selectionCommands: Command[] =
      selectedIds.length > 0
        ? [
            {
              id: "toggle-selected-locked",
              label: "Bloquear o desbloquear selección",
              meta: "Capas",
              icon: "Lock",
              run: () => {
                toggleSelectedLocked();
                setOpen(false);
              },
            },
            {
              id: "toggle-selected-hidden",
              label: "Ocultar o mostrar selección",
              meta: "Capas",
              icon: "EyeOff",
              run: () => {
                toggleSelectedHidden();
                setOpen(false);
              },
            },
            ...(selectedIds.length >= 2
              ? [
                  {
                    id: "group-selection",
                    label: "Agrupar selección",
                    meta: "Canvas libre X/Y",
                    icon: "Group",
                    run: () => {
                      groupSelectedFreeNodes();
                      setOpen(false);
                    },
                  },
                ]
              : []),
            ...(selectedIds.some((id) => typeof tree.nodes[id]?.props.groupId === "string")
              ? [
                  {
                    id: "ungroup-selection",
                    label: "Desagrupar selección",
                    meta: "Canvas libre X/Y",
                    icon: "Ungroup",
                    run: () => {
                      ungroupSelectedNodes();
                      setOpen(false);
                    },
                  },
                ]
              : []),
          ]
        : [];

    return [
      {
        id: "device-desktop",
        label: "Vista escritorio",
        meta: "Preview responsive",
        icon: "Monitor",
        run: () => {
          setDevice("desktop");
          setOpen(false);
        },
      },
      {
        id: "device-lg",
        label: "Vista laptop",
        meta: "Preview responsive",
        icon: "Laptop",
        run: () => {
          setDevice("lg");
          setOpen(false);
        },
      },
      {
        id: "device-tablet",
        label: "Vista tablet",
        meta: "Preview responsive",
        icon: "Tablet",
        run: () => {
          setDevice("tablet");
          setOpen(false);
        },
      },
      {
        id: "device-sm",
        label: "Vista móvil grande",
        meta: "Preview responsive",
        icon: "TabletSmartphone",
        run: () => {
          setDevice("sm");
          setOpen(false);
        },
      },
      {
        id: "device-mobile",
        label: "Vista móvil",
        meta: "Preview responsive",
        icon: "Smartphone",
        run: () => {
          setDevice("mobile");
          setOpen(false);
        },
      },
      {
        id: "liberate-page-layout",
        label: "Liberar toda la página",
        meta: "Canvas libre X/Y",
        icon: "Move",
        run: () => {
          liberatePageLayout();
          setOpen(false);
        },
      },
      {
        id: "clear-selection",
        label: "Limpiar selección",
        meta: "Inspector",
        icon: "MousePointer2",
        run: () => {
          select(null);
          setOpen(false);
        },
      },
      ...selectionCommands,
      ...alignmentCommands,
      ...blockCommands,
    ];
  }, [
    addNode,
    alignSelectedFreeNodes,
    distributeSelectedFreeNodes,
    groupSelectedFreeNodes,
    liberatePageLayout,
    rootId,
    lastCanvasPoint,
    select,
    selectedIds,
    setDevice,
    tree.nodes,
    toggleSelectedHidden,
    toggleSelectedLocked,
    ungroupSelectedNodes,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 9);
    return commands
      .filter((cmd) => `${cmd.label} ${cmd.meta}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [commands, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="motion-button hidden h-7 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 text-xs font-medium text-slate-400 hover:bg-white/[0.08] hover:text-slate-100 md:flex"
      >
        <Icons.Search size={12} />
        Comandos
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
          Ctrl K
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
              <Icons.Search size={16} className="text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar bloques, vistas o acciones..."
                className="h-8 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="motion-button grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
                title="Cerrar"
              >
                <Icons.X size={14} />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-3 py-10 text-center text-xs text-slate-500">
                  Sin resultados para &quot;{query}&quot;
                </div>
              ) : (
                filtered.map((cmd) => {
                  const Icon = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[cmd.icon] ?? Icons.Command;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={cmd.run}
                      className="motion-button flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/15">
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{cmd.label}</span>
                        <span className="block truncate text-[11px] text-slate-500">{cmd.meta}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
