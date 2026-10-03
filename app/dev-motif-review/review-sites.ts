import { rewriteTreeForAssistedViewerV1 } from "@/lib/orvenix-ai/assisted-generation/e2e/viewer-links";
import { planCompositionSignaturesV1 } from "@/lib/orvenix-ai/design-memory/composition-memory";
import { graphShapeSignatureV1 } from "@/lib/orvenix-ai/composer/graph/shape";
import { motifShapeSignatureV2 } from "@/lib/orvenix-ai/design-reference/motifs";
import type { EditorTree } from "@/types/editor";
import { buildCf2ReviewPages } from "../dev-interaction-review/cf2-fixtures";
import { CF4D_OFFLINE_FIXTURES, novaMarketMemoryEffectV1, runWithSimulatedArchitectV1, structuralProfileV1, type Cf4dOfflineRunV1 } from "./cf4d-fixtures";

/**
 * CF-4D.1 review UX (DEV ONLY): one registry of reviewable fixture SITES.
 * Each entry is built through the existing offline pipeline (real parser ->
 * validator -> adapter -> compiler -> EditorTree), memoized per dev-server
 * process. No provider, no DB, no mutation of any fixture.
 */

export type ReviewSitePageV1 = { slug: string; name: string; isHome: boolean; tree: EditorTree };

export type ReviewSiteV1 = {
  pages: ReviewSitePageV1[];
  summary: { pages: number; graphs: number; uniqueShapes: number; motifClones: number | null; uniqueSkeletons: number };
  diagnostics: Record<string, unknown>;
  /** Offline run (A/B/C, NovaMarket) for diagram views; absent for CF-2 arc. */
  run?: Cf4dOfflineRunV1;
};

export const REVIEW_SITES_V1 = {
  a: { label: "A — Editorial / Premium Small", description: "6 productos, 2 categorías, descripciones ricas, sin imágenes. Arquitecto simulado sintetizando motivos." },
  b: { label: "B — Playful / Image-rich Medium", description: "14 productos con imágenes reales del catálogo (bound rows), 4 categorías." },
  c: { label: "C — Dense / Large Catalog", description: "40 productos, 8 categorías, descripciones breves." },
  "novamarket-no-memory": { label: "NovaMarket — No Memory", description: "Los hechos reales de NovaMarket (24 productos, 6 categorías) sin memoria de composición." },
  "novamarket-memory": { label: "NovaMarket — With Memory", description: "Mismos hechos; memoria del dueño atenúa la forma usada recientemente." },
  "cf2-arc": { label: "CF-2 Arc Regression", description: "Arco open → build → peak → rest → close (fixture determinista CF-2), con la presentación CF-4D.1." },
} as const;

export type ReviewSiteKeyV1 = keyof typeof REVIEW_SITES_V1;

export function isReviewSiteKeyV1(value: string): value is ReviewSiteKeyV1 {
  return Object.prototype.hasOwnProperty.call(REVIEW_SITES_V1, value);
}

export const REVIEW_FRAME_BASE_V1 = "/dev-motif-review/frame";

/** Internal page links resolve INSIDE the dev frame viewer (never /p/ or public routes); unknown targets go inert. */
function relink(tree: EditorTree, key: string, slugs: ReadonlySet<string>): EditorTree {
  const { tree: rewritten } = rewriteTreeForAssistedViewerV1(tree, key, slugs);
  return JSON.parse(JSON.stringify(rewritten).split(`/dev-assisted-generation-e2e/view/${key}/`).join(`${REVIEW_FRAME_BASE_V1}/${key}/`)) as EditorTree;
}

function fromRun(key: ReviewSiteKeyV1, run: Cf4dOfflineRunV1): ReviewSiteV1 {
  const supplied = new Set((run.context.designMotifs ?? []).map((motif) => motifShapeSignatureV2({ ...motif, sectionRole: motif.role })));
  const graphs = ((run.providerOutput.pages as Array<{ sections: Array<{ composition?: Record<string, unknown> }> }>) ?? []).flatMap((page) => page.sections.flatMap((section) => (section.composition ? [section.composition] : [])));
  const shapes = graphs.map((graph) => graphShapeSignatureV1(graph));
  const slugs = new Set(run.run.plan.pages.map((page) => page.slug));
  return {
    pages: run.run.plan.pages.map((page) => ({ slug: page.slug, name: page.name, isHome: page.isHome, tree: relink(page.tree as EditorTree, key, slugs) })),
    summary: { pages: run.run.plan.pages.length, graphs: run.evidence.uptake.effectiveGraphs, uniqueShapes: new Set(shapes).size, motifClones: shapes.filter((shape) => supplied.has(shape)).length, uniqueSkeletons: run.evidence.novelty.metrics.uniqueSkeletons },
    diagnostics: {
      uptake: run.evidence.uptake,
      copy: run.evidence.copy,
      grounding: run.evidence.grounding,
      novelty: run.evidence.novelty,
      arcDistribution: run.evidence.arcDistribution,
      profile: structuralProfileV1(run),
      crossGeneration: run.run.fullSiteCreative.novelty?.crossGeneration ?? null,
      motifs: (run.context.designMotifs ?? []).map((motif) => `${motif.label}:${motif.beat}/${motif.regions.map((region) => `${region.role}${region.span}`).join("+")}`),
    },
    run,
  };
}

const cache = new Map<ReviewSiteKeyV1, Promise<ReviewSiteV1>>();

async function build(key: ReviewSiteKeyV1): Promise<ReviewSiteV1> {
  if (key === "a" || key === "b" || key === "c") return fromRun(key, await runWithSimulatedArchitectV1(CF4D_OFFLINE_FIXTURES[key.toUpperCase() as "A" | "B" | "C"].input()));
  if (key === "novamarket-no-memory" || key === "novamarket-memory") {
    const effect = await novaMarketMemoryEffectV1();
    return fromRun(key, key === "novamarket-memory" ? effect.withMemory : effect.withoutMemory);
  }
  const pages = buildCf2ReviewPages("cf2-arc");
  const slugs = new Set(pages.map((page) => page.slug));
  const signatures = planCompositionSignaturesV1({ pages });
  const shapes = signatures.flatMap((page) => page.shapes);
  return {
    pages: pages.map((page) => ({ slug: page.slug, name: page.name, isHome: page.isHome, tree: relink(page.tree as EditorTree, key, slugs) })),
    summary: { pages: pages.length, graphs: shapes.length, uniqueShapes: new Set(shapes).size, motifClones: null, uniqueSkeletons: new Set(signatures.map((page) => page.skeletonSignature)).size },
    diagnostics: { pages: signatures.map((page) => ({ slug: page.slug, arc: page.arc.join(" > "), tokens: page.tokens })) },
  };
}

export function loadReviewSiteV1(key: ReviewSiteKeyV1): Promise<ReviewSiteV1> {
  if (!cache.has(key)) cache.set(key, build(key));
  return cache.get(key)!;
}
