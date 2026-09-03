"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";
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
    "bg-gradient-to-br from-[#1BB3FA] via-[#1794CC] to-[#075985] text-white font-black " +
    "shadow-[0_16px_34px_-16px_rgba(27,179,250,0.68)] " +
    "hover:shadow-[0_26px_52px_-16px_rgba(23,148,204,0.74)] hover:-translate-y-1 hover:saturate-125 transition-all",
  secondary:
    "border border-[#1BB3FA]/24 bg-white/70 text-[#075985] font-black backdrop-blur " +
    "hover:border-[#1BB3FA]/50 hover:bg-[#e5f6ff] hover:text-[#062f44] hover:-translate-y-1 transition-all",
  ghost:
    "text-[#1379A8] font-black hover:text-[#1BB3FA] transition-all underline-offset-4 hover:underline hover:-translate-y-0.5",
  danger:
    "bg-red-600 text-white font-semibold hover:bg-red-500 hover:-translate-y-px transition-all",
} as const;

const SIZE = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-full",
  lg: "px-7 py-4 text-base rounded-full",
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
  const primaryColor = theme?.colors?.primary ?? "#1BB3FA";
  const secondaryColor = theme?.colors?.secondary ?? "#075985";
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
        group ${isFree ? "flex h-full w-full justify-center" : "inline-flex"}
        orvenix-cta-button orvenix-cta-${variant}
        items-center outline-none select-none tracking-[0.01em]
        ${SIZE[size]} ${VARIANT[variant]}
        ${isEditing ? "ring-2 ring-[#1BB3FA]/75 ring-offset-2 ring-offset-[#075985] cursor-text select-text" : "cursor-pointer"}
      `}
      style={themeStyle}
    >
      <span className="relative z-10">{label}</span>
      {variant !== "ghost" ? <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">→</span> : null}
    </a>
  );
}

CtaButton.defaults = {
  label: "Botón",
  href: "#",
  variant: "primary",
  size: "md",
} satisfies CtaButtonProps;
