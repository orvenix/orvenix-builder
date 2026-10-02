import { catalogScaleV2, type MotifRetrievalContextV2 } from "./retrieve"

/**
 * CF-4B (dev/test): four synthetic business contexts built only from facts
 * the request layer already has (offering kind, catalog/category counts,
 * planned purposes, direction, content richness, media). No industry
 * strings drive selection.
 */

const commerce = (count: number, categories: number, extra: Partial<MotifRetrievalContextV2> = {}): MotifRetrievalContextV2 => ({
  mode: "commerce",
  scale: catalogScaleV2(count),
  catalogCount: count,
  catalogCountSource: "builder_facts",
  categoryCount: categories,
  purposes: ["home", "catalog", "category", "product_detail", "help"],
  densityPreference: count > 30 ? "rich" : count <= 8 ? "sparse" : "balanced",
  restrained: false,
  contentRichness: "sparse",
  hasGroundedMedia: false,
  ...extra,
})

export const MOTIF_ARCHETYPES_V2: Record<"A" | "B" | "C" | "D", { label: string; context: MotifRetrievalContextV2 }> = {
  A: {
    label: "A - sparse service business (no catalog, no media, formal)",
    context: { mode: "service", scale: "none", catalogCount: 0, catalogCountSource: "none", categoryCount: 0, purposes: ["home", "services", "about", "contact"], densityPreference: "sparse", restrained: true, contentRichness: "sparse", hasGroundedMedia: false },
  },
  B: {
    label: "B - editorial / portfolio-like (small body of work with images, rich descriptions)",
    context: { mode: "editorial", scale: "small", catalogCount: 6, catalogCountSource: "builder_facts", categoryCount: 2, purposes: ["home", "about", "category", "contact"], densityPreference: "sparse", restrained: false, contentRichness: "rich", hasGroundedMedia: true },
  },
  C: { label: "C - small commerce (6 products, 1 category, no images)", context: commerce(6, 1) },
  D: { label: "D - large catalog commerce (48 products, 8 categories, compact direction)", context: commerce(48, 8, { densityPreference: "rich" }) },
}
