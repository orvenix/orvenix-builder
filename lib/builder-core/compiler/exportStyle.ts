import type { NodeProps } from "../../../types/editor"

export interface ExportStyleModel {
  background?: string
  opacity?: number
  padding?: number
  borderRadius?: number
  border?: string
  position?: "absolute"
  left?: number
  top?: number
  width?: number
  height?: number
  customCss?: string
}

export function buildExportStyleModel(props: NodeProps): ExportStyleModel {
  const p = props as Record<string, unknown>
  const model: ExportStyleModel = {}

  if (typeof p.styleBackground === "string" && p.styleBackground.trim()) {
    model.background = p.styleBackground
  }

  if (typeof p.styleOpacity === "number" && p.styleOpacity < 100) {
    model.opacity = p.styleOpacity / 100
  }

  if (typeof p.stylePadding === "number" && p.stylePadding > 0) {
    model.padding = p.stylePadding
  }

  if (typeof p.styleRadius === "number" && p.styleRadius > 0) {
    model.borderRadius = p.styleRadius
  }

  if (typeof p.styleBorderWidth === "number" && p.styleBorderWidth > 0) {
    model.border = `${p.styleBorderWidth}px solid ${String(p.styleBorderColor ?? "#e2e8f0")}`
  }

  if (p.positionMode === "free") {
    model.position = "absolute"
    if (typeof p.x === "number") model.left = p.x
    if (typeof p.y === "number") model.top = p.y
    if (typeof p.width === "number") model.width = p.width
    if (typeof p.height === "number" && p.height > 0) model.height = p.height
  }

  if (typeof p.customCss === "string" && p.customCss.trim()) {
    model.customCss = p.customCss.trim()
  }

  return model
}

export function buildHtmlStyleAttr(props: NodeProps, esc: (value: unknown) => string) {
  const model = buildExportStyleModel(props)
  const rules: string[] = []

  if (model.background) rules.push(`background:${model.background}`)
  if (typeof model.opacity === "number") rules.push(`opacity:${model.opacity}`)
  if (typeof model.padding === "number") rules.push(`padding:${model.padding}px`)
  if (typeof model.borderRadius === "number") rules.push(`border-radius:${model.borderRadius}px`)
  if (model.border) rules.push(`border:${model.border}`)
  if (model.position === "absolute") rules.push("position:absolute")
  if (typeof model.left === "number") rules.push(`left:${model.left}px`)
  if (typeof model.top === "number") rules.push(`top:${model.top}px`)
  if (typeof model.width === "number") rules.push(`width:${model.width}px`)
  if (typeof model.height === "number") rules.push(`height:${model.height}px`)
  if (model.customCss) rules.push(model.customCss)

  return rules.length > 0 ? ` style="${esc(rules.join(";"))}"` : ""
}

export function buildJsxStyleExpr(props: NodeProps) {
  const model = buildExportStyleModel(props)
  const pairs: string[] = []

  if (model.background) pairs.push(`background: "${model.background}"`)
  if (typeof model.opacity === "number") pairs.push(`opacity: ${model.opacity}`)
  if (typeof model.padding === "number") pairs.push(`padding: ${model.padding}`)
  if (typeof model.borderRadius === "number") pairs.push(`borderRadius: ${model.borderRadius}`)
  if (model.border) pairs.push(`border: "${model.border}"`)
  if (model.position === "absolute") pairs.push(`position: "absolute"`)
  if (typeof model.left === "number") pairs.push(`left: ${model.left}`)
  if (typeof model.top === "number") pairs.push(`top: ${model.top}`)
  if (typeof model.width === "number") pairs.push(`width: ${model.width}`)
  if (typeof model.height === "number") pairs.push(`height: ${model.height}`)

  return pairs.length > 0 ? ` style={{ ${pairs.join(", ")} }}` : ""
}
