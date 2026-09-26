import type { SectionRole } from "@/lib/orvenix-ai/architect/block-selector"
import type { SectionInstanceAlignment, SectionInstanceVisualPrimitive } from "./composition-context"

/**
 * VisualLayoutPlan V1: bounded executable layout grammar.
 *
 * This is intentionally small: every accepted kind is consumed by the
 * compiler/composer and changes either section tree shape, node order,
 * navigation structure, media framing, or closing surface. There are no
 * CSS/class/component escape hatches here.
 */
export const VISUAL_LAYOUT_KINDS = [
  "standard",
  "card-grid",
  "editorial-split",
  "mirror-split",
  "editorial-passage",
  "oversized-typography",
  "full-bleed-media",
  "dramatic-closing",
  "navigation-classic",
  "navigation-centered-editorial",
  "navigation-split",
  "navigation-overlay",
] as const

export type VisualLayoutKind = (typeof VISUAL_LAYOUT_KINDS)[number]
export type VisualLayoutRhythm = "compact" | "standard" | "spacious"

export interface VisualLayoutPlan {
  kind: VisualLayoutKind
  /** Explicit DOM-order mirror for editorial split passages. */
  mirror?: boolean
  /** Bounded spacing/scale hint consumed only by section-instance compiler. */
  rhythm?: VisualLayoutRhythm
}

export type SectionVisualLayoutPlan = VisualLayoutPlan

export const ROLE_VISUAL_LAYOUT_VOCABULARY: Partial<Record<SectionRole, readonly VisualLayoutKind[]>> = {
  navigation: ["navigation-classic", "navigation-centered-editorial", "navigation-split", "navigation-overlay"],
  hero: ["standard", "editorial-passage", "oversized-typography"],
  services: ["standard", "card-grid", "editorial-split", "mirror-split", "editorial-passage", "oversized-typography"],
  products: ["standard", "card-grid", "editorial-split", "mirror-split", "editorial-passage", "oversized-typography"],
  features: ["standard", "card-grid", "editorial-split", "mirror-split", "editorial-passage", "oversized-typography"],
  content: ["standard", "card-grid", "editorial-split", "mirror-split", "editorial-passage", "oversized-typography"],
  testimonials: ["standard", "editorial-passage", "oversized-typography"],
  gallery: ["standard", "card-grid", "full-bleed-media"],
  contact: ["standard", "dramatic-closing"],
  cta: ["standard", "dramatic-closing"],
}

const VALID_LAYOUT_KINDS = new Set<string>(VISUAL_LAYOUT_KINDS)
const VALID_RHYTHMS = new Set<string>(["compact", "standard", "spacious"])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(obj: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed)
  return Object.keys(obj).every((key) => allowedSet.has(key))
}

export function isValidVisualLayoutKindForRole(role: SectionRole, kind: VisualLayoutKind): boolean {
  return ROLE_VISUAL_LAYOUT_VOCABULARY[role]?.includes(kind) === true
}

export function isValidSectionVisualLayoutPlan(value: unknown, role?: SectionRole): value is SectionVisualLayoutPlan {
  if (!isPlainObject(value)) return false
  if (!hasOnlyKeys(value, ["kind", "mirror", "rhythm"])) return false
  if (typeof value.kind !== "string" || !VALID_LAYOUT_KINDS.has(value.kind)) return false
  if (value.mirror !== undefined && typeof value.mirror !== "boolean") return false
  if (value.rhythm !== undefined && (typeof value.rhythm !== "string" || !VALID_RHYTHMS.has(value.rhythm))) return false
  return role ? isValidVisualLayoutKindForRole(role, value.kind as VisualLayoutKind) : true
}

export function visualPrimitiveToLayout(
  primitive: SectionInstanceVisualPrimitive | undefined,
  alignment?: SectionInstanceAlignment,
): SectionVisualLayoutPlan | undefined {
  if (!primitive || primitive === "standard") return undefined
  if (primitive === "editorial-split") return { kind: "editorial-split", ...(alignment === "right" ? { mirror: true } : {}) }
  if (primitive === "oversized-typography") return { kind: "oversized-typography" }
  if (primitive === "full-bleed-media") return { kind: "full-bleed-media" }
  if (primitive === "dramatic-closing") return { kind: "dramatic-closing" }
  return undefined
}

export function visualLayoutToPrimitive(layout: SectionVisualLayoutPlan | undefined): SectionInstanceVisualPrimitive | undefined {
  if (!layout || layout.kind === "standard" || layout.kind === "card-grid") return undefined
  if (layout.kind === "editorial-split" || layout.kind === "mirror-split") return "editorial-split"
  if (layout.kind === "editorial-passage" || layout.kind === "oversized-typography") return "oversized-typography"
  if (layout.kind === "full-bleed-media") return "full-bleed-media"
  if (layout.kind === "dramatic-closing") return "dramatic-closing"
  return undefined
}

export function visualLayoutForRole(
  role: SectionRole,
  value: unknown,
): SectionVisualLayoutPlan | undefined {
  if (!isValidSectionVisualLayoutPlan(value, role)) return undefined
  return { ...value }
}

export function visualLayoutMirrorsContent(layout: SectionVisualLayoutPlan | undefined): boolean {
  return layout?.kind === "mirror-split" || layout?.mirror === true
}

export function visualLayoutRhythmToScale(layout: SectionVisualLayoutPlan | undefined): "condensed" | "large" | undefined {
  if (layout?.rhythm === "compact") return "condensed"
  if (layout?.rhythm === "spacious") return "large"
  return undefined
}

export type SiteNavVisualLayout = "classic" | "centered-editorial" | "split" | "overlay"

export function visualLayoutToSiteNavLayout(layout: SectionVisualLayoutPlan | undefined): SiteNavVisualLayout | undefined {
  if (!layout) return undefined
  if (layout.kind === "navigation-classic") return "classic"
  if (layout.kind === "navigation-centered-editorial") return "centered-editorial"
  if (layout.kind === "navigation-split") return "split"
  if (layout.kind === "navigation-overlay") return "overlay"
  return undefined
}
