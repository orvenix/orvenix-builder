import type { Breakpoint, DeviceMode, NodeProps, ResponsiveContract } from "@/types/editor";

// ─── Breakpoint order (largest → smallest) ───────────────────────────────────

/** Cascade resolution order: each breakpoint inherits from all larger ones. */
export const BREAKPOINT_ORDER: Breakpoint[] = ["xl", "lg", "md", "sm", "base"];

/**
 * Maps a canvas DeviceMode to its corresponding Breakpoint key.
 * Legacy device modes (desktop/tablet/mobile) map to standard breakpoints.
 */
export const DEVICE_TO_BREAKPOINT: Record<DeviceMode, Breakpoint> = {
  desktop: "xl",
  lg:      "lg",
  tablet:  "md",
  sm:      "sm",
  mobile:  "base",
};

/**
 * Returns the breakpoints that are "active" (i.e. applied) when resolving
 * props at a given DeviceMode. Larger breakpoints come first.
 *
 * Example: viewing "tablet" (md) → active chain is ["xl", "lg", "md"]
 */
export function getActiveBreakpoints(device: DeviceMode): Breakpoint[] {
  const target = DEVICE_TO_BREAKPOINT[device];
  const idx = BREAKPOINT_ORDER.indexOf(target);
  return BREAKPOINT_ORDER.slice(0, idx + 1);
}

// ─── Responsive-eligible props ────────────────────────────────────────────────

const RESPONSIVE_KEYS = new Set([
  "positionMode",
  "x", "y", "width", "height", "zIndex", "snapToGrid", "gridSize",
  "styleBackground", "styleOpacity", "stylePadding", "styleRadius",
  "styleBorderWidth", "styleBorderColor", "styleShadow",
  "motionAnimation", "motionTransition", "motionEasing",
  "motionDuration", "motionDelay",
]);

export function isResponsiveEditorProp(key: string) {
  return RESPONSIVE_KEYS.has(key);
}

export function pickResponsiveEditorProps(props: NodeProps | undefined): NodeProps {
  if (!props) return {};
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => isResponsiveEditorProp(key))
  );
}

export function shouldStorePatchInDevice(patch: NodeProps) {
  const keys = Object.keys(patch);
  return keys.length > 0 && keys.every(isResponsiveEditorProp);
}

// ─── Resolution ───────────────────────────────────────────────────────────────

/**
 * Resolves the effective props for a node at a given device mode.
 *
 * Desktop/xl props live at the root of node.props.
 * Smaller-breakpoint overrides cascade on top: xl → lg → md → sm → base.
 *
 * Backward-compat: old keys "tablet" and "mobile" are treated as "md" and "base".
 */
export function resolveResponsiveProps(
  props: NodeProps | undefined,
  device: DeviceMode
): NodeProps {
  if (!props) return {};

  if (device === "desktop") return props;

  const contract = getResponsiveContract(props);
  const activeBreakpoints = getActiveBreakpoints(device).slice(1); // skip xl (root)

  return activeBreakpoints.reduce<NodeProps>(
    (acc, bp) => ({ ...acc, ...(contract[bp] ?? {}) }),
    { ...props }
  );
}

/**
 * Stores a responsive patch for the given device, merging into the contract.
 */
export function applyResponsivePatch(
  props: NodeProps,
  device: DeviceMode,
  patch: NodeProps
): NodeProps {
  if (device === "desktop") {
    return { ...props, ...patch };
  }

  const bp = DEVICE_TO_BREAKPOINT[device];
  const contract = getResponsiveContract(props);
  return {
    ...props,
    responsive: {
      ...contract,
      [bp]: { ...(contract[bp] ?? {}), ...patch },
    },
  };
}

export function removeResponsiveDevicePatch(
  props: NodeProps,
  device: Exclude<DeviceMode, "desktop">
): NodeProps {
  const bp = DEVICE_TO_BREAKPOINT[device];
  const contract = getResponsiveContract(props);
  if (!contract[bp]) return props;

  const next = { ...contract };
  delete next[bp];

  const nextProps = { ...props };
  if (Object.keys(next).length === 0) {
    delete nextProps.responsive;
  } else {
    nextProps.responsive = next;
  }
  return nextProps;
}

export function hasResponsiveDevicePatch(
  props: NodeProps | undefined,
  device: Exclude<DeviceMode, "desktop">
): boolean {
  if (!props) return false;
  const bp = DEVICE_TO_BREAKPOINT[device];
  return Boolean(getResponsiveContract(props)[bp]);
}

// ─── Inheritance indicator ────────────────────────────────────────────────────

/**
 * Returns the breakpoints that currently have overrides affecting the given
 * device. Used by the inspector to show inheritance badges.
 *
 * Example: at "tablet" (md), returns ["lg"] if only lg has an override.
 */
export function getBreakpointInheritanceSources(
  props: NodeProps | undefined,
  device: DeviceMode
): Breakpoint[] {
  if (!props || device === "desktop") return [];
  const contract = getResponsiveContract(props);
  const active = getActiveBreakpoints(device).slice(1); // skip xl
  return active.filter((bp) => Boolean(contract[bp]));
}

// ─── Visual styles ────────────────────────────────────────────────────────────

export function getEditorVisualStyle(props: NodeProps | undefined): React.CSSProperties {
  if (!props) return {};

  const background = toCssColor(props.styleBackground);
  const borderColor = toCssColor(props.styleBorderColor);
  const opacity = toClampedNumber(props.styleOpacity, 100, 0, 100) / 100;
  const padding = toClampedNumber(props.stylePadding, 0, 0, 96);
  const radius = toClampedNumber(props.styleRadius, 0, 0, 64);
  const borderWidth = toClampedNumber(props.styleBorderWidth, 0, 0, 12);
  const shadow = getShadow(String(props.styleShadow ?? "none"));

  return {
    ...(background ? { background } : {}),
    ...(opacity < 1 ? { opacity } : {}),
    ...(padding > 0 ? { padding } : {}),
    ...(radius > 0 ? { borderRadius: radius } : {}),
    ...(borderWidth > 0
      ? { borderWidth, borderStyle: "solid", borderColor: borderColor || "#e2e8f0" }
      : {}),
    ...(shadow ? { boxShadow: shadow } : {}),
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Reads the responsive contract from props, handling legacy tablet/mobile keys. */
function getResponsiveContract(props: NodeProps): ResponsiveContract {
  const raw = props.responsive;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const contract = raw as Record<string, NodeProps>;
  const result: ResponsiveContract = {};

  for (const [key, value] of Object.entries(contract)) {
    if (!value) continue;
    // Map legacy keys
    if (key === "tablet") { result.md = { ...result.md, ...value }; continue; }
    if (key === "mobile") { result.base = { ...result.base, ...value }; continue; }
    // Standard breakpoint keys
    if (key === "base" || key === "sm" || key === "md" || key === "lg" || key === "xl") {
      result[key as Breakpoint] = { ...result[key as Breakpoint], ...value };
    }
  }

  return result;
}

function toCssColor(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function toClampedNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function getShadow(value: string) {
  switch (value) {
    case "soft":   return "0 10px 24px rgba(15,23,42,0.12)";
    case "medium": return "0 18px 42px rgba(15,23,42,0.18)";
    case "strong": return "0 28px 70px rgba(15,23,42,0.28)";
    case "glow":   return "0 0 0 1px rgba(99,102,241,0.18), 0 18px 48px rgba(99,102,241,0.28)";
    default:       return "";
  }
}
