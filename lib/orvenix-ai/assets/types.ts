/**
 * V2-2: vendor-neutral asset contract. Provider adapters (Pexels today,
 * others later) only ever produce a ProviderCandidate; the composer/plan
 * layer only ever consumes an AssetPlanItem. Raw provider JSON never
 * crosses this boundary into EditorTree/Plan V2.
 */

export type AssetRole = "hero" | "gallery"

export interface ProviderCandidate {
  provider: string
  providerAssetId: string
  src: string
  width: number
  height: number
  photographer?: string
  photographerUrl?: string
  attributionUrl?: string
  dominantColor?: string
}

export interface AssetPlanItem {
  role: AssetRole
  searchIntent: string
  provider: string
  providerAssetId: string
  src: string
  alt: string
  width: number
  height: number
  photographer?: string
  photographerUrl?: string
  attributionUrl?: string
  dominantColor?: string
}

export type AssetOrientation = "landscape" | "portrait" | "square"

export interface AssetProvider {
  readonly name: string
  isAvailable(): boolean
  search(query: string, options?: { perPage?: number; orientation?: AssetOrientation }): Promise<ProviderCandidate[]>
}

export interface AssetSearchContext {
  visualFamily: string
  industry?: string
  services?: Array<{ name?: string; description?: string }>
}
