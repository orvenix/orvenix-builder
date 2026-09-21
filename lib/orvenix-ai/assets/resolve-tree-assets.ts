import type { EditorTree } from "@/types/editor"
import type { AssetPlanItem, AssetProvider } from "./types"
import { resolveAssetPlan } from "./asset-plan"

export interface ResolveTreeAssetsContext {
  provider: AssetProvider
  visualFamily: string
  industry?: string
  services?: Array<{ name?: string; description?: string }>
  /** Local-only label for alt text -- never sent to the provider. */
  businessName?: string
}

/**
 * Identifies which image placeholders are "hero" vs "gallery" purely by
 * the exact literal alt text the composer already assigns (see
 * lib/orvenix-ai/composer/section-composer.ts) -- the final, persisted
 * EditorNode has no surviving section/role tag (ComposedNode.displayName
 * does not survive blueprint compilation), so this is the only stable
 * signal available without touching the composer. Only untouched
 * placeholders (props.src === "") are ever considered, so a node a prior
 * pass or the user already set is never overwritten.
 */
function isHeroPlaceholder(props: Record<string, unknown>): boolean {
  return props.src === "" && props.alt === "Imagen principal del negocio"
}

function isGalleryPlaceholder(props: Record<string, unknown>): boolean {
  return props.src === "" && typeof props.alt === "string" && /^Imagen del negocio \d+$/.test(props.alt)
}

/**
 * Best-effort async asset-resolution pass, run once per generation AFTER
 * pages are composed and content-filled, BEFORE the Preview plan is
 * persisted (see autonomous/site-builder.ts). Pure with respect to its
 * inputs -- returns a new pages array, never mutates the input trees or
 * any hidden global state. Gallery uniqueness is scoped per page (a
 * fresh provider search, and a fresh dedup set, per page), matching
 * V2-2 Section 5's "never duplicate within the same page" requirement.
 */
export async function resolveTreeImageAssets<T extends { name: string; slug: string; tree: EditorTree }>(
  pages: T[],
  context: ResolveTreeAssetsContext,
): Promise<T[]> {
  if (!context.provider.isAvailable()) return pages

  const searchContext = { visualFamily: context.visualFamily, industry: context.industry, services: context.services }

  let heroItem: AssetPlanItem | undefined
  let heroResolutionAttempted = false

  const resolvedPages: T[] = []

  for (const page of pages) {
    const nodes = { ...page.tree.nodes }
    let changed = false

    const galleryNodeIds = Object.keys(nodes).filter((id) => isGalleryPlaceholder(nodes[id].props))
    const heroNodeIds = Object.keys(nodes).filter((id) => isHeroPlaceholder(nodes[id].props))

    if (heroNodeIds.length > 0 && !heroResolutionAttempted) {
      heroResolutionAttempted = true
      try {
        const [resolved] = await resolveAssetPlan({
          provider: context.provider,
          role: "hero",
          context: searchContext,
          altSeed: context.businessName,
          count: 1,
        })
        heroItem = resolved
      } catch {
        heroItem = undefined
      }
    }

    if (heroItem) {
      for (const id of heroNodeIds) {
        nodes[id] = { ...nodes[id], props: { ...nodes[id].props, src: heroItem.src, alt: heroItem.alt } }
        changed = true
      }
    }

    if (galleryNodeIds.length > 0) {
      let galleryItems: AssetPlanItem[] = []
      try {
        galleryItems = await resolveAssetPlan({
          provider: context.provider,
          role: "gallery",
          context: searchContext,
          altSeed: context.businessName,
          count: galleryNodeIds.length,
        })
      } catch {
        galleryItems = []
      }

      galleryNodeIds.forEach((id, index) => {
        const item = galleryItems[index]
        if (!item) return
        nodes[id] = { ...nodes[id], props: { ...nodes[id].props, src: item.src, alt: item.alt } }
        changed = true
      })
    }

    resolvedPages.push(changed ? { ...page, tree: { ...page.tree, nodes } } : page)
  }

  return resolvedPages
}
