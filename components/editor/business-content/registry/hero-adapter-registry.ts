import { agencyHeroAdapter } from "../adapters/agency-hero-adapter"
import { modularHeroAdapter } from "../adapters/modular-hero-adapter"
import type { HeroBusinessAdapter } from "../types"

const HERO_ADAPTERS: readonly HeroBusinessAdapter[] = [
  agencyHeroAdapter,
  modularHeroAdapter,
]

export function getHeroBusinessAdapter(
  nodeType: string,
): HeroBusinessAdapter | null {
  return (
    HERO_ADAPTERS.find((adapter) =>
      adapter.nodeTypes.includes(nodeType),
    ) ?? null
  )
}

export function isHeroBusinessNode(
  nodeType: string,
): boolean {
  return getHeroBusinessAdapter(nodeType) !== null
}
