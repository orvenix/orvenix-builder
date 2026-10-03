import { notFound } from "next/navigation";
import { buildNovaMarketNewStorePreviewInputV1 } from "@/lib/orvenix-ai/assisted-generation/e2e/comparison-harness";
import { commerceCategoryKeyV1, normalizeCommercePresentationProductsV1 } from "@/lib/orvenix-ai/commerce/product-facts";
import { MOTIF_ARCHETYPES_V2 } from "@/lib/orvenix-ai/design-reference/motifs/archetypes";
import { describeMotifRelationV2, retrieveReferenceMotifsV2, type MotifRetrievalContextV2, type ReferenceMotifRegionV2 } from "@/lib/orvenix-ai/design-reference/motifs";
import { deriveFullSiteMotifContextV1 } from "@/lib/orvenix-ai/full-site-generation/request-context";
import { buildCf4cMemoryReviewV1 } from "../memory-fixtures";
import { analyzeCall3BaselineV1, CF4D_OFFLINE_FIXTURES, novaMarketMemoryEffectV1, runWithSimulatedArchitectV1, structuralProfileV1, type Cf4dOfflineFixtureKey } from "../cf4d-fixtures";
import { compareFullSiteCreativeEvidenceV1 } from "@/lib/orvenix-ai/full-site-generation/creative-evidence";
import { CF4D_EXPERIMENT_CONFIG_V1 } from "@/lib/orvenix-ai/assisted-generation/e2e/cf4d-experiment";

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

async function MemoryBlock() {
  const review = await buildCf4cMemoryReviewV1();
  const ids = (result: typeof review.withMemory) => result.selections.map((selection) => selection.motif.motifId);
  return (
    <section style={{ border: "2px solid #0f172a", borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>CF-4C composition memory (NovaMarket, offline synthetic owner history)</h2>
      <p style={{ fontSize: 12 }}>History: the owner published + accepted a site whose home graph used motif A&apos;s shape. A third record belongs to another user and must be ignored.</p>
      <pre style={{ fontSize: 11, background: "#f8fafc", padding: 8, whiteSpace: "pre-wrap" }}>{JSON.stringify({
        provenance: review.provenance,
        recentShapes: review.memory.recentShapeSignatures.map((shape) => shape.slice(0, 12)),
        recentArcs: review.memory.recentPageArcSignatures.map((arc) => arc.slice(0, 12)),
        recentSkeletons: review.memory.recentPageSkeletonSignatures.map((skeleton) => skeleton.slice(0, 12)),
        withoutMemory: ids(review.withoutMemory),
        withMemory: ids(review.withMemory),
        downweighted: review.withMemory.downweightedIds,
        crossGenerationForThatHistorySite: review.crossGeneration,
        call3ReplayWithinSiteNovelty: review.call3Novelty,
      }, null, 1)}</pre>
      <ContextBlock title="NovaMarket WITH memory (soft ×0.5 on recently used shapes)" context={{ ...review.context, avoidShapeSignatures: review.memory.recentShapeSignatures }} />
    </section>
  );
}

type DiagramRegion = { role: string; span: number; weight: number; anchor?: unknown; focal?: boolean; align?: string; arrangement?: string; regions?: DiagramRegion[] };

function GraphDiagram({ regions }: { regions: DiagramRegion[] }) {
  // Mirrors the compiler's row packing + trailing "end" void so the sketch matches the compiled geometry.
  const rows: DiagramRegion[][] = [];
  let current: DiagramRegion[] = [];
  let sum = 0;
  for (const region of regions) {
    if (current.length && sum + region.span > 12) { rows.push(current); current = []; sum = 0; }
    current.push(region);
    sum += region.span;
  }
  if (current.length) rows.push(current);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 720 }}>
      {rows.map((row, rowIndex) => {
        const used = row.reduce((total, region) => total + region.span, 0);
        const trailing = used < 12 && row.length > 1 && row[row.length - 1].align === "end" && row[0].align !== "end" && row[0].align !== "center";
        return (
          <div key={rowIndex} style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
            {row.map((region, index) => (
              <div key={index} style={{ gridColumn: trailing && index === row.length - 1 ? `${13 - region.span} / span ${region.span}` : `span ${region.span}`, background: ROLE_COLORS[region.role] ?? "#eee", border: region.anchor || region.focal ? "2px solid #111" : "1px solid #999", borderRadius: 4, padding: 4, fontSize: 11, minHeight: 18 + region.weight * 8 }}>
                {region.role} {region.span}/12 w{region.weight}{region.anchor || region.focal ? " ★" : ""}{region.arrangement ? ` ${region.arrangement}` : ""}{region.align && region.align !== "start" ? ` @${region.align}` : ""}
                {region.regions ? <GraphDiagram regions={region.regions} /> : null}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

async function Cf4d1Block() {
  const { motifShapeSignatureV2 } = await import("@/lib/orvenix-ai/design-reference/motifs");
  const { graphShapeSignatureV1 } = await import("@/lib/orvenix-ai/composer/graph/shape");
  const keys = Object.keys(CF4D_OFFLINE_FIXTURES) as Cf4dOfflineFixtureKey[];
  const runs = await Promise.all(keys.map(async (key) => ({ key, before: await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key].input(), undefined, "cloning"), after: await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key].input()) })));
  const summary = (result: Awaited<ReturnType<typeof runWithSimulatedArchitectV1>>) => {
    const supplied = new Set((result.context.designMotifs ?? []).map((motif) => motifShapeSignatureV2({ ...motif, sectionRole: motif.role })));
    const graphs = ((result.providerOutput.pages as Array<{ sections: Array<{ composition?: Record<string, unknown> }> }>) ?? []).flatMap((page) => page.sections.flatMap((section) => (section.composition ? [section.composition] : [])));
    const shapes = graphs.map((graph) => graphShapeSignatureV1(graph));
    return { authored: result.evidence.uptake.providerAuthoredGraphs, effective: result.evidence.uptake.effectiveGraphs, ignored: result.evidence.uptake.ignoredByValidator, uniqueShapes: new Set(shapes).size, exactMotifClones: shapes.filter((shape) => supplied.has(shape)).length, uniqueSkeletons: result.evidence.novelty.metrics.uniqueSkeletons, noveltyWarnings: result.evidence.novelty.warnings.length, profile: structuralProfileV1(result) };
  };
  return (
    <section style={{ border: "2px solid #4c1d95", borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>CF-4D.1 — CREATIVE RANGE PROOF</h2>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#7c2d12" }}>OFFLINE CONTRACT PROOF — NOT MODEL OUTPUT. BEFORE = CF-4D cloning architect; AFTER = synthesizing architect (relation from one supplied motif + rhythm from another). Compiler primitives added: beat/edge surfaces, rest/close measure, void between regions; site graph budget 16 → 32.</p>
      {runs.map(({ key, before, after }) => {
        const supplied = after.context.designMotifs ?? [];
        const suppliedShapes = new Set(supplied.map((motif) => motifShapeSignatureV2({ ...motif, sectionRole: motif.role })));
        const pages = (after.providerOutput.pages as Array<{ purpose: string; target?: { key?: string }; sections: Array<{ composition?: { beat: string; density: number; whitespace: number; edge: string; regions: DiagramRegion[] } }> }>).slice(0, 4);
        const compiledRoots = after.run.plan.pages.slice(0, 4).map((page) => page.tree.nodes[page.tree.rootId].children.map((id) => page.tree.nodes[id]).filter((node) => node.props.compositionGraph));
        return (
          <div key={key} style={{ borderTop: "1px solid #ddd", marginTop: 12, paddingTop: 8 }}>
            <strong style={{ fontSize: 14 }}>{CF4D_OFFLINE_FIXTURES[key].label}</strong>
            <pre style={{ fontSize: 11, background: "#f8fafc", padding: 8, whiteSpace: "pre-wrap" }}>{JSON.stringify({ before: summary(before), after: summary(after) }, null, 1)}</pre>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Supplied motif relations</div>
            {supplied.map((motif) => (
              <div key={motif.label} style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, fontFamily: "monospace" }}>{motif.label} · {motif.role} · {motif.beat} · d{motif.density} w{motif.whitespace} · {motif.edge}</div>
                <GraphDiagram regions={motif.regions} />
              </div>
            ))}
            {pages.map((page, pageIndex) => (
              <div key={pageIndex} style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{page.purpose}{page.target?.key ? `:${page.target.key}` : ""} → synthesized graphs → compiled</div>
                {page.sections.flatMap((section) => (section.composition ? [section.composition] : [])).map((graph, graphIndex) => {
                  const compiled = compiledRoots[pageIndex]?.[graphIndex];
                  const shape = graphShapeSignatureV1(graph);
                  return (
                    <div key={graphIndex} style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontFamily: "monospace" }}>
                        {graph.beat} · d{graph.density} w{graph.whitespace} · {graph.edge} · {suppliedShapes.has(shape) ? "CLONE of a supplied motif" : "synthesized"} · compiled maxWidth {String(compiled?.props.maxWidth)} · surface {String(compiled?.props.background)}
                      </div>
                      <GraphDiagram regions={graph.regions} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}

async function Cf4dBlock() {
  const call3 = await analyzeCall3BaselineV1();
  const fixtures = await Promise.all((Object.keys(CF4D_OFFLINE_FIXTURES) as Cf4dOfflineFixtureKey[]).map(async (key) => ({ key, label: CF4D_OFFLINE_FIXTURES[key].label, result: await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key].input()) })));
  const memory = await novaMarketMemoryEffectV1();
  const motifLine = (motifs: Array<{ label: string; beat: string; regions: Array<{ role: string; span: number }> }> = []) => motifs.map((motif) => `${motif.label}:${motif.beat}/${motif.regions.map((region) => `${region.role}${region.span}`).join("+")}`);
  const pre = (value: unknown) => <pre style={{ fontSize: 11, background: "#f8fafc", padding: 8, whiteSpace: "pre-wrap" }}>{JSON.stringify(value, null, 1)}</pre>;
  return (
    <section style={{ border: "2px solid #7c2d12", borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>CF-4D — OFFLINE CONTRACT PROOF (simulated architect, NOT model output)</h2>
      <h3 style={{ fontWeight: 700, marginTop: 8 }}>Production wiring status</h3>
      {pre({
        fullSiteProviderInProduction: "not configured (app/actions/ai.ts passes no commerceArchitecture.provider) -> full-site branch never runs -> composition memory never read",
        memoryLoader: "app/actions/ai.ts binds readRecentCompositionMemoryV1 to session.user.id; builder invokes it ONLY inside the full-site branch",
        futureCall4: CF4D_EXPERIMENT_CONFIG_V1,
      })}
      <h3 style={{ fontWeight: 700, marginTop: 8 }}>Historical call #3 (frozen real output) — recomputed</h3>
      {pre({ compiledPages: call3.compiledPages, compiledRoots: call3.evidence.compiledSectionRoots, uptake: call3.evidence.uptake, copy: call3.evidence.copy, grounding: call3.evidence.grounding, novelty: call3.evidence.novelty, arcs: call3.evidence.arcDistribution })}
      <h3 style={{ fontWeight: 700, marginTop: 8 }}>A / B / C structural comparison (OFFLINE)</h3>
      {fixtures.map((fixture) => (
        <div key={fixture.key}>
          <strong style={{ fontSize: 13 }}>{fixture.label}</strong>
          {pre({ motifs: motifLine(fixture.result.context.designMotifs), uptake: fixture.result.evidence.uptake, noveltyWarnings: fixture.result.evidence.novelty.warnings, profile: structuralProfileV1(fixture.result) })}
        </div>
      ))}
      <h3 style={{ fontWeight: 700, marginTop: 8 }}>NovaMarket — same facts, with vs without owner memory (OFFLINE)</h3>
      {pre({
        motifsWithoutMemory: motifLine(memory.withoutMemory.context.designMotifs),
        motifsWithMemory: motifLine(memory.withMemory.context.designMotifs),
        profileWithoutMemory: structuralProfileV1(memory.withoutMemory),
        profileWithMemory: structuralProfileV1(memory.withMemory),
        crossGenerationWithMemory: memory.withMemory.run.fullSiteCreative.novelty?.crossGeneration,
      })}
      <h3 style={{ fontWeight: 700, marginTop: 8 }}>Comparison contract (call #3 vs NovaMarket offline proof)</h3>
      {pre(compareFullSiteCreativeEvidenceV1(call3.evidence, memory.withoutMemory.evidence))}
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
      <p style={{ fontSize: 13 }}><a href="/dev-motif-review" style={{ color: "#1d4ed8" }}>← Volver a revisión</a></p>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>CF-4B Relational motif retrieval</h1>
      <p style={{ fontSize: 13 }}>Same library, different business facts → different relational starting points. ★ = region that would carry the anchor. No provider call.</p>
      <ContextBlock title="NovaMarket (the CF-3B request facts)" context={novaMarket} />
      <MemoryBlock />
      <Cf4dBlock />
      <Cf4d1Block />
      {Object.values(MOTIF_ARCHETYPES_V2).map((archetype) => <ContextBlock key={archetype.label} title={archetype.label} context={archetype.context} />)}
    </main>
  );
}
