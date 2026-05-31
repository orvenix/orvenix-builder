"use client";

import * as Icons from "lucide-react";
import {
  useEditorStore,
  selectCanUndo,
  selectCanRedo,
  selectLastUndoLabel,
  selectLastRedoLabel,
} from "@/store/useEditorStore";

export function HistoryControls() {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  const lastUndoLabel = useEditorStore(selectLastUndoLabel);
  const lastRedoLabel = useEditorStore(selectLastRedoLabel);

  const isMac =
    typeof navigator !== "undefined"
      ? /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      : false;

  const undoShortcut = isMac ? "⌘Z" : "Ctrl+Z";
  const redoShortcut = isMac ? "⇧⌘Z" : "Ctrl+Y";

  return (
    <div className="flex items-center gap-0.5">
      <HistoryButton
        onClick={undo}
        disabled={!canUndo}
        tooltip={
          canUndo
            ? `Deshacer ${labelToText(lastUndoLabel)} · ${undoShortcut}`
            : `Nada para deshacer · ${undoShortcut}`
        }
      >
        <Icons.Undo2 size={14} strokeWidth={2.25} />
      </HistoryButton>
      <HistoryButton
        onClick={redo}
        disabled={!canRedo}
        tooltip={
          canRedo
            ? `Rehacer ${labelToText(lastRedoLabel)} · ${redoShortcut}`
            : `Nada para rehacer · ${redoShortcut}`
        }
      >
        <Icons.Redo2 size={14} strokeWidth={2.25} />
      </HistoryButton>
    </div>
  );
}

function HistoryButton({
  onClick,
  disabled,
  tooltip,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={tooltip}
      type="button"
      className="motion-button grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white/6 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function labelToText(label: string | null): string {
  if (!label) return "";
  if (label === "add-node") return "agregar bloque";
  if (label === "remove-node") return "eliminar bloque";
  if (label === "move-node") return "mover bloque";
  if (label === "duplicate-node") return "duplicar bloque";
  if (label === "replace-template") return "reemplazar sitio";
  if (label.startsWith("replace-template:")) {
    return `reemplazar por ${label.split(":").slice(1).join(":")}`;
  }
  if (label.startsWith("edit-prop:")) {
    const propKey = label.split(":")[2] ?? "";
    if (propKey.includes("text") || propKey.includes("content")) return "editar texto";
    if (propKey.includes("color") || propKey.includes("background")) return "cambiar color";
    return "editar propiedad";
  }
  return "cambio";
}
