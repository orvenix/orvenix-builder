import type {
  MultiTarget,
  ParsedMultiEdit,
} from "@/lib/orvenix-ai/multi"

import type {
  ParsedThemeMutation,
} from "@/lib/orvenix-ai/theme"

export type OrvenixDesignIntent =
  | "premium"
  | "minimal"
  | "modern"
  | "elegant"
  | "compact"
  | "spacious"
  | "unknown"

export interface ParsedDesignIntent {
  intent: OrvenixDesignIntent
  confidence: number
}

export interface OrvenixDesignRecipe {
  intent: Exclude<
    OrvenixDesignIntent,
    "unknown"
  >

  theme: ParsedThemeMutation[]

  multi: Array<
    ParsedMultiEdit & {
      target: Exclude<
        MultiTarget,
        "unknown"
      >
    }
  >
}
