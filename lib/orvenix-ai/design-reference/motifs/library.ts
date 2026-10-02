import { createHash } from "crypto"
import { motifShapeSignatureV2, REFERENCE_MOTIF_V2_VERSION, type ReferenceMotifRegionV2, type ReferenceMotifV2 } from "./contract"

/**
 * CF-4B: the curated, ORVENIX-AUTHORED relational motif library (no
 * source site, no mined JSX). Each entry is one reusable RELATIONSHIP in
 * the CF-2 graph vocabulary; tags only condition retrieval. Kept small on
 * purpose: every motif must add a distinct relation (see the library
 * diversity test). Intentional shape twins: none.
 */

type MotifDraft = Omit<ReferenceMotifV2, "version" | "motifId">

const r = (role: ReferenceMotifRegionV2["role"], span: number, weight: number, extra: Omit<ReferenceMotifRegionV2, "role" | "span" | "weight"> = {}): ReferenceMotifRegionV2 => ({ role, span, weight, ...extra })

const COMMERCE_PAGES = ["home", "catalog", "category"] as const

const DRAFTS: MotifDraft[] = [
  // ─── SPARSE / FOCAL ──────────────────────────────────────────────────────────
  { family: "sparse-focal", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium"], purposes: ["home"] }, beat: "open", sectionRole: "products", density: 0, whitespace: 3, edge: "contained",
    regions: [r("single-product", 8, 5, { focal: true, align: "center" })] },
  { family: "sparse-focal", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: ["home", "category"] }, beat: "open", sectionRole: "products", density: 0, whitespace: 3, edge: "bleed", continuityToNext: "contrast",
    regions: [r("single-product", 7, 5, { focal: true }), r("copy", 5, 3, { withCta: true })] },
  { family: "sparse-focal", tags: { modes: ["service", "editorial"], scales: ["none", "small"], purposes: ["home", "about", "services"] }, beat: "open", sectionRole: "content", density: 0, whitespace: 3, edge: "contained",
    regions: [r("copy", 8, 4, { align: "center" })] },
  { family: "sparse-focal", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: ["home", "category"], requiresMedia: true }, beat: "peak", sectionRole: "products", density: 1, whitespace: 2, edge: "bleed",
    regions: [r("grounded-media", 8, 5), r("copy", 4, 3)] },
  { family: "sparse-focal", tags: { modes: ["commerce", "editorial", "service"], scales: ["none", "small", "medium", "large"], purposes: ["home", "about", "services", "category"] }, beat: "rest", sectionRole: "content", density: 0, whitespace: 3, edge: "contained",
    regions: [r("copy", 5, 2, { align: "end" })] },

  // ─── EDITORIAL / ASYMMETRIC ─────────────────────────────────────────────────
  { family: "editorial", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: [...COMMERCE_PAGES] }, beat: "build", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 5, 3), r("product-group", 7, 3, { arrangement: "grid" })] },
  { family: "editorial", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: [...COMMERCE_PAGES] }, beat: "build", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("product-group", 7, 4, { arrangement: "grid", focal: true }), r("copy", 5, 2)] },
  { family: "editorial", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: ["home", "category"] }, beat: "peak", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("single-product", 7, 5, { focal: true }), r("product-group", 5, 2, { arrangement: "stack" })] },
  { family: "editorial", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium"], purposes: ["home", "category"] }, beat: "build", sectionRole: "products", density: 1, whitespace: 3, edge: "contained",
    regions: [r("copy", 12, 3), r("product-group", 12, 3, { regions: [r("single-product", 8, 3), r("single-product", 8, 3, { align: "end" }), r("single-product", 8, 3)] })] },
  { family: "editorial", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: ["home", "category"] }, beat: "build", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 4, 3, { pinned: true }), r("product-group", 8, 3, { regions: [r("single-product", 12, 3), r("single-product", 12, 3)] })] },

  // ─── COMMERCE ────────────────────────────────────────────────────────────────
  { family: "commerce", tags: { modes: ["commerce"], scales: ["small", "medium", "large"], purposes: [...COMMERCE_PAGES] }, beat: "peak", sectionRole: "products", density: 2, whitespace: 1, edge: "contained",
    regions: [r("single-product", 6, 5, { focal: true }), r("product-group", 6, 2, { arrangement: "grid", density: 2 })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["medium", "large"], purposes: ["home", "catalog"], requiresCategories: true }, beat: "open", sectionRole: "content", density: 1, whitespace: 2, edge: "contained", continuityToNext: "continue",
    regions: [r("category-group", 12, 3, { arrangement: "grid", focal: true })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["medium", "large"], purposes: ["catalog", "category"] }, beat: "build", sectionRole: "products", density: 3, whitespace: 0, edge: "contained",
    regions: [r("product-group", 12, 2, { arrangement: "grid", density: 3 }), r("single-product", 6, 4, { focal: true, align: "center" })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["medium", "large"], purposes: ["home", "category"] }, beat: "build", sectionRole: "products", density: 2, whitespace: 1, edge: "contained", continuityToNext: "bridge",
    regions: [r("copy", 4, 3), r("product-group", 8, 3, { arrangement: "rail" })] },
  { family: "commerce", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: ["home", "category"] }, beat: "build", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 5, 4), r("single-product", 7, 4, { focal: true }), r("product-group", 12, 2, { arrangement: "grid" })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["medium", "large"], purposes: ["home", "catalog", "category"], requiresCategories: true }, beat: "build", sectionRole: "content", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 4, 3), r("category-group", 8, 3, { arrangement: "grid", focal: true })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["large", "medium"], purposes: ["catalog", "category"] }, beat: "build", sectionRole: "products", density: 3, whitespace: 0, edge: "contained",
    regions: [r("copy", 8, 2), r("cta", 4, 2, { align: "end" }), r("product-group", 12, 2, { arrangement: "grid", density: 3 })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["small", "medium", "large"], purposes: ["product_detail", "category"] }, beat: "rest", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 4, 2), r("product-group", 8, 2, { arrangement: "stack" })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["medium", "large"], purposes: ["home", "catalog"] }, beat: "build", sectionRole: "products", density: 2, whitespace: 1, edge: "bleed",
    regions: [r("product-group", 12, 3, { arrangement: "rail", focal: true })] },
  { family: "commerce", tags: { modes: ["commerce"], scales: ["small"], purposes: ["home", "catalog"] }, beat: "build", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("single-product", 6, 3), r("single-product", 6, 3)] },

  // ─── CONTENT / SERVICE ───────────────────────────────────────────────────────
  { family: "content", tags: { modes: ["commerce", "editorial", "service"], scales: ["small", "medium", "large"], purposes: ["home", "about", "catalog"], requiresCategories: true }, beat: "build", sectionRole: "content", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 5, 3), r("category-group", 7, 3, { arrangement: "grid" })] },
  { family: "content", tags: { modes: ["commerce", "editorial"], scales: ["small", "medium", "large"], purposes: ["home", "about"], requiresMedia: true }, beat: "build", sectionRole: "products", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 5, 3), r("grounded-media", 7, 4)] },
  { family: "content", tags: { modes: ["service", "editorial", "commerce"], scales: ["none", "small", "medium", "large"], purposes: ["help", "about", "contact", "services"] }, beat: "rest", sectionRole: "content", density: 0, whitespace: 3, edge: "contained",
    regions: [r("copy", 6, 2, { align: "center" })] },
  { family: "content", tags: { modes: ["service", "editorial", "commerce"], scales: ["none", "small", "medium", "large"], purposes: ["home", "services", "about", "contact", "help", "catalog", "category"] }, beat: "close", sectionRole: "content", density: 0, whitespace: 3, edge: "contained",
    regions: [r("copy", 8, 4, { align: "center", withCta: true })] },
  { family: "content", tags: { modes: ["service", "editorial", "commerce"], scales: ["none", "small", "medium", "large"], purposes: ["home", "services", "contact"] }, beat: "open", sectionRole: "content", density: 1, whitespace: 2, edge: "contained",
    regions: [r("copy", 7, 4), r("cta", 5, 3, { align: "end" })] },
]

function buildMotif(draft: MotifDraft): ReferenceMotifV2 {
  const shape = motifShapeSignatureV2(draft)
  const motifId = `m-${createHash("sha256").update(`${shape}|${JSON.stringify(draft.tags)}`).digest("hex").slice(0, 10)}`
  return { version: REFERENCE_MOTIF_V2_VERSION, motifId, ...draft }
}

let library: ReferenceMotifV2[] | null = null

export function getReferenceMotifLibraryV2(): ReferenceMotifV2[] {
  library ??= DRAFTS.map(buildMotif)
  return library
}
