import type { GlobalTheme } from "../../../types/editor"

/**
 * PCE-4A: the ONE canonical runtime reading of semantic motion intent.
 *
 * AI never persists a motion bucket. It chooses `visualDirection.motionBucket`
 * (none|subtle|expressive), and the site builder translates that into
 * `theme.motion.duration` (0ms / 180ms / 320ms). The persisted theme field is
 * therefore the single source of truth; this module inverts it with the same
 * thresholds Design Memory uses (design-pattern.ts imports it), so runtime and
 * Design Memory can never disagree about a site's motion intent.
 *
 * The bucket only selects Orvenix-owned interaction tokens (globals.css,
 * `.editor-render-scope[data-motion]`). Raw durations/easings/transforms are
 * never forwarded from here.
 */
export type RuntimeMotionBucket = "none" | "subtle" | "expressive"

export const RUNTIME_MOTION_BUCKETS: readonly RuntimeMotionBucket[] = ["none", "subtle", "expressive"]

/** Durations at or below this (ms) read as "subtle"; above it, "expressive". */
const SUBTLE_MAX_DURATION_MS = 200

/**
 * Orvenix's own default theme duration (document.ts, sitePages.ts, CtaButton,
 * exportCss all fall back to 240ms). A theme with no readable duration has
 * always rendered with it, so legacy resolution preserves that behavior.
 */
const LEGACY_DEFAULT_DURATION_MS = 240

/** Parses a CSS time ("180ms", "0.3s", "0") into milliseconds, or null. */
export function parseCssDurationMs(value: unknown): number | null {
  if (typeof value !== "string") return null
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*(ms|s)?$/i)
  if (!match) return null
  const amount = Number.parseFloat(match[1])
  if (!Number.isFinite(amount)) return null
  return match[2]?.toLowerCase() === "s" ? amount * 1000 : amount
}

/** Duration -> bucket. Null when the theme carries no readable duration. */
export function motionBucketFromDuration(duration: unknown): RuntimeMotionBucket | null {
  const ms = parseCssDurationMs(duration)
  if (ms === null) return null
  if (ms <= 0) return "none"
  if (ms <= SUBTLE_MAX_DURATION_MS) return "subtle"
  return "expressive"
}

export function resolveRuntimeMotionBucket(theme: GlobalTheme | null | undefined): RuntimeMotionBucket {
  const motion = theme && typeof theme === "object" ? theme.motion : undefined
  const duration = motion && typeof motion === "object" ? motion.duration : undefined
  return motionBucketFromDuration(duration) ?? motionBucketFromDuration(`${LEGACY_DEFAULT_DURATION_MS}ms`)!
}

export function getRuntimeMotionAttributes(theme: GlobalTheme | null | undefined) {
  return {
    "data-motion": resolveRuntimeMotionBucket(theme),
  } as const
}
