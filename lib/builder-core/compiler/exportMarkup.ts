import type { EditorNode } from "../../../types/editor"
import type { ExportSerializeOptions } from "./exportNodes"
import { resolveExportNavModel } from "./exportNodes"
import { getExportPlaceholderModel } from "./exportModels"

export interface ExportNavMarkupModel {
  ariaLabel: string
  navClass: string
  hasLinks: boolean
  links: Array<{
    href: string
    name: string
    isActive: boolean
  }>
}

export interface ExportPlaceholderMarkupModel {
  tag: string
  className: string
  label: string
  headingId: string
  meta: {
    icon: string
    heading: string
    label: string
    description: string
  } | null
}

export function getExportNavMarkupModel(
  props: Record<string, unknown>,
  options?: ExportSerializeOptions
): ExportNavMarkupModel {
  const navModel = resolveExportNavModel(props, options)

  return {
    ariaLabel: navModel.ariaLabel,
    navClass: navModel.navClass,
    hasLinks: navModel.links.length > 0,
    links: navModel.links.map((link) => ({
      href: link.href,
      name: link.name,
      isActive: link.isActive,
    })),
  }
}

export function getExportPlaceholderMarkupModel(node: EditorNode): ExportPlaceholderMarkupModel {
  const placeholder = getExportPlaceholderModel(node)

  return {
    tag: placeholder.meta?.tag ?? "section",
    className: placeholder.className,
    label: placeholder.label,
    headingId: `${placeholder.slug}-heading`,
    meta: placeholder.meta ? {
      icon: placeholder.meta.icon,
      heading: placeholder.meta.heading,
      label: placeholder.meta.label,
      description: placeholder.meta.description,
    } : null,
  }
}
