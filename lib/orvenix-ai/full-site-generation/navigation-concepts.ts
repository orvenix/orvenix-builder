import type { CommerceNavigationStyleV1 } from "@/lib/orvenix-ai/commerce/architecture-contract"
import type { SectionVisualLayoutPlan } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import { visualLayoutToSiteNavLayout, type SiteNavVisualLayout } from "@/lib/orvenix-ai/composer/visual-layout-plan"
import type { FullSiteNavigationConceptV1, FullSitePagePurposeV1 } from "./contract"

/**
 * CF-1 renderer truth: the ONE definition of what a blueprint
 * `navigation.concept` actually does. The commerce adapter, the commerce
 * architecture and the capability manifest all derive from these maps, so
 * the external architect is told exactly what renders -- never a distinct
 * behavior that collapses to another one.
 */

export const NAVIGATION_STYLE_BY_CONCEPT_V1: Record<FullSiteNavigationConceptV1, CommerceNavigationStyleV1> = {
  classic: "classic-store",
  "catalog-forward": "category-forward",
  editorial: "editorial-commerce",
  compact: "compact-catalog",
  "conversion-led": "promotional",
}

/** Primary navigation page purposes used when the blueprint gives no `primaryPurposes`. */
export const DEFAULT_PRIMARY_PURPOSES_BY_CONCEPT_V1: Record<FullSiteNavigationConceptV1, FullSitePagePurposeV1[]> = {
  classic: ["home", "catalog", "category", "help"],
  editorial: ["home", "catalog", "help"],
  "catalog-forward": ["home", "catalog", "category"],
  compact: ["home", "catalog"],
  "conversion-led": ["home", "catalog"],
}

export const NAVIGATION_LAYOUT_BY_STYLE_V1: Record<CommerceNavigationStyleV1, SectionVisualLayoutPlan> = {
  "classic-store": { kind: "navigation-classic" },
  "category-forward": { kind: "navigation-split" },
  "editorial-commerce": { kind: "navigation-centered-editorial" },
  "compact-catalog": { kind: "navigation-classic", rhythm: "compact" },
  promotional: { kind: "navigation-split", rhythm: "spacious" },
}

export type NavigationConceptEffectV1 = {
  /** The SiteNav layout that renders (the nav composer reads only the layout kind). */
  renderedLayout: SiteNavVisualLayout
  defaultPrimaryPurposes: FullSitePagePurposeV1[]
}

export function navigationConceptEffectsV1(): Record<FullSiteNavigationConceptV1, NavigationConceptEffectV1> {
  const effects = {} as Record<FullSiteNavigationConceptV1, NavigationConceptEffectV1>
  for (const concept of Object.keys(NAVIGATION_STYLE_BY_CONCEPT_V1) as FullSiteNavigationConceptV1[]) {
    effects[concept] = {
      renderedLayout: visualLayoutToSiteNavLayout(NAVIGATION_LAYOUT_BY_STYLE_V1[NAVIGATION_STYLE_BY_CONCEPT_V1[concept]]) ?? "classic",
      defaultPrimaryPurposes: [...DEFAULT_PRIMARY_PURPOSES_BY_CONCEPT_V1[concept]],
    }
  }
  return effects
}
