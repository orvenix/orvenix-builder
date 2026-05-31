import type { DeviceMode, EditorTree, GlobalTheme, NodeProps } from "../../../types/editor"

type PreviewStyleVars = React.CSSProperties

export function getRuntimeDeviceFromWidth(width: number): DeviceMode {
  if (width <= 640) return "mobile"
  if (width <= 1024) return "tablet"
  return "desktop"
}

export function getRuntimeThemeStyleVars(theme: GlobalTheme | null | undefined): PreviewStyleVars {
  if (!theme) {
    return {}
  }

  return {
    "--primary": theme.colors?.primary,
    "--secondary": theme.colors?.secondary,
    "--background": theme.colors?.background,
    "--text": theme.colors?.text,
    "--accent": theme.colors?.accent,
    "--font-heading": theme.fontHeading,
    "--font-body": theme.fontBody,
    "--space-section-x": theme.spacing?.sectionX,
    "--space-section-y": theme.spacing?.sectionY,
    "--space-stack": theme.spacing?.stack,
    "--radius-card": theme.radius?.card,
    "--radius-button": theme.radius?.button,
    "--shadow-soft": theme.shadow?.soft,
    "--shadow-strong": theme.shadow?.strong,
    "--motion-duration": theme.motion?.duration,
    "--motion-easing": theme.motion?.easing,
  } as PreviewStyleVars
}

export function getRuntimePreviewMinHeight(
  tree: EditorTree,
  device: DeviceMode,
  resolveNodeProps: (props: NodeProps | undefined, device: DeviceMode) => NodeProps
) {
  const freeBottom = Object.values(tree.nodes).reduce((height, node) => {
    const props = resolveNodeProps(node.props, device)
    if (props.positionMode !== "free") return height
    return Math.max(
      height,
      toFiniteNumber(props.y, 0) + toFiniteNumber(props.height, 120)
    )
  }, 720)

  return Math.max(720, freeBottom + 48)
}

export function getRuntimeFreePositionStyle(
  props: NodeProps,
  baseStyle: React.CSSProperties = {}
): React.CSSProperties {
  return {
    ...baseStyle,
    position: "absolute",
    left: toFiniteNumber(props.x, 0),
    top: toFiniteNumber(props.y, 0),
    width: toOptionalPixelSize(props.width),
    height: toOptionalPixelSize(props.height),
    zIndex: toFiniteNumber(props.zIndex, 1),
  }
}

function toFiniteNumber(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function toOptionalPixelSize(value: NodeProps[string]) {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? `${numeric}px` : undefined
}
