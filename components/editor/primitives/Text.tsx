"use client";

import { useRef, useEffect } from "react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { BlockComponentProps } from "@/types/editor";

export interface TextProps {
  content?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  align?: "left" | "center" | "right";
  maxWidth?: "none" | "sm" | "md" | "lg";
}

const SIZE = {
  sm: "text-sm leading-relaxed",
  md: "text-base leading-relaxed",
  lg: "text-lg leading-relaxed",
} as const;

const ALIGN = {
  left: "text-left",
  center: "text-center mx-auto",
  right: "text-right ml-auto",
} as const;

const MAX_WIDTH = {
  none: "",
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
} as const;

export function Text({
  id,
  content = "Escribe aquí tu texto…",
  size = "md",
  color,
  align = "left",
  maxWidth = "none",
}: BlockComponentProps<TextProps>) {
  const ref = useRef<HTMLParagraphElement>(null);
  const selectedId = useEditorStore((s) => s.selectedId);
  const editingNodeId = useEditorStore((s) => s.editingNodeId);
  const select = useEditorStore((s) => s.select);
  const setEditingNode = useEditorStore((s) => s.setEditingNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const theme = useEditorStore((s) => s.tree.theme);
  const isSelected = selectedId === id;
  const isEditing = editingNodeId === id;

  // Sync content when prop changes externally (e.g. from SettingsPanel)
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    el.textContent = content ?? "";
  }, [content]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isEditing) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditing]);

  return (
    <p
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onDoubleClick={(e) => {
        if (!id) return;
        e.stopPropagation();
        select(id);
        setEditingNode(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        if (!id) return;
        updateNodeProps(id, { content: e.currentTarget.textContent ?? "" });
        setEditingNode(null);
      }}
      className={`outline-none ${SIZE[size]} ${ALIGN[align]} ${MAX_WIDTH[maxWidth]} ${isSelected ? "cursor-text" : ""} ${isEditing ? "rounded-sm ring-2 ring-fuchsia-400/60 ring-offset-2 ring-offset-white" : ""}`}
      style={{
        color: color ?? theme?.colors?.text,
        fontFamily: theme?.fontBody,
        transitionDuration: theme?.motion?.duration,
        transitionTimingFunction: theme?.motion?.easing,
      }}
    >
      {content}
    </p>
  );
}

Text.defaults = {
  content: "Escribe aquí tu texto…",
  size: "md" as const,
  align: "left" as const,
  maxWidth: "none" as const,
} satisfies TextProps;
