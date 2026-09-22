import type { EditorTree } from "@/types/editor"

/**
 * V2-2 closeout: Pexels' official API documentation requires "a prominent
 * link to Pexels" for any use of API-sourced content; per-photo
 * photographer credit is documented as recommended, not mandatory (see
 * the V2-2 closeout report for the exact quoted requirement). This module
 * only computes WHICH provider credits a given tree actually needs --
 * rendering lives in components/SiteCopyrightBar.tsx.
 */
export interface ProviderAttribution {
  provider: string
  label: string
  href: string
}

/**
 * One entry per provider whose asset provenance can appear in a tree.
 * Registry-driven so a second provider gets its own credit behavior by
 * adding an entry here -- callers never branch on provider name.
 */
const PROVIDER_ATTRIBUTION: Record<string, ProviderAttribution> = {
  pexels: { provider: "pexels", label: "Fotos de Pexels", href: "https://www.pexels.com" },
}

function findAssetProviders(tree: EditorTree): Set<string> {
  const providers = new Set<string>()

  for (const node of Object.values(tree.nodes ?? {})) {
    const provider = (node?.props as { asset?: { provider?: unknown } } | undefined)?.asset?.provider
    if (typeof provider === "string" && provider) providers.add(provider)
  }

  return providers
}

/**
 * Deterministic and deduplicated: one attribution entry per DISTINCT
 * provider actually present in the tree (multiple assets from the same
 * provider never produce duplicate entries), sorted for stable output.
 * A tree with no provider-sourced assets (eg. every image is still the
 * empty placeholder, or was manually replaced by the user) returns [].
 */
export function resolveTreeAttributions(tree: EditorTree | undefined | null): ProviderAttribution[] {
  if (!tree) return []

  return [...findAssetProviders(tree)]
    .map((provider) => PROVIDER_ATTRIBUTION[provider])
    .filter((entry): entry is ProviderAttribution => Boolean(entry))
    .sort((a, b) => a.provider.localeCompare(b.provider))
}
