import type { EditorNode, EditorTree, GlobalTheme } from "../../../types/editor"
import {
  normalizePublishedUrl,
  tokenToFontSize,
  tokenToFontWeight,
  tokenToMaxWidth,
  tokenToRadius,
  tokenToShadow,
  tokenToSpacing,
} from "./document"

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function escapeHtmlAttribute(value: unknown) {
  return escapeHtml(String(value ?? ""))
}

export function formatRichText(value: unknown) {
  return escapeHtml(String(value ?? "")).replace(/\n/g, "<br>")
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null
}

function readNumber(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function pushStyle(styles: string[], property: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return
  styles.push(`${property}:${value};`)
}

function toCssColor(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null
  return value.startsWith("var(--") ? value : value.trim()
}

function widthOrPosition(value: unknown) {
  const numeric = readNumber(value)
  return numeric === null ? null : `${numeric}px`
}

function resolveButtonPadding(size: unknown) {
  switch (size) {
    case "sm":
      return "0.7rem 1rem"
    case "lg":
      return "1rem 1.5rem"
    default:
      return "0.85rem 1.2rem"
  }
}

function resolveButtonFontSize(size: unknown) {
  switch (size) {
    case "sm":
      return "0.9rem"
    case "lg":
      return "1rem"
    default:
      return "0.95rem"
  }
}

function resolveTextMaxWidth(token: unknown) {
  switch (token) {
    case "sm":
      return "28rem"
    case "md":
      return "36rem"
    case "lg":
      return "42rem"
    default:
      return null
  }
}

function resolveHeadingMarginBottom(token: unknown) {
  switch (token) {
    case "none":
      return "0"
    case "sm":
      return "0.5rem"
    case "lg":
      return "2rem"
    default:
      return "1rem"
  }
}

function resolveCustomShadow(token: unknown) {
  switch (token) {
    case "soft":
      return "0 12px 24px rgba(15,23,42,0.08)"
    case "medium":
      return "0 18px 36px rgba(15,23,42,0.12)"
    case "strong":
      return "0 26px 60px rgba(15,23,42,0.16)"
    case "glow":
      return "0 0 0 1px rgba(56,189,248,0.15), 0 20px 40px rgba(56,189,248,0.18)"
    default:
      return null
  }
}

function getSafeTag(tagName: string) {
  const safeTags = new Set([
    "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "section", "article", "header", "footer", "main", "aside",
    "ul", "ol", "li", "blockquote", "code", "pre",
  ])
  return safeTags.has(tagName) ? tagName : "div"
}

export function getHtmlTag(node: EditorNode) {
  switch (node.type) {
    case "section":
      return "section"
    case "heading": {
      const level = Math.max(1, Math.min(6, readNumber(node.props.level) ?? 2))
      return `h${level}`
    }
    case "text":
      return "p"
    case "ctaButton":
      return "a"
    case "genericWrapper":
      return getSafeTag(readString(node.props.originalType) ?? "div")
    default:
      return "div"
  }
}

export function getNodeStyle(node: EditorNode, theme: GlobalTheme) {
  const props = node.props
  const styles: string[] = []
  const align = readString(props.align)
  const color = toCssColor(props.color)
  const background = toCssColor(props.background ?? props.styleBackground)
  const width = readNumber(props.width)
  const height = readNumber(props.height)

  if (node.type === "section") {
    pushStyle(styles, "width", "100%")
    pushStyle(styles, "padding-top", tokenToSpacing(props.paddingY) ?? "1.5rem")
    pushStyle(styles, "padding-bottom", tokenToSpacing(props.paddingY) ?? "1.5rem")
    pushStyle(styles, "padding-left", tokenToSpacing(props.paddingX))
    pushStyle(styles, "padding-right", tokenToSpacing(props.paddingX))
    pushStyle(styles, "margin-top", tokenToSpacing(props.marginY))
    pushStyle(styles, "margin-bottom", tokenToSpacing(props.marginY))
    pushStyle(styles, "text-align", align)
    pushStyle(styles, "max-width", tokenToMaxWidth(props.maxWidth))
    pushStyle(styles, "margin-left", "auto")
    pushStyle(styles, "margin-right", "auto")
    pushStyle(styles, "background", background)
    pushStyle(styles, "border-radius", tokenToRadius(props.borderRadius))
    pushStyle(styles, "box-shadow", tokenToShadow(props.shadow))
  }

  if (node.type === "heading") {
    pushStyle(styles, "margin", "0")
    pushStyle(styles, "margin-bottom", resolveHeadingMarginBottom(props.marginBottom))
    pushStyle(styles, "font-family", "var(--font-heading)")
    pushStyle(styles, "font-size", tokenToFontSize(props.size, node.type) ?? "2rem")
    pushStyle(styles, "font-weight", tokenToFontWeight(props.weight) ?? "700")
    pushStyle(styles, "line-height", "1.1")
    pushStyle(styles, "letter-spacing", "-0.03em")
    pushStyle(styles, "text-align", align)
    pushStyle(styles, "color", color ?? theme.colors?.primary)
  }

  if (node.type === "text") {
    pushStyle(styles, "margin", "0")
    pushStyle(styles, "font-size", tokenToFontSize(props.size, node.type) ?? "1rem")
    pushStyle(styles, "line-height", "1.75")
    pushStyle(styles, "text-align", align)
    pushStyle(styles, "color", color ?? theme.colors?.text)
    pushStyle(styles, "max-width", resolveTextMaxWidth(props.maxWidth))
    if (align === "center") {
      pushStyle(styles, "margin-left", "auto")
      pushStyle(styles, "margin-right", "auto")
    }
    if (align === "right") {
      pushStyle(styles, "margin-left", "auto")
    }
  }

  if (node.type === "ctaButton") {
    const variant = readString(props.variant) ?? "primary"
    pushStyle(styles, "display", "inline-flex")
    pushStyle(styles, "align-items", "center")
    pushStyle(styles, "justify-content", "center")
    pushStyle(styles, "gap", "0.5rem")
    pushStyle(styles, "text-decoration", "none")
    pushStyle(styles, "font-weight", "700")
    pushStyle(styles, "border-radius", "999px")
    pushStyle(styles, "padding", resolveButtonPadding(props.size))
    pushStyle(styles, "font-size", resolveButtonFontSize(props.size))
    pushStyle(styles, "transition", "transform .2s ease, opacity .2s ease")

    if (variant === "secondary") {
      pushStyle(styles, "background", "#ffffff")
      pushStyle(styles, "color", theme.colors?.secondary)
      pushStyle(styles, "border", `1px solid ${theme.colors?.secondary ?? "#4f46e5"}33`)
    } else if (variant === "ghost") {
      pushStyle(styles, "background", "transparent")
      pushStyle(styles, "color", theme.colors?.secondary)
      pushStyle(styles, "border", `1px solid ${theme.colors?.secondary ?? "#4f46e5"}33`)
    } else {
      pushStyle(styles, "background", theme.colors?.secondary ?? "#4f46e5")
      pushStyle(styles, "color", "#ffffff")
      pushStyle(styles, "border", "1px solid transparent")
      pushStyle(styles, "box-shadow", "0 16px 32px rgba(79,70,229,0.18)")
    }
  }

  if (node.type === "image") {
    pushStyle(styles, "display", "block")
    pushStyle(styles, "max-width", width ? `${width}px` : "100%")
    pushStyle(styles, "width", width ? `${width}px` : "100%")
    pushStyle(styles, "height", height ? `${height}px` : "auto")
    pushStyle(styles, "object-fit", readString(props.objectFit) ?? "cover")
    pushStyle(styles, "border-radius", tokenToRadius(props.borderRadius) ?? "1rem")
  }

  if (node.type === "genericWrapper") {
    pushStyle(styles, "width", width ? `${width}px` : null)
    pushStyle(styles, "height", height ? `${height}px` : null)
  }

  const opacity = readNumber(props.styleOpacity)
  if (opacity !== null) pushStyle(styles, "opacity", Math.max(0, Math.min(100, opacity)) / 100)
  pushStyle(styles, "padding", readNumber(props.stylePadding) ? `${readNumber(props.stylePadding)}px` : null)
  pushStyle(styles, "border-radius", readNumber(props.styleRadius) ? `${readNumber(props.styleRadius)}px` : null)
  pushStyle(styles, "border-width", readNumber(props.styleBorderWidth) ? `${readNumber(props.styleBorderWidth)}px` : null)
  pushStyle(styles, "border-style", readNumber(props.styleBorderWidth) ? "solid" : null)
  pushStyle(styles, "border-color", toCssColor(props.styleBorderColor))
  pushStyle(styles, "background", background)
  pushStyle(styles, "box-shadow", resolveCustomShadow(props.styleShadow))

  if (props.positionMode === "free") {
    pushStyle(styles, "position", "absolute")
    pushStyle(styles, "left", widthOrPosition(props.x))
    pushStyle(styles, "top", widthOrPosition(props.y))
    pushStyle(styles, "width", widthOrPosition(props.width))
    pushStyle(styles, "height", widthOrPosition(props.height))
    pushStyle(styles, "z-index", readNumber(props.zIndex))
  }

  return styles.join("")
}

export function getNodeAttributes(node: EditorNode, theme: GlobalTheme) {
  const attrs: string[] = []
  const style = getNodeStyle(node, theme)
  if (style) attrs.push(`style="${escapeHtmlAttribute(style)}"`)

  if (node.type === "ctaButton") {
    const href = normalizePublishedUrl(readString(node.props.href) ?? "#")
    attrs.push(`href="${escapeHtmlAttribute(href)}"`)
  }

  if (node.type === "image") {
    const src = normalizePublishedUrl(readString(node.props.src) ?? "")
    attrs.push(`src="${escapeHtmlAttribute(src)}"`)
    attrs.push(`alt="${escapeHtmlAttribute(readString(node.props.alt) ?? "")}"`)
    attrs.push(`loading="lazy"`)
    attrs.push(`decoding="async"`)
  }

  if (node.type === "genericWrapper") {
    const className = readString(node.props.className)
    if (className) attrs.push(`class="${escapeHtmlAttribute(className)}"`)
    const originalType = readString(node.props.originalType)
    if (originalType) attrs.push(`data-original-type="${escapeHtmlAttribute(originalType)}"`)
  }

  return attrs.length ? ` ${attrs.join(" ")}` : ""
}

export function renderNodeToHtml(node: EditorNode, tree: EditorTree, theme: GlobalTheme): string {
  if (node.hidden) return ""

  if (node.type === "image") {
    return `<img${getNodeAttributes(node, theme)} />`
  }

  if (node.type === "section") {
    return renderSectionNode(node, tree, theme)
  }

  const tagName = getHtmlTag(node)
  const childrenHtml = node.children
    .map((childId) => {
      const childNode = tree.nodes[childId]
      return childNode ? renderNodeToHtml(childNode, tree, theme) : ""
    })
    .join("")

  let innerHtml = childrenHtml
  if (!innerHtml) {
    if (node.type === "genericWrapper" && readString(node.props.content)) {
      innerHtml = readString(node.props.content) ?? ""
    } else if (node.props.text) innerHtml = formatRichText(node.props.text)
    else if (node.props.content) innerHtml = formatRichText(node.props.content)
    else if (node.props.label) innerHtml = escapeHtml(String(node.props.label))
  }

  return `<${tagName}${getNodeAttributes(node, theme)}>${innerHtml}</${tagName}>`
}

export function renderSectionNode(node: EditorNode, tree: EditorTree, theme: GlobalTheme) {
  const tagName = getHtmlTag(node)
  const outerAttributes = getNodeAttributes(node, theme)
  const innerStyles: string[] = []
  pushStyle(innerStyles, "width", "100%")
  pushStyle(innerStyles, "max-width", tokenToMaxWidth(node.props.maxWidth) ?? "72rem")
  pushStyle(innerStyles, "margin-left", "auto")
  pushStyle(innerStyles, "margin-right", "auto")
  pushStyle(innerStyles, "padding-left", tokenToSpacing(node.props.paddingX) ?? "1.5rem")
  pushStyle(innerStyles, "padding-right", tokenToSpacing(node.props.paddingX) ?? "1.5rem")
  pushStyle(innerStyles, "text-align", readString(node.props.align) ?? "left")

  const childrenHtml = node.children
    .map((childId) => {
      const childNode = tree.nodes[childId]
      return childNode ? renderNodeToHtml(childNode, tree, theme) : ""
    })
    .join("")

  return `<${tagName}${outerAttributes}><div style="${escapeHtmlAttribute(innerStyles.join(""))}">${childrenHtml}</div></${tagName}>`
}

export function buildDocumentCss(theme: GlobalTheme) {
  const themeCssVars = Object.entries(theme.colors ?? {})
    .map(([key, value]) => `--${key}:${value};`)
    .join("")
  const spacingVars = Object.entries(theme.spacing ?? {})
    .map(([key, value]) => `--space-${key}:${value};`)
    .join("")
  const radiusVars = Object.entries(theme.radius ?? {})
    .map(([key, value]) => `--radius-${key}:${value};`)
    .join("")
  const shadowVars = Object.entries(theme.shadow ?? {})
    .map(([key, value]) => `--shadow-${key}:${value};`)
    .join("")
  const motionVars = Object.entries(theme.motion ?? {})
    .map(([key, value]) => `--motion-${key}:${value};`)
    .join("")

  return `
    :root{${themeCssVars}${spacingVars}${radiusVars}${shadowVars}${motionVars}--font-heading:${theme.fontHeading};--font-body:${theme.fontBody};}
    *{box-sizing:border-box;}
    html{scroll-behavior:smooth;}
    body{
      margin:0;
      font-family:var(--font-body);
      color:var(--text);
      background:var(--background);
      -webkit-font-smoothing:antialiased;
      text-rendering:optimizeLegibility;
    }
    img{max-width:100%;}
    a{color:inherit;}
    main{
      position:relative;
      width:100%;
      overflow-x:hidden;
    }
  `
}
