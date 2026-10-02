import { notFound } from "next/navigation";
import { buildNovaMarketNewStorePreviewInputV1 } from "@/lib/orvenix-ai/assisted-generation/e2e/comparison-harness";
import { commerceCategoryKeyV1, normalizeCommercePresentationProductsV1 } from "@/lib/orvenix-ai/commerce/product-facts";
import { MOTIF_ARCHETYPES_V2 } from "@/lib/orvenix-ai/design-reference/motifs/archetypes";
import { describeMotifRelationV2, retrieveReferenceMotifsV2, type MotifRetrievalContextV2, type ReferenceMotifRegionV2 } from "@/lib/orvenix-ai/design-reference/motifs";
import { deriveFullSiteMotifContextV1 } from "@/lib/orvenix-ai/full-site-generation/request-context";

/**
 * CF-4B: DEV-ONLY motif retrieval review (excluded from production builds by
 * `.dev.tsx`; 404 under NODE_ENV=production). Shows which relational motifs
 * each business context receives and WHY -- not a generated website, no
 * provider call, no DB.
 */

export const dynamic = "force-dynamic";

const ROLE_COLORS: Record<string, string> = {
  copy: "#e0e7ff",
  "single-product": "#fde68a",
  "product-group": "#fcd34d",
  "category-group": "#bbf7d0",
  "grounded-media": "#fbcfe8",
  cta: "#c7d2fe",
};

function Region({ region }: { region: ReferenceMotifRegionV2 }) {
  return (
    <div style={{ gridColumn: `span ${region.span}`, background: ROLE_COLORS[region.role] ?? "#eee", border: region.focal ? "2px solid #111" : "1px solid #999", borderRadius: 4, padding: 4, fontSize: 11, minHeight: 18 + region.weight * 8 }}>
      {region.role} {region.span}/12 w{region.weight}
      {region.focal ? " ★focal" : ""}
      {region.arrangement ? ` ${region.arrangement}` : ""}
      {region.align && region.align !== "start" ? ` @${region.align}` : ""}
      {region.pinned ? " pinned" : ""}
      {region.withCta ? " +cta" : ""}
      {region.regions ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 3, marginTop: 4 }}>
          {region.regions.map((child, index) => <Region key={index} region={child} />)}
        </div>
      ) : null}
    </div>
  );
}

function ContextBlock({ title, context }: { title: string; context: MotifRetrievalContextV2 }) {
  const result = retrieveReferenceMotifsV2(context);
  return (
    <section style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
      <pre style={{ fontSize: 11, background: "#f8fafc", padding: 8, whiteSpace: "pre-wrap" }}>{JSON.stringify(context)}</pre>
      <p style={{ fontSize: 12 }}>eligible {result.eligibleCount} / selected {result.selections.length}</p>
      {result.selections.map((selection, index) => {
        const relation = describeMotifRelationV2(selection.motif);
        return (
          <div key={selection.motif.motifId} style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontFamily: "monospace" }}>
              {String.fromCharCode(65 + index)} · {selection.motif.motifId} · {selection.motif.family} · {selection.motif.sectionRole} · beat {selection.motif.beat} · d{selection.motif.density} w{selection.motif.whitespace} · {selection.motif.edge}
              {selection.motif.continuityToNext ? ` · →${selection.motif.continuityToNext}` : ""} · rel {selection.relevance} · shape {selection.shapeSignature.slice(0, 12)}
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              focal {relation.focal} · spans {relation.spans} · {relation.asymmetry} · {relation.weightContrast} · copy {relation.copyPlacement} — {selection.rationale.join("; ")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4, marginTop: 4, maxWidth: 720, padding: selection.motif.whitespace * 4, background: selection.motif.edge === "bleed" ? "#f1f5f9" : "transparent" }}>
              {selection.motif.regions.map((region, regionIndex) => <Region key={regionIndex} region={region} />)}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default function DevMotifReviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const products = normalizeCommercePresentationProductsV1(buildNovaMarketNewStorePreviewInputV1().business.products) ?? [];
  const categoryCount = new Set(products.map((product) => (product.category ? commerceCategoryKeyV1(product.category) : "")).filter(Boolean)).size;
  const novaMarket = deriveFullSiteMotifContextV1({ products, categoryCount });
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#111" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>CF-4B Relational motif retrieval</h1>
      <p style={{ fontSize: 13 }}>Same library, different business facts → different relational starting points. ★ = region that would carry the anchor. No provider call.</p>
      <ContextBlock title="NovaMarket (the CF-3B request facts)" context={novaMarket} />
      {Object.values(MOTIF_ARCHETYPES_V2).map((archetype) => <ContextBlock key={archetype.label} title={archetype.label} context={archetype.context} />)}
    </main>
  );
}
