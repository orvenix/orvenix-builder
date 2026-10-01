import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { runAutonomousMultiPageSiteBuilder } from "@/lib/orvenix-ai/autonomous/site-builder";
import { buildNovaMarketNewStorePreviewInputV1, DISABLED_ASSET_PROVIDER_V1 } from "@/lib/orvenix-ai/assisted-generation/e2e/comparison-harness";
import { parseFullSiteProviderResponseV1 } from "@/lib/orvenix-ai/full-site-generation/anthropic-provider";
import type { FullSiteCreativeBlueprintProviderV1 } from "@/lib/orvenix-ai/full-site-generation/contract";
import type { EditorTree } from "@/types/editor";

/**
 * CF-3A provider-shaped OFFLINE fixtures (DEV/TEST ONLY). Each fixture is
 * the raw TEXT a provider would return; it enters through the REAL path:
 *
 *   parseFullSiteProviderResponseV1 (hardened parser)
 *   -> generateFullSiteCreativeBlueprintV1 (orchestrator + blueprint validator)
 *   -> commerce adapter (grounding, claim guard, advisory graph diagnostics)
 *   -> commerce architecture -> CompositionPlan instances
 *   -> blueprint compiler graph hook (strict validation, per-section fallback)
 *   -> EditorTree
 *
 * No provider is called: the "provider" just returns the fixture text.
 * Catalog = the NovaMarket mock (24 products, 6 categories), assets disabled.
 */

const BASE = { version: 1, roleKey: "full_site_creative_blueprint_v1", strategyKey: "bounded_full_site_generation_v1" } as const;
const p = (index: number) => ({ kind: "product", index });
const c = (key: string) => ({ kind: "category", key });

type Json = Record<string, unknown>;

function site(pages: Json[], concept: Json = { narrative: "editorial", rhythm: "varied", density: "balanced" }, navigation: Json = { concept: "editorial", primaryPurposes: ["home", "catalog"], cartProminence: "subtle" }): Json {
  return { ...BASE, siteConcept: concept, navigation, pages };
}

const catalogPage = (composition?: Json): Json => ({
  purpose: "catalog",
  sections: [
    { intent: "opening", role: "hero" },
    { intent: "catalog_surface", role: "products", ...(composition ? { composition } : {}) },
    { intent: "closing", role: "cta" },
  ],
});

// ─── A: valid creative graph site (editorial) ──────────────────────────────────

export function fixtureEditorial(): Json {
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero", layout: { kind: "editorial-passage", rhythm: "spacious" } },
      { intent: "spotlight", role: "products", refs: [p(17)], ctaIntent: "buy",
        copy: { eyebrow: "Sonido para tu día", headline: "Música que va contigo", intro: "Una bocina pensada para acompañarte de la mañana a la noche." },
        composition: { version: 1, role: "products", beat: "open", density: 0, whitespace: 3, edge: "contained", continuityToNext: "contrast", regions: [
          { id: "intro", role: "copy", span: 6, weight: 5, align: "start", withCta: true },
          { id: "pulse", role: "single-product", span: 6, weight: 4, refs: [p(17)], anchor: p(17) },
        ] } },
      { intent: "collection", role: "products", refs: [p(16), p(18), p(19)],
        copy: { headline: "Escucha con intención", intro: "Piezas de audio que se complementan entre sí." },
        composition: { version: 1, role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", continuityToNext: "bridge", narrative: "editorial-story", regions: [
          { id: "story", role: "copy", span: 4, weight: 4, pinned: true },
          { id: "set", role: "product-group", span: 8, weight: 3, arrangement: "grid", refs: [p(16), p(18), p(19)], anchor: p(16) },
        ] } },
      { intent: "navigation_discovery", role: "content", refs: [c("audio"), c("tecnologia"), c("hogar")],
        composition: { version: 1, role: "content", beat: "rest", density: 1, whitespace: 3, edge: "contained", continuityToNext: "contrast", regions: [
          { id: "browse", role: "copy", span: 4, weight: 3 },
          { id: "cats", role: "category-group", span: 8, weight: 3, arrangement: "grid", refs: [c("audio"), c("tecnologia"), c("hogar")] },
        ] } },
      { intent: "featured_collection", role: "products", refs: [p(0), p(4), p(8), p(12)],
        composition: { version: 1, role: "products", beat: "peak", density: 1, whitespace: 2, edge: "bleed", narrative: "product-led", regions: [
          { id: "hero-pick", role: "single-product", span: 8, weight: 5, refs: [p(0)], anchor: p(0) },
          { id: "support", role: "product-group", span: 4, weight: 2, arrangement: "stack", refs: [p(4), p(8), p(12)] },
        ] } },
      { intent: "closing", role: "cta", layout: { kind: "dramatic-closing" } },
    ] },
    catalogPage(),
    ...["audio", "tecnologia", "hogar"].map((key): Json => ({ purpose: "category", target: c(key), sections: [
      { intent: "opening", role: "hero" },
      { intent: "collection", role: "products", refs: [c(key)] },
      { intent: "closing", role: "cta" },
    ] })),
  ]);
}

// ─── B: mixed -- valid / invalid / valid graph ─────────────────────────────────

export function fixtureMixed(): Json {
  const valid = (beat: string, refs: number[], continuity?: string): Json => ({ version: 1, role: "products", beat, density: 1, whitespace: 2, edge: "contained", ...(continuity ? { continuityToNext: continuity } : {}), regions: [
    { id: "lead", role: "single-product", span: 7, weight: 4, refs: [p(refs[0])], anchor: p(refs[0]) },
    { id: "rest", role: "product-group", span: 5, weight: 2, arrangement: "stack", refs: refs.slice(1).map(p) },
  ] });
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero" },
      { intent: "featured_collection", role: "products", refs: [p(0), p(1), p(2)], composition: valid("build", [0, 1, 2], "continue") },
      { intent: "collection", role: "products", refs: [p(4), p(5)], composition: { version: 1, role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", continuityToNext: "contrast", regions: [
        { id: "ghost", role: "single-product", span: 12, weight: 3, refs: [p(999)] },
      ] } },
      { intent: "featured_collection", role: "products", refs: [p(16), p(17), p(18)], composition: valid("build", [16, 17, 18]) },
      { intent: "closing", role: "cta" },
    ] },
    catalogPage(),
  ]);
}

// ─── C: hostile graph content (inside composition) ─────────────────────────────

export function fixtureHostile(): Json {
  const g = (regions: Json[], extra: Json = {}): Json => ({ version: 1, role: "products", beat: "build", density: 1, whitespace: 1, edge: "contained", regions, ...extra });
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero" },
      { intent: "collection", role: "products", refs: [p(0), p(1)], composition: g([{ id: "a", role: "product-group", span: 12, weight: 3, refs: [p(0), p(1)], className: "lg:col-span-7 bg-[red]" }]) },
      { intent: "collection", role: "products", refs: [p(2), p(3)], composition: g([{ id: "b", role: "product-group", span: 12, weight: 3, refs: [p(2), p(3)] }], { css: "body{display:none}" }) },
      { intent: "collection", role: "products", refs: [p(4), p(5)], composition: g([{ id: "c", role: "product-group", span: "8px", weight: 3, refs: [p(4), p(5)] }]) },
      { intent: "collection", role: "products", refs: [p(6), p(7)], composition: g([{ id: "d", role: "product-group", span: 12, weight: 3, regions: [
        { id: "d1", role: "single-product", span: 6, weight: 3, refs: [p(6)], regions: [{ id: "d2", role: "single-product", span: 6, weight: 2, refs: [p(7)] }] },
        { id: "d3", role: "single-product", span: 6, weight: 3, refs: [p(8)] },
      ] }]) },
      { intent: "collection", role: "products", refs: [p(9), p(10)], composition: g([{ id: "e", role: "product-group", span: 12, weight: 3, refs: [p(9), { kind: "category", key: "armas" }, { kind: "product", index: 4000 }] }]) },
      { intent: "closing", role: "cta" },
    ] },
    catalogPage(),
  ]);
}

// ─── D: unsafe creative copy (graph valid; unsafe slots fall back alone) ───────

export const UNSAFE_COPY_HEADLINES = [
  "Envío gratis en todo el país",
  "30% de descuento esta semana",
  "Entrega en 24 horas",
  "Garantía de por vida",
  "5 estrellas según nuestros clientes",
  "Más de 10,000 clientes felices",
  "El número 1 de México",
  "Últimas unidades disponibles",
] as const;

export function fixtureUnsafeCopy(): Json {
  const sections = UNSAFE_COPY_HEADLINES.slice(0, 6).map((headline, index): Json => ({
    intent: "collection", role: "products", refs: [p(index * 2), p(index * 2 + 1)],
    copy: { headline, intro: "Una selección pensada para tu día a día." },
    composition: { version: 1, role: "products", beat: "build", density: 1, whitespace: 1, edge: "contained", regions: [
      { id: "copy", role: "copy", span: 5, weight: 3 },
      { id: "pair", role: "product-group", span: 7, weight: 3, arrangement: "grid", refs: [p(index * 2), p(index * 2 + 1)] },
    ] },
  }));
  return site([
    { purpose: "home", sections: [{ intent: "opening", role: "hero" }, ...sections, { intent: "closing", role: "cta" }] },
    catalogPage(),
  ]);
}

// ─── E: conservative / F: expressive / catalog / premium ───────────────────────

export function fixtureConservative(): Json {
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero" },
      { intent: "featured_collection", role: "products", refs: [p(0), p(1), p(2)],
        composition: { version: 1, role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", continuityToNext: "continue", regions: [
          { id: "title", role: "copy", span: 12, weight: 3 },
          { id: "row", role: "product-group", span: 12, weight: 3, arrangement: "grid", refs: [p(0), p(1), p(2)] },
        ] } },
      { intent: "collection", role: "products", refs: [p(8), p(9), p(10)],
        composition: { version: 1, role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", regions: [
          { id: "title", role: "copy", span: 12, weight: 3 },
          { id: "row", role: "product-group", span: 12, weight: 3, arrangement: "grid", refs: [p(8), p(9), p(10)] },
        ] } },
      { intent: "trust", role: "trust" },
      { intent: "closing", role: "cta" },
    ] },
    catalogPage(),
  ], { narrative: "professional", rhythm: "calm", density: "balanced" }, { concept: "classic", primaryPurposes: ["home", "catalog"], cartProminence: "subtle" });
}

export function fixtureExpressive(): Json {
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero", layout: { kind: "oversized-typography" } },
      { intent: "spotlight", role: "products", refs: [p(20)],
        copy: { headline: "Juega a tu ritmo" },
        composition: { version: 1, role: "products", beat: "open", density: 0, whitespace: 3, edge: "bleed", continuityToNext: "contrast", regions: [
          { id: "hero-pad", role: "single-product", span: 7, weight: 5, refs: [p(20)], anchor: p(20) },
          { id: "voice", role: "copy", span: 5, weight: 5, align: "start", withCta: true },
        ] } },
      { intent: "collection", role: "products", refs: [p(21), p(22), p(23), p(16), p(19)],
        composition: { version: 1, role: "products", beat: "build", density: 2, whitespace: 1, edge: "contained", continuityToNext: "bridge", regions: [
          { id: "rail", role: "product-group", span: 12, weight: 3, arrangement: "rail", refs: [p(21), p(22), p(23), p(16), p(19)], anchor: p(21) },
        ] } },
      { intent: "collection", role: "products", refs: [p(17), p(18), p(12)],
        composition: { version: 1, role: "products", beat: "peak", density: 1, whitespace: 3, edge: "contained", regions: [
          { id: "story", role: "product-group", span: 12, weight: 4, regions: [
            { id: "s1", role: "single-product", span: 8, weight: 4, align: "start", refs: [p(17)], anchor: p(17) },
            { id: "s2", role: "single-product", span: 8, weight: 3, align: "end", refs: [p(18)] },
            { id: "s3", role: "single-product", span: 8, weight: 3, align: "start", refs: [p(12)] },
          ] },
        ] } },
      { intent: "closing", role: "cta", layout: { kind: "dramatic-closing" } },
    ] },
    catalogPage(),
  ], { narrative: "product-led", rhythm: "immersive", density: "rich" }, { concept: "editorial", primaryPurposes: ["home", "catalog"], cartProminence: "prominent" });
}

export function fixtureCatalog(): Json {
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero" },
      { intent: "navigation_discovery", role: "content", refs: [c("tecnologia"), c("hogar"), c("oficina"), c("accesorios"), c("audio"), c("gaming")],
        composition: { version: 1, role: "content", beat: "open", density: 2, whitespace: 1, edge: "contained", continuityToNext: "continue", regions: [
          { id: "cats", role: "category-group", span: 12, weight: 3, arrangement: "grid", refs: [c("tecnologia"), c("hogar"), c("oficina"), c("accesorios"), c("audio"), c("gaming")], anchor: c("tecnologia") },
        ] } },
      { intent: "catalog_surface", role: "products", ctaIntent: "browse",
        copy: { headline: "Todo el catálogo, a la vista" },
        composition: { version: 1, role: "products", beat: "build", density: 3, whitespace: 0, edge: "contained", continuityToNext: "bridge", regions: [
          { id: "head", role: "copy", span: 9, weight: 2 },
          { id: "go", role: "cta", span: 3, weight: 3, align: "end" },
          { id: "grid", role: "product-group", span: 12, weight: 2, density: 3, arrangement: "grid", refs: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(p) },
        ] } },
      { intent: "featured_collection", role: "products", refs: [p(3), p(1), p(2)],
        composition: { version: 1, role: "products", beat: "peak", density: 2, whitespace: 1, edge: "contained", regions: [
          { id: "pick", role: "single-product", span: 6, weight: 5, refs: [p(3)], anchor: p(3) },
          { id: "pair", role: "product-group", span: 6, weight: 2, density: 2, arrangement: "grid", refs: [p(1), p(2)] },
        ] } },
      { intent: "closing", role: "cta" },
    ] },
    catalogPage({ version: 1, role: "products", beat: "build", density: 3, whitespace: 0, edge: "contained", regions: [
      { id: "all", role: "product-group", span: 12, weight: 2, density: 3, arrangement: "grid", refs: Array.from({ length: 24 }, (_, index) => p(index)) },
    ] }),
    ...["tecnologia", "hogar", "oficina", "accesorios", "audio", "gaming"].map((key): Json => ({ purpose: "category", target: c(key), sections: [
      { intent: "opening", role: "hero" },
      { intent: "collection", role: "products", refs: [c(key)] },
    ] })),
  ], { narrative: "catalog", rhythm: "dense", density: "rich" }, { concept: "catalog-forward", primaryPurposes: ["home", "catalog"], cartProminence: "prominent" });
}

export function fixturePremium(): Json {
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero", layout: { kind: "editorial-passage", rhythm: "spacious" } },
      { intent: "spotlight", role: "products", refs: [p(16)],
        copy: { headline: "Silencio, y luego música", intro: "Un solo objeto, con el espacio que merece." },
        composition: { version: 1, role: "products", beat: "open", density: 0, whitespace: 3, edge: "contained", continuityToNext: "continue", regions: [
          { id: "object", role: "single-product", span: 6, weight: 5, align: "center", refs: [p(16)], anchor: p(16) },
        ] } },
      { intent: "editorial_passage", role: "features", refs: [c("audio")] },
      { intent: "spotlight", role: "products", refs: [p(17)],
        composition: { version: 1, role: "products", beat: "rest", density: 0, whitespace: 3, edge: "contained", regions: [
          { id: "note", role: "copy", span: 5, weight: 2, align: "end" },
          { id: "second", role: "single-product", span: 4, weight: 2, refs: [p(17)] },
        ] } },
      { intent: "closing", role: "cta" },
    ] },
    catalogPage(),
  ], { narrative: "editorial", rhythm: "calm", density: "minimal" });
}

/** G: same facts (the same five products), three different creative directions. */
export const DIVERSITY_PRODUCTS = [0, 4, 8, 16, 17] as const;
export function fixtureDiversity(direction: "a" | "b" | "c"): Json {
  const [a, b, cc, d, e] = DIVERSITY_PRODUCTS;
  const graphs: Record<"a" | "b" | "c", Json> = {
    a: { version: 1, role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", regions: [
      { id: "anchor", role: "single-product", span: 8, weight: 5, refs: [p(a)], anchor: p(a) },
      { id: "support", role: "product-group", span: 4, weight: 2, arrangement: "stack", refs: [p(b), p(cc), p(d), p(e)] },
    ] },
    b: { version: 1, role: "products", beat: "build", density: 1, whitespace: 3, edge: "contained", regions: [
      { id: "copy", role: "copy", span: 5, weight: 4, pinned: true },
      { id: "set", role: "product-group", span: 7, weight: 3, arrangement: "grid", refs: [p(d), p(a), p(b), p(cc), p(e)], anchor: p(d) },
    ] },
    c: { version: 1, role: "products", beat: "build", density: 2, whitespace: 1, edge: "bleed", regions: [
      { id: "rail", role: "product-group", span: 12, weight: 3, arrangement: "rail", refs: [p(e), p(d), p(cc), p(b), p(a)], anchor: p(e) },
    ] },
  };
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero" },
      { intent: "featured_collection", role: "products", refs: DIVERSITY_PRODUCTS.map(p), composition: graphs[direction] },
      { intent: "closing", role: "cta" },
    ] },
    catalogPage(),
  ]);
}

/** V1 (historical) provider output: no composition, no copy. */
export function fixtureLegacyV1(): Json {
  return site([
    { purpose: "home", sections: [
      { intent: "opening", role: "hero", layout: { kind: "editorial-passage" } },
      { intent: "featured_collection", role: "products", refs: [p(0), p(1), p(2)], layout: { kind: "card-grid" }, merchandisingComposition: "featured-plus-grid" },
      { intent: "closing", role: "cta" },
    ] },
    catalogPage(),
  ]);
}

// ─── The real integration path ─────────────────────────────────────────────────

/** Provider-shaped raw text (optionally ```json fenced, like real responses). */
export function providerText(blueprint: Json, fenced = false): string {
  const json = JSON.stringify(blueprint);
  return fenced ? `\`\`\`json\n${json}\n\`\`\`` : json;
}

export async function buildFromProviderText(raw: string) {
  const provider: FullSiteCreativeBlueprintProviderV1 = {
    providerKey: "offline-fixture",
    async generate() {
      return parseFullSiteProviderResponseV1(raw);
    },
  };
  return runAutonomousMultiPageSiteBuilder({
    ...buildNovaMarketNewStorePreviewInputV1(),
    assetProvider: DISABLED_ASSET_PROVIDER_V1,
    commerceArchitecture: { provider },
  });
}

// ─── CF-3D: the REAL call #3 provider output, replayed offline ─────────────────

/**
 * The exact parsed output of CF-3B real call #3, frozen as an immutable
 * fixture (sha256-pinned). Replayed through buildFromProviderText -- the same
 * parser -> validator -> adapter -> compiler path -- with NO edits, so the
 * review shows what Orvenix builds from what the provider actually wrote.
 */
export type Cf3bCall3FixtureV1 = {
  kind: "cf3b-call3-provider-output";
  source: Record<string, unknown>;
  historicalLifecycle: { status: string; reasonCode: string; reasons: string[] };
  providerOutputSha256: string;
  providerOutput: Json;
};

export function loadCf3bCall3FixtureV1(): Cf3bCall3FixtureV1 {
  const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/dev-interaction-review/cf3b-call3-provider-output.json"), "utf8")) as Cf3bCall3FixtureV1;
  const digest = createHash("sha256").update(JSON.stringify(fixture.providerOutput)).digest("hex");
  if (digest !== fixture.providerOutputSha256) throw new Error("cf3b call #3 fixture was modified");
  return fixture;
}

export const CF3_REVIEW_VARIANTS = {
  "cf3-conservative": "CF-3 Conservative",
  "cf3-editorial": "CF-3 Editorial",
  "cf3-catalog": "CF-3 Catalog",
  "cf3-premium": "CF-3 Premium",
  "cf3-diversity": "CF-3 Diversity (A/B/C)",
  "cf3b-call3-replay": "CF-3B Call #3 (real, replay)",
} as const;
export type Cf3ReviewVariant = keyof typeof CF3_REVIEW_VARIANTS;

export function isCf3ReviewVariant(value: string): value is Cf3ReviewVariant {
  return Object.prototype.hasOwnProperty.call(CF3_REVIEW_VARIANTS, value);
}

export async function buildCf3ReviewPages(variant: Cf3ReviewVariant): Promise<Array<{ slug: string; name: string; isHome: boolean; tree: EditorTree }>> {
  if (variant === "cf3-diversity") {
    const pages: Array<{ slug: string; name: string; isHome: boolean; tree: EditorTree }> = [];
    for (const direction of ["a", "b", "c"] as const) {
      const run = await buildFromProviderText(providerText(fixtureDiversity(direction)));
      const home = run.plan.pages.find((page) => page.slug === "home")!;
      pages.push({ slug: direction === "a" ? "home" : `direccion-${direction}`, name: `Dirección ${direction.toUpperCase()}`, isHome: direction === "a", tree: home.tree as EditorTree });
    }
    return pages;
  }
  if (variant === "cf3b-call3-replay") {
    const run = await buildFromProviderText(JSON.stringify(loadCf3bCall3FixtureV1().providerOutput));
    return run.plan.pages.map((page) => ({ slug: page.slug, name: page.name, isHome: page.isHome, tree: page.tree as EditorTree }));
  }
  const blueprint = variant === "cf3-conservative" ? fixtureConservative() : variant === "cf3-editorial" ? fixtureEditorial() : variant === "cf3-catalog" ? fixtureCatalog() : fixturePremium();
  const run = await buildFromProviderText(providerText(blueprint, variant === "cf3-editorial"));
  return run.plan.pages.map((page) => ({ slug: page.slug, name: page.name, isHome: page.isHome, tree: page.tree as EditorTree }));
}
