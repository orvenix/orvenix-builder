"use client";

import { useEffect, useCallback } from "react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import { blockRegistry } from "@/blocks/registry";
import { resolveResponsiveProps } from "@/components/editor/responsive";
import { saveUserComponent } from "@/lib/editor/userComponents";
import {
  BringToFront, Bookmark, Copy, CornerDownRight,
  Edit3, Columns2, Grid3X3, Group,
  Eye, EyeOff, Layers, Lock,
  MoveDown, MoveUp, Palette, SendToBack,
  Trash2, Ungroup, Unlock, Rows3, Search,
} from "lucide-react";
import type { NodeId } from "@/types/editor";

// ─── Reusable primitives (exported for use by other menus) ────────────────────

export function ContextMenuItem({
  icon, label, shortcut, disabled, danger, onClick,
}: {
  icon: React.ReactNode; label: string; shortcut?: string;
  disabled?: boolean; danger?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 w-full items-center gap-2 px-3 text-left text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? "text-red-300 hover:bg-red-500/10"
          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <span className={danger ? "text-red-400" : "text-slate-500"}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {shortcut && <span className="font-mono text-[9px] text-slate-600">{shortcut}</span>}
    </button>
  );
}

export function ContextMenuSeparator() {
  return <div className="my-1 h-px bg-white/[0.06]" />;
}

export function ContextMenuHeader({ nodeId, label }: { nodeId: NodeId; label: string }) {
  return (
    <div className="border-b border-white/[0.06] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-500/10 text-indigo-300">
          <Layers size={12} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold text-slate-200">{label}</div>
          <div className="font-mono text-[9px] text-slate-600">#{nodeId.slice(-6)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main context menu ────────────────────────────────────────────────────────

export function EditorContextMenu() {
  const contextMenu     = useEditorStore((s) => s.contextMenu);
  const tree            = useEditorStore((s) => s.tree);
  const currentDevice   = useEditorStore((s) => s.currentDevice);
  const clipboardTree   = useEditorStore((s) => s.clipboardTree);
  const styleClipboard  = useEditorStore((s) => s.styleClipboard);
  const closeContextMenu  = useEditorStore((s) => s.closeContextMenu);
  const setEditingNode    = useEditorStore((s) => s.setEditingNode);
  const updateNodeProps   = useEditorStore((s) => s.updateNodeProps);
  const duplicateNode     = useEditorStore((s) => s.duplicateNode);
  const copyNode          = useEditorStore((s) => s.copyNode);
  const pasteNodeAfter    = useEditorStore((s) => s.pasteNodeAfter);
  const removeNode        = useEditorStore((s) => s.removeNode);
  const moveNodeUp        = useEditorStore((s) => s.moveNodeUp);
  const moveNodeDown      = useEditorStore((s) => s.moveNodeDown);
  const bringNodeToFront  = useEditorStore((s) => s.bringNodeToFront);
  const sendNodeToBack    = useEditorStore((s) => s.sendNodeToBack);
  const toggleNodeHidden  = useEditorStore((s) => s.toggleNodeHidden);
  const toggleNodeLocked  = useEditorStore((s) => s.toggleNodeLocked);
  const groupSelectedFreeNodes = useEditorStore((s) => s.groupSelectedFreeNodes);
  const ungroupSelectedNodes   = useEditorStore((s) => s.ungroupSelectedNodes);
  const copyNodeStyles    = useEditorStore((s) => s.copyNodeStyles);
  const pasteNodeStyles   = useEditorStore((s) => s.pasteNodeStyles);
  const wrapInContainer   = useEditorStore((s) => s.wrapInContainer);
  const highlightInLayers = useEditorStore((s) => s.highlightInLayers);
  const selectedIds       = useEditorStore((s) => s.selectedIds);

  useEffect(() => {
    if (!contextMenu.isOpen) return;
    const close = () => closeContextMenu();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeContextMenu(); };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", close);
    };
  }, [closeContextMenu, contextMenu.isOpen]);

  const run = useCallback((action: () => void) => {
    action();
    closeContextMenu();
  }, [closeContextMenu]);

  if (!contextMenu.isOpen || !contextMenu.nodeId) return null;

  const nodeId = contextMenu.nodeId;
  const node   = tree.nodes[nodeId];
  if (!node) return null;

  const resolvedProps  = resolveResponsiveProps(node.props, currentDevice);
  const isRoot         = nodeId === tree.rootId;
  const isFree         = resolvedProps.positionMode === "free";
  const isHidden       = Boolean(node.hidden);
  const isLocked       = Boolean(node.locked);
  const isGrouped      = typeof node.props.groupId === "string";
  const snapToGrid     = resolvedProps.snapToGrid !== false;
  const canInlineEdit  = node.type === "text" || node.type === "heading";
  const def            = blockRegistry[node.type as keyof typeof blockRegistry];
  const multiSelected  = selectedIds.length > 1 && selectedIds.includes(nodeId);

  // Get the sub-tree rooted at this node for saving as user component
  function getNodeSubtree() {
    const nodes: typeof tree.nodes = {};
    const collect = (id: string) => {
      const n = tree.nodes[id];
      if (!n) return;
      nodes[id] = n;
      n.children.forEach(collect);
    };
    collect(nodeId);
    return { rootId: nodeId, nodes };
  }

  const handleSaveAsComponent = () => {
    const label = def?.label ?? node.type;
    saveUserComponent(label, node.type, getNodeSubtree());
    closeContextMenu();
    // Dispatch custom event so BlocksSidebar can refresh
    window.dispatchEvent(new CustomEvent("orvenix:user-component-saved"));
  };

  const handleWrapFlex = () => run(() => wrapInContainer(multiSelected ? selectedIds : [nodeId], "flex"));
  const handleWrapGrid = () => run(() => wrapInContainer(multiSelected ? selectedIds : [nodeId], "grid"));

  return (
    <div
      className="fixed z-[2000] w-60 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1020]/95 py-1.5 shadow-2xl shadow-black/70 backdrop-blur-xl editor-anim-scale-in"
      style={{ left: contextMenu.x, top: contextMenu.y }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ContextMenuHeader nodeId={nodeId} label={def?.label ?? node.type} />

      {/* Edit */}
      {canInlineEdit && (
        <ContextMenuItem icon={<Edit3 size={13} />} label="Editar texto"
          onClick={() => run(() => setEditingNode(nodeId))} />
      )}

      {/* Copy/Paste/Duplicate */}
      <ContextMenuItem icon={<Copy size={13} />} label="Duplicar" shortcut="Ctrl+D"
        disabled={isRoot || isLocked} onClick={() => run(() => duplicateNode(nodeId))} />
      <ContextMenuItem icon={<Copy size={13} />} label="Copiar"
        disabled={isRoot} onClick={() => run(() => copyNode(nodeId))} />
      <ContextMenuItem icon={<CornerDownRight size={13} />} label="Pegar debajo"
        disabled={isRoot || !clipboardTree} onClick={() => run(() => pasteNodeAfter(nodeId))} />

      <ContextMenuSeparator />

      {/* Style clipboard */}
      <ContextMenuItem icon={<Palette size={13} />} label="Copiar estilos"
        disabled={isRoot} onClick={() => run(() => copyNodeStyles(nodeId))} />
      <ContextMenuItem icon={<Palette size={13} />} label="Pegar estilos"
        disabled={isRoot || isLocked || !styleClipboard}
        onClick={() => run(() => pasteNodeStyles(nodeId))} />

      <ContextMenuSeparator />

      {/* Wrap */}
      <ContextMenuItem icon={<Rows3 size={13} />} label="Envolver en Flex"
        disabled={isRoot || isLocked} onClick={handleWrapFlex} />
      <ContextMenuItem icon={<Grid3X3 size={13} />} label="Envolver en Grid"
        disabled={isRoot || isLocked} onClick={handleWrapGrid} />

      <ContextMenuSeparator />

      {/* Group */}
      <ContextMenuItem icon={<Group size={13} />} label="Agrupar selección"
        disabled={selectedIds.length < 2} onClick={() => run(groupSelectedFreeNodes)} />
      <ContextMenuItem icon={<Ungroup size={13} />} label="Desagrupar"
        disabled={!isGrouped} onClick={() => run(ungroupSelectedNodes)} />

      <ContextMenuSeparator />

      {/* Visibility / Lock */}
      <ContextMenuItem icon={isLocked ? <Lock size={13} /> : <Unlock size={13} />}
        label={isLocked ? "Desbloquear" : "Bloquear"}
        disabled={isRoot} onClick={() => run(() => toggleNodeLocked(nodeId))} />
      <ContextMenuItem icon={isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        label={isHidden ? "Mostrar" : "Ocultar"}
        disabled={isRoot} onClick={() => run(() => toggleNodeHidden(nodeId))} />

      <ContextMenuSeparator />

      {/* Z-order + snap */}
      <ContextMenuItem icon={<BringToFront size={13} />} label="Traer al frente"
        disabled={!isFree || isLocked} onClick={() => run(() => bringNodeToFront(nodeId))} />
      <ContextMenuItem icon={<SendToBack size={13} />} label="Enviar al fondo"
        disabled={!isFree || isLocked} onClick={() => run(() => sendNodeToBack(nodeId))} />
      <ContextMenuItem icon={<Columns2 size={13} />}
        label={snapToGrid ? "Desactivar rejilla" : "Activar rejilla"}
        disabled={!isFree || isLocked}
        onClick={() => run(() => updateNodeProps(nodeId, { snapToGrid: !snapToGrid }))} />
      <ContextMenuItem icon={<MoveUp size={13} />} label="Subir capa"
        disabled={isRoot || isLocked} onClick={() => run(() => moveNodeUp(nodeId))} />
      <ContextMenuItem icon={<MoveDown size={13} />} label="Bajar capa"
        disabled={isRoot || isLocked} onClick={() => run(() => moveNodeDown(nodeId))} />

      <ContextMenuSeparator />

      {/* Save / Find */}
      <ContextMenuItem icon={<Bookmark size={13} />} label="Guardar como componente"
        disabled={isRoot} onClick={handleSaveAsComponent} />
      <ContextMenuItem icon={<Search size={13} />} label="Ver en capas"
        onClick={() => run(() => highlightInLayers(nodeId))} />

      <ContextMenuSeparator />

      <ContextMenuItem icon={<Trash2 size={13} />} label="Eliminar" shortcut="Del"
        disabled={isRoot || isLocked} danger onClick={() => run(() => removeNode(nodeId))} />
    </div>
  );
}
