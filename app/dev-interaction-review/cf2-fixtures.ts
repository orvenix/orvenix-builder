import { compileSiteBlueprint } from "@/lib/orvenix-ai/compiler/blueprint-compiler";
import type { OrvenixSiteArchitecture, OrvenixSiteSectionPlan } from "@/lib/orvenix-ai/architect/site-architect";
import { bindStoreProductRecordsV1, commerceCategoryKeyV1, type CommerceProductFactV1 } from "@/lib/orvenix-ai/commerce/product-facts";
import { buildNovaMarketMockStoreRecordsV1, NOVAMARKET_MOCK_SITE_ID_V1 } from "@/lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture";
import { CREATIVE_COMPOSITION_GRAPH_VERSION_V1, type GraphRegionV1, type GraphSectionV1 } from "@/lib/orvenix-ai/composer/graph/contract";
import type { EditorTree } from "@/types/editor";

/**
 * CF-2 review fixtures (DEV/TEST ONLY). Deterministic CreativeCompositionGraphV1
 * pages over the NovaMarket mock catalog (authoritative-shaped rows, no DB),
 * compiled through the REAL compileSiteBlueprint (graph hook, cart shell,
 * nav, footer). No provider: the graphs are written here by hand to exercise
 * relationships, not named layouts.
 */

export const CF2_PALETTE = { primary: "#16a34a", secondary: "#166534", background: "#eef9ff", text: "#062f44", accent: "#4ade80" };

export function cf2Products(): CommerceProductFactV1[] {
  return bindStoreProductRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1, buildNovaMarketMockStoreRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1));
}

export function cf2CategoryLinks(products: readonly CommerceProductFactV1[]) {
  const labels = [...new Set(products.map((product) => product.category?.trim()).filter((label): label is string => Boolean(label)))].slice(0, 6);
  return labels.map((label) => ({ label, href: "page:productos" }));
}

const product = (index: number) => ({ kind: "product" as const, index });
const category = (key: string) => ({ kind: "category" as const, key });
const products = (...indexes: number[]) => indexes.map(product);
const CTA = { label: "Ver catálogo" as const, href: "page:productos" };

function graph(fields: Omit<GraphSectionV1, "version">): GraphSectionV1 {
  return { version: CREATIVE_COMPOSITION_GRAPH_VERSION_V1, ...fields };
}

function region(fields: GraphRegionV1): GraphRegionV1 {
  return fields;
}

/** A: editorial commerce -- copy + strong anchor, subordinate support, asymmetry, whitespace, contrast/bridge. */
function editorialGraphs(): GraphSectionV1[] {
  return [
    graph({ role: "products", beat: "open", density: 0, whitespace: 3, edge: "contained", continuityToNext: "contrast", narrative: "editorial-story", regions: [
      region({ id: "intro", role: "copy", span: 7, weight: 5, align: "start", whitespace: 2 }),
      region({ id: "hero-product", role: "single-product", span: 5, weight: 4, refs: [product(17)], anchor: product(17) }),
    ] }),
    graph({ role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", continuityToNext: "bridge", narrative: "editorial-story", regions: [
      region({ id: "story", role: "copy", span: 4, weight: 4, align: "start", pinned: true, withCta: true }),
      region({ id: "collection", role: "product-group", span: 8, weight: 3, density: 1, arrangement: "grid", refs: products(16, 18, 19, 13), anchor: product(16) }),
    ] }),
    graph({ role: "products", beat: "peak", density: 1, whitespace: 2, edge: "bleed", continuityToNext: "contrast", narrative: "product-led", regions: [
      region({ id: "focal", role: "single-product", span: 8, weight: 5, refs: [product(0)], anchor: product(0) }),
      region({ id: "support", role: "product-group", span: 4, weight: 2, arrangement: "stack", refs: products(1, 2, 3) }),
    ] }),
    graph({ role: "products", beat: "close", density: 0, whitespace: 3, edge: "contained", narrative: "minimal-introduction", regions: [
      region({ id: "closing", role: "copy", span: 8, weight: 3, align: "center", withCta: true }),
    ] }),
  ];
}

/** B: dense catalog -- compact high-information region, focal category/product, clear density transition. */
function denseGraphs(categoryKeys: string[]): GraphSectionV1[] {
  return [
    graph({ role: "products", beat: "open", density: 1, whitespace: 1, edge: "contained", continuityToNext: "continue", narrative: "catalog-orientation", regions: [
      region({ id: "title", role: "copy", span: 9, weight: 4, align: "start" }),
      region({ id: "action", role: "cta", span: 3, weight: 3, align: "end" }),
    ] }),
    graph({ role: "content", beat: "build", density: 2, whitespace: 1, edge: "contained", continuityToNext: "bridge", regions: [
      region({ id: "categories-copy", role: "copy", span: 4, weight: 3, align: "start" }),
      region({ id: "categories", role: "category-group", span: 8, weight: 3, arrangement: "grid", refs: categoryKeys.slice(0, 4).map(category), anchor: category(categoryKeys[0]) }),
    ] }),
    graph({ role: "products", beat: "build", density: 3, whitespace: 0, edge: "contained", continuityToNext: "contrast", narrative: "catalog-orientation", regions: [
      region({ id: "grid", role: "product-group", span: 12, weight: 2, density: 3, arrangement: "grid", refs: products(0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14) }),
    ] }),
    graph({ role: "products", beat: "peak", density: 2, whitespace: 1, edge: "contained", narrative: "product-led", regions: [
      region({ id: "pick", role: "single-product", span: 6, weight: 5, refs: [product(8)], anchor: product(8) }),
      region({ id: "nearby", role: "product-group", span: 6, weight: 2, density: 2, arrangement: "grid", refs: products(15, 16, 17, 18) }),
    ] }),
  ];
}

/** C: premium / sparse -- restrained, large whitespace, few focal elements, not every column filled. */
function premiumGraphs(): GraphSectionV1[] {
  return [
    graph({ role: "products", beat: "open", density: 0, whitespace: 3, edge: "contained", continuityToNext: "continue", narrative: "minimal-introduction", regions: [
      region({ id: "statement", role: "copy", span: 6, weight: 5, align: "start", whitespace: 1 }),
    ] }),
    graph({ role: "products", beat: "peak", density: 0, whitespace: 3, edge: "contained", continuityToNext: "bridge", narrative: "product-led", regions: [
      region({ id: "object", role: "single-product", span: 6, weight: 5, align: "center", refs: [product(16)], anchor: product(16) }),
    ] }),
    graph({ role: "products", beat: "rest", density: 0, whitespace: 3, edge: "contained", continuityToNext: "continue", narrative: "editorial-story", regions: [
      region({ id: "note", role: "copy", span: 5, weight: 2, align: "end" }),
    ] }),
    graph({ role: "products", beat: "close", density: 0, whitespace: 3, edge: "contained", narrative: "product-led", regions: [
      region({ id: "second", role: "single-product", span: 4, weight: 3, refs: [product(17)] }),
      region({ id: "invite", role: "copy", span: 5, weight: 3, align: "start", withCta: true }),
    ] }),
  ];
}

/** D: mixed arc -- sparse -> dense -> focal -> rest -> closing. */
function arcGraphs(): GraphSectionV1[] {
  return [
    graph({ role: "products", beat: "open", density: 0, whitespace: 3, edge: "contained", continuityToNext: "contrast", narrative: "product-led", regions: [
      region({ id: "open-copy", role: "copy", span: 8, weight: 5, align: "start" }),
    ] }),
    graph({ role: "products", beat: "build", density: 3, whitespace: 0, edge: "contained", continuityToNext: "continue", narrative: "catalog-orientation", regions: [
      region({ id: "dense", role: "product-group", span: 12, weight: 2, density: 3, arrangement: "grid", refs: products(0, 1, 2, 3, 4, 5, 9, 10, 11, 12) }),
    ] }),
    graph({ role: "products", beat: "peak", density: 1, whitespace: 2, edge: "bleed", continuityToNext: "bridge", narrative: "product-led", regions: [
      region({ id: "focus", role: "single-product", span: 7, weight: 5, refs: [product(17)], anchor: product(17) }),
      region({ id: "focus-copy", role: "copy", span: 5, weight: 4, align: "start", withCta: true }),
    ] }),
    graph({ role: "products", beat: "rest", density: 0, whitespace: 3, edge: "contained", continuityToNext: "contrast", narrative: "editorial-story", regions: [
      region({ id: "pause", role: "copy", span: 6, weight: 2, align: "center" }),
    ] }),
    graph({ role: "products", beat: "close", density: 1, whitespace: 1, edge: "contained", narrative: "conversion-led", regions: [
      region({ id: "close-copy", role: "copy", span: 9, weight: 3, align: "start" }),
      region({ id: "close-action", role: "cta", span: 3, weight: 4, align: "end" }),
    ] }),
  ];
}

/** E: the SAME five grounded products, four different relational compositions. */
export const CF2_DIVERSITY_PRODUCTS = [0, 4, 8, 16, 17] as const;
export function diversityGraphs(): GraphSectionV1[] {
  const [a, b, c, d, e] = CF2_DIVERSITY_PRODUCTS;
  return [
    graph({ role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", narrative: "product-led", regions: [
      region({ id: "anchor", role: "single-product", span: 8, weight: 5, refs: [product(a)], anchor: product(a) }),
      region({ id: "support", role: "product-group", span: 4, weight: 2, arrangement: "stack", refs: products(b, c, d, e) }),
    ] }),
    graph({ role: "products", beat: "build", density: 1, whitespace: 2, edge: "contained", narrative: "editorial-story", regions: [
      region({ id: "copy", role: "copy", span: 5, weight: 4, align: "start", pinned: true }),
      region({ id: "set", role: "product-group", span: 7, weight: 3, arrangement: "grid", refs: products(d, a, b, c, e), anchor: product(d) }),
    ] }),
    graph({ role: "products", beat: "build", density: 2, whitespace: 1, edge: "contained", narrative: "product-led", regions: [
      region({ id: "rail", role: "product-group", span: 12, weight: 3, arrangement: "rail", refs: products(e, d, c, b, a), anchor: product(e) }),
    ] }),
    graph({ role: "products", beat: "build", density: 1, whitespace: 3, edge: "contained", narrative: "product-led", regions: [
      region({ id: "story", role: "product-group", span: 12, weight: 3, regions: [a, b, c, d, e].map((index, position) => region({ id: `item-${position + 1}`, role: "single-product", span: 8, weight: 3, align: position % 2 === 0 ? "start" : "end", refs: [product(index)] })) }),
    ] }),
  ];
}

export const CF2_REVIEW_VARIANTS = {
  "cf2-editorial": "A · Editorial commerce",
  "cf2-dense": "B · Dense catalog",
  "cf2-premium": "C · Premium / sparse",
  "cf2-arc": "D · Mixed page arc",
  "cf2-diversity": "E · Same facts, 4 graphs",
} as const;
export type Cf2ReviewVariant = keyof typeof CF2_REVIEW_VARIANTS;

export function isCf2ReviewVariant(value: string): value is Cf2ReviewVariant {
  return Object.prototype.hasOwnProperty.call(CF2_REVIEW_VARIANTS, value);
}

export function cf2GraphsFor(variant: Cf2ReviewVariant, categoryKeys: string[]): GraphSectionV1[] {
  switch (variant) {
    case "cf2-editorial": return editorialGraphs();
    case "cf2-dense": return denseGraphs(categoryKeys);
    case "cf2-premium": return premiumGraphs();
    case "cf2-arc": return arcGraphs();
    case "cf2-diversity": return diversityGraphs();
  }
}

/** Compiles a fixture page (nav + graph sections + footer) through the REAL blueprint compiler. */
export function buildCf2Architecture(graphs: readonly (GraphSectionV1 | Record<string, unknown>)[], options: { label?: string } = {}): OrvenixSiteArchitecture {
  const catalog = cf2Products();
  const links = cf2CategoryLinks(catalog);
  const graphSection = (graphValue: GraphSectionV1 | Record<string, unknown>, index: number): OrvenixSiteSectionPlan => {
    const role = (graphValue as { role?: string }).role === "content" ? "content" : "products";
    return {
      role,
      blockType: null,
      purpose: "CF-2 graph section.",
      instance: {
        id: `home:graph:${index}`,
        role,
        selection: { mode: "all" },
        composition: {
          graph: graphValue as GraphSectionV1,
          ctaAction: CTA,
          ...(role === "content" ? { categoryLinks: links } : {}),
        },
        provenance: "deterministic",
      },
    };
  };
  return {
    siteType: "ecommerce",
    industry: "retail",
    objective: "Vender en linea",
    businessName: "NovaMarket",
    products: catalog,
    pages: [
      {
        name: options.label ?? "Inicio",
        slug: "home",
        purpose: "Comercio: home.",
        archetype: "overview",
        sections: [
          { role: "navigation", blockType: null, purpose: "Navegacion." },
          ...graphs.map(graphSection),
          { role: "footer", blockType: null, purpose: "Footer." },
        ],
      },
      {
        name: "Productos",
        slug: "productos",
        purpose: "Comercio: catalogo.",
        archetype: "catalog",
        sections: [
          { role: "navigation", blockType: null, purpose: "Navegacion." },
          graphSection(graph({ role: "products", beat: "build", density: 3, whitespace: 0, edge: "contained", narrative: "catalog-orientation", regions: [
            region({ id: "all", role: "product-group", span: 12, weight: 2, density: 3, arrangement: "grid", refs: catalog.slice(0, 24).map((_, index) => product(index)) }),
          ] }), 0),
          { role: "footer", blockType: null, purpose: "Footer." },
        ],
      },
    ],
  };
}

export function compileCf2Pages(graphs: readonly (GraphSectionV1 | Record<string, unknown>)[], label?: string): Array<{ slug: string; name: string; isHome: boolean; tree: EditorTree }> {
  const compiled = compileSiteBlueprint(buildCf2Architecture(graphs, { label }), { themePalette: CF2_PALETTE, accentColor: CF2_PALETTE.accent, commerceSurfaces: true });
  return compiled.pages.map((page) => ({ slug: page.slug, name: page.name, isHome: page.slug === "home", tree: page.tree as EditorTree }));
}

export function buildCf2ReviewPages(variant: Cf2ReviewVariant) {
  const keys = cf2CategoryLinks(cf2Products()).map((link) => commerceCategoryKeyV1(link.label));
  return compileCf2Pages(cf2GraphsFor(variant, keys), CF2_REVIEW_VARIANTS[variant]);
}
