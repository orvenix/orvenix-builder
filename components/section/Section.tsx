"use client";

import { useEditorStore } from "@/components/editor/store/useEditorStore";
import type { BlockComponentProps } from "@/types/editor";

export interface SectionProps {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  paddingY?: "none" | "sm" | "md" | "lg" | "xl";
  paddingX?: "none" | "sm" | "md" | "lg";
  marginY?: "none" | "sm" | "md" | "lg" | "xl";
  background?: string;
  align?: "left" | "center" | "right";
  mobileAlign?: "left" | "center" | "right";
  tabletAlign?: "left" | "center" | "right";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  as?: "section" | "div" | "header" | "footer" | "main" | "article";
  /** CSS border shorthand — e.g. "1px solid rgba(0,181,246,0.14)" */
  border?: string;
  /** CSS box-shadow — e.g. "0 25px 60px rgba(0,0,0,0.5)" */
  boxShadow?: string;
  /** CSS backdrop-filter — e.g. "blur(20px)" */
  backdropFilter?: string;
}

const MAX_WIDTH = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

const ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function Section({
  maxWidth = "lg",
  paddingY = "md",
  paddingX = "md",
  marginY = "none",
  background,
  align = "left",
  mobileAlign,
  tabletAlign,
  shadow = "none",
  borderRadius = "none",
  as = "section",
  border,
  boxShadow,
  backdropFilter,
  children,
}: BlockComponentProps<SectionProps>) {
  const theme = useEditorStore((s) => s.tree.theme);
  const Tag = as;
  const responsiveAlign =
    mobileAlign || tabletAlign
      ? `${mobileAlign ? `text-${mobileAlign} sm:text-${align}` : `text-${align}`} ${tabletAlign ? `md:text-${tabletAlign}` : ""}`
      : ALIGN[align];

  const outerStyle: React.CSSProperties = {};
  if (background) outerStyle.background = background;
  if (border) outerStyle.border = border;
  if (boxShadow) outerStyle.boxShadow = boxShadow;
  if (backdropFilter) outerStyle.backdropFilter = backdropFilter;

  const sectionY = theme?.spacing?.sectionY ?? "3rem";
  const sectionX = theme?.spacing?.sectionX ?? "1.5rem";
  const cardRadius = theme?.radius?.card ?? "1rem";
  const softShadow = theme?.shadow?.soft ?? "0 12px 32px rgba(15,23,42,0.08)";
  const strongShadow = theme?.shadow?.strong ?? "0 24px 60px rgba(15,23,42,0.18)";

  if (!boxShadow) {
    if (shadow === "sm" || shadow === "md") outerStyle.boxShadow = softShadow;
    if (shadow === "lg" || shadow === "xl") outerStyle.boxShadow = strongShadow;
  }
  if (borderRadius !== "none") {
    outerStyle.borderRadius =
      borderRadius === "sm"
        ? "0.5rem"
        : borderRadius === "md"
          ? cardRadius
          : borderRadius === "lg"
            ? "1.25rem"
            : borderRadius === "xl"
              ? "1.75rem"
              : borderRadius === "2xl"
                ? "2rem"
                : "2.5rem";
  }

  const outerSpacingStyle: React.CSSProperties = {
    ...outerStyle,
    paddingTop: paddingY === "none" ? 0 : paddingY === "sm" ? `calc(${sectionY} * 0.5)` : paddingY === "md" ? sectionY : paddingY === "lg" ? `calc(${sectionY} * 1.5)` : `calc(${sectionY} * 2)`,
    paddingBottom: paddingY === "none" ? 0 : paddingY === "sm" ? `calc(${sectionY} * 0.5)` : paddingY === "md" ? sectionY : paddingY === "lg" ? `calc(${sectionY} * 1.5)` : `calc(${sectionY} * 2)`,
    marginTop: marginY === "none" ? 0 : marginY === "sm" ? `calc(${sectionY} * 0.35)` : marginY === "md" ? `calc(${sectionY} * 0.7)` : marginY === "lg" ? sectionY : `calc(${sectionY} * 1.35)`,
    marginBottom: marginY === "none" ? 0 : marginY === "sm" ? `calc(${sectionY} * 0.35)` : marginY === "md" ? `calc(${sectionY} * 0.7)` : marginY === "lg" ? sectionY : `calc(${sectionY} * 1.35)`,
  };

  const innerStyle: React.CSSProperties = {
    paddingLeft: paddingX === "none" ? 0 : paddingX === "sm" ? `calc(${sectionX} * 0.75)` : paddingX === "md" ? sectionX : `calc(${sectionX} * 1.5)`,
    paddingRight: paddingX === "none" ? 0 : paddingX === "sm" ? `calc(${sectionX} * 0.75)` : paddingX === "md" ? sectionX : `calc(${sectionX} * 1.5)`,
  };

  return (
    <Tag
      className="w-full"
      style={outerSpacingStyle}
    >
      <div className={`mx-auto ${MAX_WIDTH[maxWidth]} ${responsiveAlign}`} style={innerStyle}>
        {children}
      </div>
    </Tag>
  );
}

Section.defaults = {
  maxWidth: "lg",
  paddingY: "md",
  paddingX: "md",
  marginY: "none",
  align: "left",
  shadow: "none",
  borderRadius: "none",
  as: "section",
} satisfies SectionProps;
