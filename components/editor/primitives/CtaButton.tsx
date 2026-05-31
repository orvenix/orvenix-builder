"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { BlockComponentProps } from "@/types/editor";
import { resolveRuntimeHref } from "@/lib/builder-core/tree/pageLinks";

export interface CtaButtonProps {
  label?: string;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  positionMode?: "flow" | "free";
}

// Matches the main site's design system (orvenix-tokens.css)
const VARIANT = {
  primary:
    "bg-gradient-to-br from-[#00bbff] to-[#0083b3] text-white font-semibold " +
    "shadow-[0_10px_20px_-10px_rgba(0,131,179,0.5)] " +
    "hover:shadow-[0_20px_30px_-10px_rgba(0,181,246,0.4)] hover:-translate-y-px transition-all",
  secondary:
    "border border-white/[0.12] bg-white/[0.03] text-white font-semibold " +
    "hover:border-white/25 hover:-translate-y-px transition-all",
  ghost:
    "text-[#00b5f6] font-semibold hover:text-[#00bbff] transition-colors underline-offset-4 hover:underline",
  danger:
    "bg-red-600 text-white font-semibold hover:bg-red-500 hover:-translate-y-px transition-all",
} as const;

const SIZE = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3.5 text-base rounded-xl",
} as const;

export function CtaButton({
  id,
  label = "Botón",
  href = "#",
  variant = "primary",
  size = "md",
  positionMode = "flow",
}: BlockComponentProps<CtaButtonProps>) {
  const ref = useRef<HTMLAnchorElement>(null);
  const editingNodeId = useEditorStore((s) => s.editingNodeId);
  const select = useEditorStore((s) => s.select);
  const setEditingNode = useEditorStore((s) => s.setEditingNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const websiteId = useEditorStore((s) => s.websiteId);
  const theme = useEditorStore((s) => s.tree.theme);
  const pathname = usePathname();
  const isEditing = editingNodeId === id;
  const isFree = positionMode === "free";
  const hrefMode = pathname?.startsWith("/preview/") ? "preview" : pathname?.startsWith("/p/") ? "published" : "preview";
  const resolvedHref = isEditing ? undefined : resolveRuntimeHref(websiteId, href, hrefMode);
  const buttonRadius = theme?.radius?.button ?? "999px";
  const buttonShadow = theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)";
  const motionDuration = theme?.motion?.duration ?? "240ms";
  const motionEasing = theme?.motion?.easing ?? "cubic-bezier(0.22, 1, 0.36, 1)";
  const primaryColor = theme?.colors?.primary ?? "#00b5f6";
  const secondaryColor = theme?.colors?.secondary ?? "#112540";
  const accentColor = theme?.colors?.accent ?? primaryColor;

  const themeStyle: React.CSSProperties = {
    borderRadius: buttonRadius,
    boxShadow: variant === "primary" ? buttonShadow : undefined,
    transitionDuration: motionDuration,
    transitionTimingFunction: motionEasing,
    background:
      variant === "primary"
        ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
        : variant === "danger"
          ? undefined
          : undefined,
    borderColor: variant === "secondary" ? `${secondaryColor}33` : undefined,
    color: variant === "secondary" ? secondaryColor : undefined,
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    el.textContent = label ?? "";
  }, [label]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isEditing) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }, [isEditing]);

  return (
    <a
      ref={ref}
      href={resolvedHref}
      onClick={isEditing ? (e) => e.preventDefault() : undefined}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onDoubleClick={(e) => {
        if (!id) return;
        e.stopPropagation();
        e.preventDefault();
        select(id);
        setEditingNode(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        if (!id) return;
        updateNodeProps(id, { label: e.currentTarget.textContent ?? "" });
        setEditingNode(null);
      }}
      className={`
        ${isFree ? "flex h-full w-full justify-center" : "inline-flex"}
        items-center outline-none select-none
        ${SIZE[size]} ${VARIANT[variant]}
        ${isEditing ? "ring-2 ring-[#00b5f6]/60 ring-offset-2 ring-offset-[#112540] cursor-text select-text" : "cursor-pointer"}
      `}
      style={themeStyle}
    >
      {label}
    </a>
  );
}

CtaButton.defaults = {
  label: "Botón",
  href: "#",
  variant: "primary",
  size: "md",
} satisfies CtaButtonProps;
