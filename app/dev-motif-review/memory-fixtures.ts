import { buildFromProviderText, fixtureLegacyV1, loadCf3bCall3FixtureV1, providerText } from "../dev-interaction-review/cf3-fixtures";
import { buildNovaMarketNewStorePreviewInputV1 } from "@/lib/orvenix-ai/assisted-generation/e2e/comparison-harness";
import { commerceCategoryKeyV1, normalizeCommercePresentationProductsV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts";
import { retrieveReferenceMotifsV2, type ReferenceMotifV2 } from "@/lib/orvenix-ai/design-reference/motifs";
import { deriveFullSiteMotifContextV1 } from "@/lib/orvenix-ai/full-site-generation/request-context";
import {
  compositionMemoryProvenanceV1,
  deriveCompositionMemoryV1,
  diagnoseCrossGenerationNoveltyV1,
  diagnoseSiteCompositionNoveltyV1,
  type CompositionMemoryRecordV1,
} from "@/lib/orvenix-ai/design-memory/composition-memory";

/**
 * CF-4C (DEV/TEST ONLY): offline composition-memory fixtures. History
 * plans are REAL compiled plans (provider-shaped blueprints through the
 * real pipeline), so their tokens/shapes are exactly what a persisted
 * DesignGeneration.initialPlan would carry. No DB, no provider.
 */

type Json = Record<string, unknown>;

export function novaMarketProductsV1(): CommerceProductFactV1[] {
  return normalizeCommercePresentationProductsV1(buildNovaMarketNewStorePreviewInputV1().business.products) ?? [];
}

export function novaMarketMotifContextV1() {
  const products = novaMarketProductsV1();
  const categoryCount = new Set(products.map((product) => (product.category ? commerceCategoryKeyV1(product.category) : "")).filter(Boolean)).size;
  return deriveFullSiteMotifContextV1({ products, categoryCount });
}

/** A provider-shaped site whose home graph instantiates `motif` with the given products (copy optional). */
export function motifHistoryBlueprintV1(motif: ReferenceMotifV2, productIndexes: number[], copy?: Json): Json {
  const ref = (index: number) => ({ kind: "product", index });
  let cursor = 0;
  const next = (count: number) => {
    const slice = productIndexes.slice(cursor, cursor + count);
    cursor += count;
    return slice;
  };
  const regions = motif.regions.map((region, index) => {
    const refs = region.role === "single-product" ? next(1) : region.role === "product-group" && !region.regions ? next(region.arrangement === "rail" ? 5 : 3) : [];
    return {
      id: `r${index}`,
      role: region.role,
      span: region.span,
      weight: region.weight,
      ...(region.arrangement ? { arrangement: region.arrangement } : {}),
      ...(region.align ? { align: region.align } : {}),
      ...(region.withCta ? { withCta: true } : {}),
      ...(refs.length ? { refs: refs.map(ref) } : {}),
      ...(region.focal && refs.length ? { anchor: ref(refs[0]) } : {}),
    };
  });
  const blueprint = fixtureLegacyV1();
  (blueprint.pages as Array<{ sections: Json[] }>)[0].sections[1] = {
    intent: "featured_collection",
    role: "products",
    refs: productIndexes.slice(0, Math.max(2, cursor)).map(ref),
    ctaIntent: "browse",
    ...(copy ? { copy } : {}),
    composition: { version: 1, role: motif.sectionRole, beat: motif.beat, density: motif.density, whitespace: motif.whitespace, edge: motif.edge, regions },
  };
  return blueprint;
}

export async function compileBlueprintPlanV1(blueprint: Json) {
  return (await buildFromProviderText(providerText(blueprint))).plan;
}

export function memoryRecordV1(userId: string, status: string, initialPlan: unknown, day: number, editMetrics?: unknown): CompositionMemoryRecordV1 {
  return { userId, status, initialPlan, createdAt: new Date(Date.UTC(2026, 9, day)), ...(editMetrics ? { editMetrics } : {}) };
}

/** Dev review: NovaMarket with and without the owner's (synthetic, offline) composition memory. */
export async function buildCf4cMemoryReviewV1() {
  const context = novaMarketMotifContextV1();
  const withoutMemory = retrieveReferenceMotifsV2(context);
  const motifA = withoutMemory.selections[0].motif;
  const history = await compileBlueprintPlanV1(motifHistoryBlueprintV1(motifA, [0, 1, 2, 3, 4]));
  const call3 = (await buildFromProviderText(JSON.stringify(loadCf3bCall3FixtureV1().providerOutput))).plan;
  const memory = deriveCompositionMemoryV1(
    [memoryRecordV1("owner", "published", history, 1), memoryRecordV1("owner", "accepted", history, 2), memoryRecordV1("someone-else", "published", call3, 3)],
    { ownerUserId: "owner" },
  );
  const withMemory = retrieveReferenceMotifsV2({ ...context, avoidShapeSignatures: memory.recentShapeSignatures });
  return {
    context,
    memory,
    provenance: compositionMemoryProvenanceV1(memory),
    withoutMemory,
    withMemory,
    call3Novelty: diagnoseSiteCompositionNoveltyV1(call3),
    crossGeneration: diagnoseCrossGenerationNoveltyV1(history, memory),
  };
}
