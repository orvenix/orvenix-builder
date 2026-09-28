import {
  FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
  FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
  type FullSiteCreativeBlueprintProviderV1,
  type FullSiteCreativeBlueprintV1,
} from "./contract"

export type FullSiteTestingBlueprintModeV1 = "conservative-commerce" | "editorial-commerce" | "catalog-heavy-commerce" | "hostile"

function product(index: number) {
  return { kind: "product" as const, index }
}

function category(key: string) {
  return { kind: "category" as const, key }
}

const base = {
  version: FULL_SITE_CREATIVE_BLUEPRINT_VERSION_V1,
  roleKey: FULL_SITE_CREATIVE_BLUEPRINT_ROLE_KEY_V1,
  strategyKey: FULL_SITE_CREATIVE_BLUEPRINT_STRATEGY_KEY_V1,
} as const

export function createCommerceTestingBlueprintV1(mode: FullSiteTestingBlueprintModeV1): unknown {
  if (mode === "hostile") {
    return {
      ...base,
      siteConcept: { narrative: "catalog", rhythm: "dense", density: "rich", className: "fixed" },
      navigation: { concept: "catalog-forward", primaryPurposes: ["home", "catalog"], href: "javascript:alert(1)" },
      pages: [
        {
          purpose: "home",
          target: { kind: "product", index: 999, productId: "pwn" },
          sections: [
            { intent: "featured_collection", role: "products", refs: [product(999)], style: { color: "red" }, priceMxn: 1 },
            { intent: "raw_component", role: "products", jsx: "<script />" },
          ],
        },
      ],
    }
  }

  if (mode === "catalog-heavy-commerce") {
    return {
      ...base,
      siteConcept: { narrative: "catalog", rhythm: "dense", density: "rich" },
      navigation: { concept: "catalog-forward", primaryPurposes: ["home", "catalog", "category"], cartProminence: "prominent" },
      pages: [
        { purpose: "home", density: "balanced", sections: [
          { intent: "opening", role: "hero", layout: { kind: "oversized-typography" } },
          { intent: "navigation_discovery", role: "content", refs: [category("tecnologia"), category("hogar"), category("audio")] },
          { intent: "featured_collection", role: "products", refs: [product(0), product(4), product(8), product(12)], layout: { kind: "card-grid" } },
          { intent: "catalog_surface", role: "products", refs: [category("tecnologia")], layout: { kind: "card-grid", rhythm: "compact" } },
          { intent: "trust", role: "trust" },
          { intent: "closing", role: "cta", layout: { kind: "dramatic-closing" } },
        ] },
        { purpose: "catalog", density: "compact", sections: [
          { intent: "opening", role: "hero" },
          { intent: "navigation_discovery", role: "content", refs: [category("tecnologia"), category("hogar"), category("oficina"), category("accesorios"), category("audio"), category("gaming")] },
          { intent: "catalog_surface", role: "products", layout: { kind: "card-grid", rhythm: "compact" } },
          { intent: "closing", role: "cta" },
        ] },
        { purpose: "category", target: category("tecnologia"), sections: [
          { intent: "opening", role: "hero" },
          { intent: "collection", role: "products", refs: [category("tecnologia")], layout: { kind: "card-grid" } },
          { intent: "closing", role: "cta" },
        ] },
        { purpose: "category", target: category("audio"), sections: [
          { intent: "opening", role: "hero" },
          { intent: "collection", role: "products", refs: [category("audio")], layout: { kind: "card-grid" } },
          { intent: "closing", role: "cta" },
        ] },
        { purpose: "product_detail", target: product(0), sections: [
          { intent: "detail_surface", role: "products", refs: [product(0)], layout: { kind: "editorial-split", rhythm: "spacious" } },
          { intent: "related_items", role: "products", refs: [category("tecnologia")], layout: { kind: "card-grid" } },
          { intent: "closing", role: "cta" },
        ] },
      ],
    } satisfies FullSiteCreativeBlueprintV1
  }

  if (mode === "editorial-commerce") {
    return {
      ...base,
      siteConcept: { narrative: "editorial", rhythm: "immersive", density: "rich" },
      navigation: { concept: "editorial", primaryPurposes: ["home", "catalog"], cartProminence: "subtle" },
      pages: [
        { purpose: "home", density: "immersive", sections: [
          { intent: "opening", role: "hero", mediaIntent: "editorial store opening", layout: { kind: "editorial-passage", rhythm: "spacious" } },
          { intent: "spotlight", role: "products", refs: [product(17)], layout: { kind: "editorial-split", rhythm: "spacious" } },
          { intent: "editorial_passage", role: "features", refs: [category("audio")] },
          { intent: "collection", role: "products", refs: [product(0), product(9), product(13)], layout: { kind: "mirror-split" } },
          { intent: "benefits", role: "features" },
          { intent: "spotlight", role: "products", refs: [product(21)], layout: { kind: "editorial-split" } },
          { intent: "closing", role: "cta", layout: { kind: "dramatic-closing" } },
        ] },
        { purpose: "catalog", density: "balanced", sections: [
          { intent: "opening", role: "hero" },
          { intent: "catalog_surface", role: "products", layout: { kind: "card-grid" } },
          { intent: "trust", role: "trust" },
          { intent: "closing", role: "cta" },
        ] },
        { purpose: "product_detail", target: product(17), sections: [
          { intent: "opening", role: "hero", layout: { kind: "editorial-passage" } },
          { intent: "detail_surface", role: "products", refs: [product(17)], layout: { kind: "mirror-split", rhythm: "spacious" } },
          { intent: "related_items", role: "products", refs: [category("audio")], layout: { kind: "card-grid" } },
          { intent: "benefits", role: "features" },
          { intent: "closing", role: "cta", layout: { kind: "dramatic-closing" } },
        ] },
        { purpose: "product_detail", target: product(21), sections: [
          { intent: "detail_surface", role: "products", refs: [product(21)], layout: { kind: "editorial-split", rhythm: "spacious" } },
          { intent: "related_items", role: "products", refs: [category("gaming")], layout: { kind: "card-grid" } },
          { intent: "closing", role: "cta" },
        ] },
      ],
    } satisfies FullSiteCreativeBlueprintV1
  }

  return {
    ...base,
    siteConcept: { narrative: "product-led", rhythm: "varied", density: "balanced" },
    navigation: { concept: "classic", primaryPurposes: ["home", "catalog"], cartProminence: "subtle" },
    pages: [
      { purpose: "home", sections: [
        { intent: "opening", role: "hero", layout: { kind: "editorial-passage" } },
        { intent: "featured_collection", role: "products", refs: [product(0), product(1), product(2)], layout: { kind: "card-grid" } },
        { intent: "spotlight", role: "products", refs: [product(8)], layout: { kind: "editorial-split" } },
        { intent: "benefits", role: "features" },
        { intent: "closing", role: "cta" },
      ] },
      { purpose: "catalog", sections: [
        { intent: "opening", role: "hero" },
        { intent: "catalog_surface", role: "products", layout: { kind: "card-grid" } },
        { intent: "trust", role: "trust" },
        { intent: "closing", role: "cta" },
      ] },
      { purpose: "product_detail", target: product(0), sections: [
        { intent: "detail_surface", role: "products", refs: [product(0)], layout: { kind: "editorial-split" } },
        { intent: "related_items", role: "products", refs: [category("tecnologia")] },
        { intent: "closing", role: "cta" },
      ] },
    ],
  } satisfies FullSiteCreativeBlueprintV1
}

export function createDeterministicFullSiteCreativeTestingProviderV1(mode: FullSiteTestingBlueprintModeV1): FullSiteCreativeBlueprintProviderV1 {
  return {
    generate: async () => createCommerceTestingBlueprintV1(mode),
  }
}
