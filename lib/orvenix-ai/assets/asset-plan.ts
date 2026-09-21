import type { AssetPlanItem, AssetProvider, AssetRole, AssetSearchContext, ProviderCandidate } from "./types"
import { buildSearchIntentHierarchy } from "./search-intent"

export interface ResolveAssetPlanParams {
  provider: AssetProvider
  role: AssetRole
  context: AssetSearchContext
  /** Local-only label (eg. business name) used for alt text. Never sent to the provider -- see search-intent.ts. */
  altSeed?: string
  /** How many distinct candidates to return (hero: 1, gallery: up to N). */
  count: number
}

function buildAlt(role: AssetRole, altSeed?: string): string {
  const suffix = role === "hero" ? "imagen principal" : "galería";
  if (altSeed) return `${altSeed} — ${suffix}`;
  return role === "hero" ? "Imagen principal del negocio" : "Imagen del negocio";
}

/**
 * Attribution/provenance is required, not optional, to select a
 * candidate: Pexels attribution is only "recommended" per-image, but we
 * follow the requirement conservatively rather than discard provenance
 * (see V2-2 Section 9). A candidate missing photographer/attribution is
 * treated the same as an invalid candidate -- skipped, never selected.
 */
function hasRequiredProvenance(candidate: ProviderCandidate): boolean {
  return Boolean(candidate.photographer && candidate.attributionUrl);
}

function toAssetPlanItem(role: AssetRole, searchIntent: string, altSeed: string | undefined, candidate: ProviderCandidate): AssetPlanItem {
  return {
    role,
    searchIntent,
    provider: candidate.provider,
    providerAssetId: candidate.providerAssetId,
    src: candidate.src,
    alt: buildAlt(role, altSeed),
    width: candidate.width,
    height: candidate.height,
    photographer: candidate.photographer,
    photographerUrl: candidate.photographerUrl,
    attributionUrl: candidate.attributionUrl,
    dominantColor: candidate.dominantColor,
  };
}

/**
 * One search call per fallback tier (never one call per image slot). Tries
 * each tier of the deterministic search-intent hierarchy in order and
 * stops at the first tier that returns at least one usable (provenance-
 * checked) candidate. Never throws: a provider failure at any tier just
 * moves to the next tier, and an empty hierarchy result yields [].
 */
async function searchFirstUsableTier(
  provider: AssetProvider,
  role: AssetRole,
  context: AssetSearchContext,
  perPage: number,
): Promise<{ searchIntent: string; candidates: ProviderCandidate[] } | null> {
  const hierarchy = buildSearchIntentHierarchy({ ...context, role });

  for (const searchIntent of hierarchy) {
    let candidates: ProviderCandidate[];
    try {
      candidates = await provider.search(searchIntent, { perPage });
    } catch {
      continue;
    }

    const usable = candidates.filter(hasRequiredProvenance);
    if (usable.length > 0) return { searchIntent, candidates: usable };
  }

  return null;
}

/**
 * Resolves up to `count` distinct AssetPlanItems for a role from a SINGLE
 * provider search (one query per semantic intent, never one query per
 * image slot). Distinct providerAssetIds only -- if the batch has fewer
 * usable candidates than requested, the remaining slots are left for the
 * caller to keep at their current placeholder rather than duplicating a
 * photo across a visible gallery grid.
 */
export async function resolveAssetPlan(params: ResolveAssetPlanParams): Promise<AssetPlanItem[]> {
  const { provider, role, context, altSeed, count } = params;

  if (!provider.isAvailable() || count <= 0) return [];

  const perPage = Math.max(count + 2, 5);
  const result = await searchFirstUsableTier(provider, role, context, perPage);
  if (!result) return [];

  const seen = new Set<string>();
  const items: AssetPlanItem[] = [];

  for (const candidate of result.candidates) {
    if (items.length >= count) break;
    if (seen.has(candidate.providerAssetId)) continue;
    seen.add(candidate.providerAssetId);
    items.push(toAssetPlanItem(role, result.searchIntent, altSeed, candidate));
  }

  return items;
}
