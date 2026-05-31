import type { EditorNode } from "../../../types/editor"
import { getComplexBlockMeta, resolveExportHref, type ComplexBlockMeta } from "./exportNodes"

export interface ExportLayoutModel {
  tag: "section" | "div"
  maxWidth: string | null
}

export interface ExportHeadingModel {
  tag: string
  text: string
  alignClass: string | null
}

export interface ExportTextModel {
  content: string
  alignClass: string | null
}

export interface ExportButtonModel {
  href: string
  label: string
  isExternal: boolean
  className: string
}

export interface ExportImageModel {
  src: string
  alt: string
  width: number | null
  height: number | null
  objectFitCover: boolean
  caption: string
}

export interface ExportPlaceholderModel {
  label: string
  slug: string
  className: string
  meta: ComplexBlockMeta | null
}

export function getExportLayoutModel(node: EditorNode): ExportLayoutModel {
  const props = node.props as Record<string, unknown>
  return {
    tag: node.type === "section" ? "section" : "div",
    maxWidth: typeof props.maxWidth === "string" && props.maxWidth.trim() ? props.maxWidth : null,
  }
}

export function getExportHeadingModel(node: EditorNode): ExportHeadingModel {
  const props = node.props as Record<string, unknown>
  const level = Number(props.level ?? 2)

  return {
    tag: `h${Math.min(Math.max(level, 1), 6)}`,
    text: String(props.text ?? ""),
    alignClass: typeof props.align === "string" && props.align.trim() ? `text-${props.align}` : null,
  }
}

export function getExportTextModel(node: EditorNode): ExportTextModel {
  const props = node.props as Record<string, unknown>

  return {
    content: String(props.content ?? ""),
    alignClass: typeof props.align === "string" && props.align.trim() ? `text-${props.align}` : null,
  }
}

export function getExportButtonModel(node: EditorNode, siteId?: string | null): ExportButtonModel {
  const props = node.props as Record<string, unknown>
  const href = resolveExportHref(siteId ?? null, props.href)

  return {
    href,
    label: String(props.label ?? ""),
    isExternal: href.startsWith("http"),
    className: props.variant === "secondary" ? "cta-button cta-button--secondary" : "cta-button",
  }
}

export function getExportImageModel(node: EditorNode): ExportImageModel {
  const props = node.props as Record<string, unknown>
  const caption = typeof props.caption === "string" && props.caption.trim()
    ? props.caption
    : typeof props.title === "string" && props.title.trim()
      ? props.title
      : ""

  return {
    src: String(props.src ?? ""),
    alt: String(props.alt ?? ""),
    width: typeof props.width === "number" ? props.width : null,
    height: typeof props.height === "number" ? props.height : null,
    objectFitCover: props.objectFit === "cover",
    caption,
  }
}

export function getExportPlaceholderModel(node: EditorNode): ExportPlaceholderModel {
  const slug = node.type.replace(/[^a-z0-9-]/g, "-")

  return {
    label: node.displayName ?? node.type,
    slug,
    className: `orv-block orv-block--${slug}`,
    meta: getComplexBlockMeta(node.type),
  }
}
