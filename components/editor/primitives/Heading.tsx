"use client";

import { useRef, useEffect } from "react";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { BlockComponentProps } from "@/types/editor";

export interface HeadingProps {
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  color?: string;
  align?: "left" | "center" | "right";
  marginBottom?: "none" | "sm" | "md" | "lg";
}

const SIZE = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
} as const;

const WEIGHT = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
} as const;

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const MARGIN_BOTTOM = {
  none: "mb-0",
  sm: "mb-2",
  md: "mb-4",
  lg: "mb-8",
} as const;

export function Heading({
  id,
  text = "Título sin contenido",
  level = 2,
  size = "3xl",
  weight = "bold",
  color,
  align = "left",
  marginBottom = "md",
}: BlockComponentProps<HeadingProps>) {
  const ref = useRef<HTMLElement>(null);
  const selectedId = useEditorStore((s) => s.selectedId);
  const editingNodeId = useEditorStore((s) => s.editingNodeId);
  const select = useEditorStore((s) => s.select);
  const setEditingNode = useEditorStore((s) => s.setEditingNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const theme = useEditorStore((s) => s.tree.theme);
  const isSelected = selectedId === id;
  const isEditing = editingNodeId === id;

  // Sync text content when prop changes externally (e.g. from SettingsPanel)
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    el.textContent = text ?? "";
  }, [text]);

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

  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
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
        updateNodeProps(id, { text: e.currentTarget.textContent ?? "" });
        setEditingNode(null);
      }}
      className={`tracking-tight outline-none ${SIZE[size]} ${WEIGHT[weight]} ${ALIGN[align]} ${MARGIN_BOTTOM[marginBottom]} ${isSelected ? "cursor-text" : ""} ${isEditing ? "rounded-sm ring-2 ring-fuchsia-400/60 ring-offset-2 ring-offset-white" : ""}`}
      style={{
        color: color ?? theme?.colors?.primary,
        fontFamily: theme?.fontHeading,
        transitionDuration: theme?.motion?.duration,
        transitionTimingFunction: theme?.motion?.easing,
      }}
    >
      {text}
    </Tag>
  );
}

Heading.defaults = {
  text: "Nuevo título",
  level: 2,
  size: "3xl",
  weight: "bold",
  align: "left",
  marginBottom: "md",
} satisfies HeadingProps;
