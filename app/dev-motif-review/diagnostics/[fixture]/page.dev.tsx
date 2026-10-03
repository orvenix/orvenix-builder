import { notFound } from "next/navigation";
import { graphShapeSignatureV1 } from "@/lib/orvenix-ai/composer/graph/shape";
import { motifShapeSignatureV2 } from "@/lib/orvenix-ai/design-reference/motifs";
import { CF4D_OFFLINE_FIXTURES, runWithSimulatedArchitectV1, structuralProfileV1 } from "../../cf4d-fixtures";
import { REVIEW_SITES_V1, isReviewSiteKeyV1, loadReviewSiteV1 } from "../../review-sites";

/**
 * CF-4D.1 review UX (DEV ONLY): technical diagnostics for ONE fixture, kept
 * OFF the visual site. OFFLINE CONTRACT PROOF -- NOT MODEL OUTPUT.
 */

export const dynamic = "force-dynamic";

type Region = { role: string; span: number; weight: number; anchor?: unknown; align?: string; arrangement?: string; regions?: Region[] };
const ROLE_COLORS: Record<string, string> = { copy: "#e0e7ff", "single-product": "#fde68a", "product-group": "#fcd34d", "category-group": "#bbf7d0", "grounded-media": "#fbcfe8", cta: "#c7d2fe" };

function Sketch({ regions }: { regions: Region[] }) {
  // Same packing + trailing "end" void rule as the graph compiler.
  const rows: Region[][] = [];
  let row: Region[] = [];
  let sum = 0;
  for (const region of regions) {
    if (row.length && sum + region.span > 12) { rows.push(row); row = []; sum = 0; }
    row.push(region);
    sum += region.span;
  }
  if (row.length) rows.push(row);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 640 }}>
      {rows.map((cells, index) => {
        const used = cells.reduce((total, cell) => total + cell.span, 0);
        const trailing = used < 12 && cells.length > 1 && cells[cells.length - 1].align === "end" && cells[0].align !== "end" && cells[0].align !== "center";
        return (
          <div key={index} style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 3 }}>
            {cells.map((cell, cellIndex) => (
              <div key={cellIndex} style={{ gridColumn: trailing && cellIndex === cells.length - 1 ? `${13 - cell.span} / span ${cell.span}` : `span ${cell.span}`, background: ROLE_COLORS[cell.role] ?? "#eee", border: cell.anchor ? "2px solid #111" : "1px solid #94a3b8", borderRadius: 3, padding: 3, fontSize: 10 }}>
                {cell.role} {cell.span}/12 w{cell.weight}{cell.anchor ? " ★" : ""}{cell.arrangement ? ` ${cell.arrangement}` : ""}
                {cell.regions ? <Sketch regions={cell.regions} /> : null}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const pre = (value: unknown) => <pre style={{ fontSize: 11, background: "#f8fafc", padding: 8, whiteSpace: "pre-wrap", overflowX: "auto" }}>{JSON.stringify(value, null, 1)}</pre>;

export default async function DevMotifReviewDiagnosticsPage({ params }: { params: Promise<{ fixture: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { fixture } = await params;
  if (!isReviewSiteKeyV1(fixture)) notFound();
  const site = await loadReviewSiteV1(fixture);
  const run = site.run;
  const before = fixture === "a" || fixture === "b" || fixture === "c" ? await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[fixture.toUpperCase() as "A" | "B" | "C"].input(), undefined, "cloning") : undefined;
  const supplied = new Set((run?.context.designMotifs ?? []).map((motif) => motifShapeSignatureV2({ ...motif, sectionRole: motif.role })));
  const providerPages = (run?.providerOutput.pages as Array<{ purpose: string; target?: { key?: string }; sections: Array<{ composition?: { beat: string; density: number; whitespace: number; edge: string; regions: Region[] } }> }>) ?? [];
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#0f172a" }}>
      <p style={{ fontSize: 13 }}><a href="/dev-motif-review" style={{ color: "#1d4ed8" }}>← Volver a revisión</a> · <a href={`/dev-motif-review/site/${fixture}/${encodeURIComponent((site.pages.find((page) => page.isHome) ?? site.pages[0]).slug)}`} style={{ color: "#1d4ed8" }}>Ver sitio</a></p>
      <h1 style={{ fontSize: 20, fontWeight: 800 }}>Diagnóstico — {REVIEW_SITES_V1[fixture].label}</h1>
      <p style={{ fontSize: 12, color: "#7c2d12", fontWeight: 600 }}>OFFLINE CONTRACT PROOF — NOT MODEL OUTPUT</p>
      {pre(site.summary)}
      {before ? (
        <details open>
          <summary style={{ fontWeight: 700, cursor: "pointer" }}>CF-4D.1 antes (arquitecto clonador) vs después (sintetizador)</summary>
          {pre({ before: { effectiveGraphs: before.evidence.uptake.effectiveGraphs, ignoredByValidator: before.evidence.uptake.ignoredByValidator, uniqueSkeletons: before.evidence.novelty.metrics.uniqueSkeletons, noveltyWarnings: before.evidence.novelty.warnings, profile: structuralProfileV1(before) }, after: { effectiveGraphs: run?.evidence.uptake.effectiveGraphs, ignoredByValidator: run?.evidence.uptake.ignoredByValidator, uniqueSkeletons: run?.evidence.novelty.metrics.uniqueSkeletons, noveltyWarnings: run?.evidence.novelty.warnings, profile: run ? structuralProfileV1(run) : null } })}
        </details>
      ) : null}
      <details>
        <summary style={{ fontWeight: 700, cursor: "pointer" }}>Métricas completas (uptake, copy, grounding, novedad, arcos)</summary>
        {pre(site.diagnostics)}
      </details>
      {providerPages.length ? (
        <details>
          <summary style={{ fontWeight: 700, cursor: "pointer" }}>Estructura por página (grafos autorados, boceto 12 columnas)</summary>
          {providerPages.map((page, pageIndex) => (
            <section key={pageIndex} style={{ marginTop: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700 }}>{page.purpose}{page.target?.key ? `: ${page.target.key}` : ""}</h3>
              {page.sections.flatMap((section) => (section.composition ? [section.composition] : [])).map((graph, graphIndex) => (
                <div key={graphIndex} style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11, fontFamily: "monospace" }}>{graph.beat} · d{graph.density} w{graph.whitespace} · {graph.edge} · {supplied.has(graphShapeSignatureV1(graph)) ? "clon de motivo" : "sintetizado"}</div>
                  <Sketch regions={graph.regions} />
                </div>
              ))}
            </section>
          ))}
        </details>
      ) : null}
    </main>
  );
}
