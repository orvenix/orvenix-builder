import { runAutonomousMultiPageSiteBuilder } from "@/lib/orvenix-ai/autonomous/site-builder";
import type { AutonomousSiteBuilderInput } from "@/lib/orvenix-ai/autonomous/types";
import { DISABLED_ASSET_PROVIDER_V1, buildNovaMarketNewStorePreviewInputV1 } from "@/lib/orvenix-ai/assisted-generation/e2e/comparison-harness";
import { parseFullSiteProviderResponseV1 } from "@/lib/orvenix-ai/full-site-generation/anthropic-provider";
import type { FullSiteCreativeBlueprintProviderV1 } from "@/lib/orvenix-ai/full-site-generation/contract";
import type { FullSiteCreativeRequestContextV1 } from "@/lib/orvenix-ai/full-site-generation/request-context";
import type { ProviderDesignMotifV2, ProviderMotifRegionV2 } from "@/lib/orvenix-ai/design-reference/motifs";
import { analyzeFullSiteCreativeResultV1, type FullSiteCreativeEvidenceV1 } from "@/lib/orvenix-ai/full-site-generation/creative-evidence";
import type { CompositionMemoryV1 } from "@/lib/orvenix-ai/design-memory/composition-memory";

/**
 * CF-4D (DEV/TEST ONLY) -- OFFLINE CONTRACT PROOF, NOT MODEL OUTPUT.
 *
 * A deterministic "simulated architect" receives the REAL request context
 * (catalog + the motifs Orvenix actually retrieved for it) and returns a
 * provider-shaped blueprint by a fixed rule: each supplied products/category
 * motif becomes one graph section (refs drawn from the real catalog, beats
 * ordered by page arc), plus V1 opening/closing sections. Its text goes
 * through the REAL parser -> validator -> adapter -> compiler. Any
 * structural difference between fixtures therefore comes from the business
 * facts and the retrieval, not from hand-designed pages.
 */

type Json = Record<string, unknown>;
const BEAT_ORDER = ["open", "build", "peak", "rest", "close"];

function variants(price: number) {
  return [{ label: "Unica", priceMxn: price, availability: "in_stock" as const, initialStock: 12 }];
}

function presentationProducts(spec: Array<[string, string, string, number]>) {
  return spec.map(([name, category, description, price]) => ({ name, category, description, variants: variants(price) }));
}

// ─── A: editorial / premium small catalog (presentation facts, rich descriptions) ──
const A_PRODUCTS = presentationProducts([
  ["Jarron Bruma", "Ceramica", "Pieza torneada a mano con esmalte mate en tono arena, pensada como objeto principal de una mesa o repisa.", 1890],
  ["Cuenco Marea", "Ceramica", "Cuenco amplio de gres con borde irregular y acabado satinado que resalta la textura natural del barro.", 940],
  ["Taza Alba", "Ceramica", "Taza de gres con asa ergonomica y esmalte blanco suave, parte de una serie corta producida por temporada.", 420],
  ["Grabado Horizonte", "Grabados", "Grabado en linoleo impreso sobre papel de algodon, edicion numerada con margen amplio para enmarcar.", 2350],
  ["Grabado Raiz", "Grabados", "Composicion organica impresa en dos tintas sobre papel artesanal, firmada por el taller.", 1980],
  ["Grabado Silencio", "Grabados", "Estudio minimalista de lineas finas impreso a mano, pensado para espacios tranquilos.", 1650],
]);

// ─── B: playful / image-rich medium commerce (bound store rows with real media) ──
const B_SITE = "cf4d-offline-pixel-parque";
const B_SPEC: Array<[string, string, number]> = [
  ["Robot Saltarin", "Juguetes", 690], ["Tren de Colores", "Juguetes", 820], ["Cohete Burbuja", "Juguetes", 540], ["Dino Rodante", "Juguetes", 610],
  ["Oso Nube", "Peluches", 480], ["Gato Galleta", "Peluches", 450], ["Pulpo Risitas", "Peluches", 520],
  ["Crayolas Arcoiris", "Arte", 260], ["Kit Acuarela Mini", "Arte", 390], ["Libreta Garabato", "Arte", 180],
  ["Bloques Torre", "Bloques", 760], ["Bloques Puente", "Bloques", 880], ["Bloques Castillo", "Bloques", 1240], ["Bloques Mini", "Bloques", 340],
];
const B_RECORDS = B_SPEC.map(([name, category, price], index) => ({
  id: `cf4d-prod-${index + 1}`,
  siteId: B_SITE,
  name,
  description: `Juguete ${name.toLowerCase()} para jugar en casa.`,
  status: "active",
  metadata: { category },
  media: [`https://cdn.example.test/pixel-parque/${index + 1}.jpg`],
  variants: [{ id: `cf4d-var-${index + 1}`, sku: `PP-${index + 1}`, name: "Unica", priceMxn: price, stock: 9 }],
}));

// ─── C: dense / large catalog commerce (presentation facts, terse) ───────────────
const C_CATEGORIES = ["Tornilleria", "Herramienta", "Electrico", "Plomeria", "Pintura", "Jardin", "Seguridad", "Adhesivos"];
const C_PRODUCTS = presentationProducts(Array.from({ length: 40 }, (_, index) => [`Articulo ${C_CATEGORIES[index % 8]} ${Math.floor(index / 8) + 1}`, C_CATEGORIES[index % 8], "Articulo de mayoreo.", 50 + index * 7] as [string, string, string, number]));

function baseInput(name: string, industry: string, products: unknown[]): AutonomousSiteBuilderInput {
  return {
    request: `Crea una tienda en linea para ${name}`,
    business: { name, industry, description: `FIXTURE SINTETICO OFFLINE (${name}).`, location: "Mexico", objective: "Vender productos en linea", products: products as never },
    forceFreshComposition: true,
    minimumQuality: 55,
    assetProvider: DISABLED_ASSET_PROVIDER_V1,
    commerceProvisioning: { mode: "new_store" },
  } as AutonomousSiteBuilderInput;
}

export const CF4D_OFFLINE_FIXTURES = {
  A: { label: "A - editorial / premium small catalog", input: () => baseInput("Atelier Lumen", "taller de ceramica y grabado", A_PRODUCTS) },
  B: { label: "B - playful / image-rich medium commerce", input: () => ({ ...baseInput("Pixel Parque", "jugueteria", B_SPEC.map(([name, category, price]) => ({ name, category, variants: variants(price) }))), commerceStore: { siteId: B_SITE, records: B_RECORDS } }) as AutonomousSiteBuilderInput },
  C: { label: "C - dense / large catalog commerce", input: () => baseInput("Ferretek Mayoreo", "ferreteria de mayoreo", C_PRODUCTS) },
} as const;
export type Cf4dOfflineFixtureKey = keyof typeof CF4D_OFFLINE_FIXTURES;

// ─── the simulated architect (fixed rule over the REAL request context) ─────────

/** CF-4D baseline architect (BEFORE): turns each supplied motif into a graph VERBATIM (kept for the before/after proof). */
export function cloningArchitectBlueprintV1(context: FullSiteCreativeRequestContextV1): Json {
  const catalog = context.catalog;
  const categories = catalog.categories.slice(0, 4);
  const media = catalog.products.filter((product) => product.hasImage).map((product) => product.index);
  let cursor = 0;
  const needed = (regions: readonly ProviderMotifRegionV2[]): number => regions.reduce((sum, region) => sum + (region.role === "single-product" ? 1 : region.role === "product-group" && !region.regions ? (region.arrangement === "rail" ? 6 : 3) : 0) + needed(region.regions ?? []), 0);
  const instantiate = (motif: ProviderDesignMotifV2, preferredPool: number[]) => {
    // Distinct refs per section (a product appears once per section); a too-small category falls back to the whole catalog.
    const pool = preferredPool.length >= needed(motif.regions) ? preferredPool : catalog.products.map((product) => product.index);
    const used = new Set<number>();
    const take = (count: number) => {
      const picked: number[] = [];
      for (let step = 0; picked.length < count && step < pool.length; step += 1) {
        const candidate = pool[(cursor + step) % pool.length];
        if (!used.has(candidate)) { used.add(candidate); picked.push(candidate); }
      }
      cursor += count;
      return picked;
    };
    let needsCta = false;
    const region = (draft: ProviderMotifRegionV2, id: string): Json => {
      const out: Json = { id, role: draft.role, span: draft.span, weight: draft.weight };
      for (const key of ["align", "arrangement", "density", "whitespace", "pinned"] as const) if (draft[key] !== undefined) out[key] = draft[key];
      if (draft.withCta || draft.role === "cta") needsCta = true;
      if (draft.withCta) out.withCta = true;
      if (draft.role === "single-product") out.refs = take(1).map((index) => ({ kind: "product", index }));
      if (draft.role === "product-group" && !draft.regions) out.refs = take(draft.arrangement === "rail" ? 6 : 3).map((index) => ({ kind: "product", index }));
      if (draft.role === "category-group") out.refs = categories.map((category) => ({ kind: "category", key: category.key }));
      if (draft.role === "grounded-media") out.refs = [{ kind: "product-media", index: media[0] }];
      if (draft.regions) out.regions = draft.regions.map((child, index) => region(child, `${id}-${index}`));
      if (draft.focal && Array.isArray(out.refs) && (out.refs as Json[]).length) out.anchor = (out.refs as Json[])[0];
      return out;
    };
    const graph: Json = { version: 1, role: motif.role, beat: motif.beat, density: motif.density, whitespace: motif.whitespace, edge: motif.edge, ...(motif.continuityToNext ? { continuityToNext: motif.continuityToNext } : {}), regions: motif.regions.map((entry, index) => region(entry, `r${index}`)) };
    return { graph, needsCta };
  };
  const graphSections = (motifs: ProviderDesignMotifV2[], pool: number[]) => {
    const usable = motifs.filter((motif) => motif.role === "products" || motif.regions.some((region) => region.role === "category-group"));
    const ordered = [...usable].sort((a, b) => BEAT_ORDER.indexOf(a.beat) - BEAT_ORDER.indexOf(b.beat));
    const kept = ordered.filter((motif, index) => (motif.beat !== "open" || index === 0) && (motif.beat !== "close" || index === ordered.length - 1)).filter((motif, index, all) => motif.beat !== "peak" || all.slice(0, index).filter((entry) => entry.beat === "peak").length < 2);
    return kept.map((motif) => {
      const { graph, needsCta } = instantiate(motif, pool);
      const refs = ((graph.regions as Json[]).flatMap((region) => [...((region.refs as Json[]) ?? []), ...((region.regions as Json[] | undefined) ?? []).flatMap((child) => (child.refs as Json[]) ?? [])])).filter((ref) => ref.kind === "product");
      return motif.role === "products"
        ? { intent: "collection", role: "products", refs: refs.length ? refs : [{ kind: "product", index: pool[0] }], ...(needsCta ? { ctaIntent: "browse" } : {}), composition: graph }
        : { intent: "navigation_discovery", role: "content", refs: categories.map((category) => ({ kind: "category", key: category.key })), ...(needsCta ? { ctaIntent: "browse" } : {}), composition: graph };
    });
  };
  const motifs = context.designMotifs ?? [];
  const all = catalog.products.map((product) => product.index);
  const forPurpose = (purpose: string) => motifs.filter((motif) => motif.purposes.includes(purpose as never));
  const opening = { intent: "opening", role: "hero" };
  const closing = { intent: "closing", role: "cta" };
  return {
    version: 1,
    roleKey: "full_site_creative_blueprint_v1",
    strategyKey: "bounded_full_site_generation_v1",
    siteConcept: { narrative: "product-led", rhythm: "varied", density: "balanced" },
    navigation: { concept: "classic", primaryPurposes: ["home", "catalog"], cartProminence: "subtle" },
    pages: [
      { purpose: "home", sections: [opening, ...graphSections(forPurpose("home"), all), closing] },
      { purpose: "catalog", sections: [opening, ...graphSections(forPurpose("catalog"), all), { intent: "catalog_surface", role: "products" }, closing] },
      ...categories.map((category) => ({ purpose: "category", target: { kind: "category", key: category.key }, sections: [opening, ...graphSections(forPurpose("category").slice(0, 2), category.productIndexes.length >= 2 ? category.productIndexes : all), closing] })),
    ],
  };
}

/**
 * CF-4D.1 SYNTHESIZING architect (default). Still a fixed rule over the
 * REAL request context -- but it composes, the way a designer would:
 * - relation (regions) from one supplied motif + rhythm (density,
 *   whitespace, edge, continuity) from ANOTHER supplied motif;
 * - mirrored relations on alternating pages; a trailing "end" region on
 *   open, uncrowded rows (void between, compiler-owned);
 * - category pages vary with their index AND their content size;
 * - grounded media relations only when the catalog really has images;
 * - claim-safe copy built from grounded labels only.
 * The real validator decides; nothing here bypasses it.
 */
export function simulatedArchitectBlueprintV1(context: FullSiteCreativeRequestContextV1): Json {
  const catalog = context.catalog;
  const categories = catalog.categories.slice(0, 4);
  const media = catalog.products.filter((product) => product.hasImage).map((product) => product.index);
  const all = catalog.products.map((product) => product.index);
  const motifs = (context.designMotifs ?? []).filter((motif) => motif.role === "products" || motif.regions.some((region) => region.role === "category-group"));
  let cursor = 0;
  const needed = (regions: readonly ProviderMotifRegionV2[]): number => regions.reduce((sum, region) => sum + (region.role === "single-product" ? 1 : region.role === "product-group" && !region.regions ? (region.arrangement === "rail" ? 6 : 3) : 0) + needed(region.regions ?? []), 0);

  const ground = (regions: ProviderMotifRegionV2[], preferredPool: number[]) => {
    const pool = preferredPool.length >= needed(regions) ? preferredPool : all;
    const used = new Set<number>();
    let needsCta = false;
    const take = (count: number) => {
      const picked: number[] = [];
      for (let step = 0; picked.length < count && step < pool.length; step += 1) {
        const candidate = pool[(cursor + step) % pool.length];
        if (!used.has(candidate)) { used.add(candidate); picked.push(candidate); }
      }
      cursor += count;
      return picked;
    };
    const region = (draft: ProviderMotifRegionV2, id: string): Json => {
      const out: Json = { id, role: draft.role, span: draft.span, weight: draft.weight };
      for (const key of ["align", "arrangement", "density", "whitespace", "pinned"] as const) if (draft[key] !== undefined) out[key] = draft[key];
      if (draft.withCta || draft.role === "cta") needsCta = true;
      if (draft.withCta) out.withCta = true;
      if (draft.role === "single-product") out.refs = take(1).map((index) => ({ kind: "product", index }));
      if (draft.role === "product-group" && !draft.regions) out.refs = take(draft.arrangement === "rail" ? 6 : 3).map((index) => ({ kind: "product", index }));
      if (draft.role === "category-group") out.refs = categories.map((category) => ({ kind: "category", key: category.key }));
      if (draft.role === "grounded-media") out.refs = [{ kind: "product-media", index: media[cursor++ % media.length] }];
      if (draft.regions) out.regions = draft.regions.map((child, index) => region(child, `${id}-${index}`));
      if (draft.focal && Array.isArray(out.refs) && (out.refs as Json[]).length) out.anchor = (out.refs as Json[])[0];
      return out;
    };
    return { regions: regions.map((entry, index) => region(entry, `r${index}`)), needsCta };
  };

  /** relation from `base`, rhythm from `donor`, mirrored when asked; arc rules respected (rest stays sparse). */
  const synthesize = (base: ProviderDesignMotifV2, donor: ProviderDesignMotifV2, mirror: boolean): ProviderDesignMotifV2 => {
    let regions = structuredClone(base.regions) as ProviderMotifRegionV2[];
    if (mirror && regions.length > 1) regions = [...regions].reverse();
    const whitespace = donor.whitespace;
    const fits = regions.reduce((sum, region) => sum + region.span, 0) <= 12;
    const copyFirst = regions[0]?.role === "copy" && regions[0].span >= 5;
    if (whitespace >= 2 && fits && copyFirst && regions.length > 1) {
      regions[0] = { ...regions[0], span: regions[0].span - 1 };
      regions[regions.length - 1] = { ...regions[regions.length - 1], align: "end" };
    }
    const donorArrangement = donor.regions.find((region) => region.arrangement)?.arrangement;
    regions = regions.map((region) => (region.role === "product-group" && !region.regions && donorArrangement && donorArrangement !== region.arrangement && (donorArrangement !== "rail" || region.span >= 8) ? { ...region, arrangement: donorArrangement } : region));
    return {
      ...base,
      regions,
      density: base.beat === "rest" ? Math.min(donor.density, 1) : donor.density,
      whitespace,
      edge: donor.edge,
      ...(donor.continuityToNext ? { continuityToNext: donor.continuityToNext } : { continuityToNext: undefined }),
    };
  };

  const section = (motif: ProviderDesignMotifV2, pool: number[], copy?: Json) => {
    const { regions, needsCta } = ground(motif.regions, pool);
    const graph: Json = { version: 1, role: motif.role, beat: motif.beat, density: motif.density, whitespace: motif.whitespace, edge: motif.edge, ...(motif.continuityToNext ? { continuityToNext: motif.continuityToNext } : {}), regions };
    const productRefs = (list: Json[]): Json[] => list.flatMap((region) => [...((region.refs as Json[]) ?? []).filter((ref) => ref.kind === "product"), ...productRefs((region.regions as Json[]) ?? [])]);
    const refs = productRefs(regions);
    const withCopy = copy && motif.regions.some((region) => region.role === "copy") ? { copy } : {};
    return motif.role === "products"
      ? { intent: "collection", role: "products", refs: refs.length ? refs : [{ kind: "product", index: pool[0] }], ...(needsCta ? { ctaIntent: "browse" } : {}), ...withCopy, composition: graph }
      : { intent: "navigation_discovery", role: "content", refs: categories.map((category) => ({ kind: "category", key: category.key })), ...(needsCta ? { ctaIntent: "browse" } : {}), ...withCopy, composition: graph };
  };

  const arcOrder = (list: ProviderDesignMotifV2[]) => {
    const ordered = [...list].sort((a, b) => BEAT_ORDER.indexOf(a.beat) - BEAT_ORDER.indexOf(b.beat));
    return ordered.filter((motif, index) => (motif.beat !== "open" || index === 0) && (motif.beat !== "close" || index === ordered.length - 1)).filter((motif, index, kept) => motif.beat !== "peak" || kept.slice(0, index).filter((entry) => entry.beat === "peak").length < 2);
  };
  const forPurpose = (purpose: string) => motifs.filter((motif) => motif.purposes.includes(purpose as never));
  const donorFor = (index: number, seed: number) => motifs[(index + seed + 1) % Math.max(1, motifs.length)] ?? motifs[index];
  const pageSections = (list: ProviderDesignMotifV2[], pool: number[], seed: number, copy?: (index: number) => Json | undefined) =>
    arcOrder(list.map((motif, index) => synthesize(motif, donorFor(motifs.indexOf(motif), seed), (index + seed) % 2 === 1)))
      // The prompt's rule: no continuity on the page's last graph section.
      .map((motif, index, ordered) => (index === ordered.length - 1 ? { ...motif, continuityToNext: undefined } : motif))
      .map((motif, index) => section(motif, pool, copy?.(index)));
  const mediaSection = (beat: "build" | "peak", mediaFirst: boolean, edge: "contained" | "bleed") => {
    const relation: ProviderDesignMotifV2 = { label: "media", purposes: ["home"], beat, role: "products", density: 1, whitespace: 2, edge, regions: mediaFirst ? [{ role: "grounded-media", span: 7, weight: 5 }, { role: "copy", span: 5, weight: 3 }] : [{ role: "copy", span: 4, weight: 3 }, { role: "grounded-media", span: 8, weight: 4 }] };
    return section(relation, all, { headline: "Mira de cerca lo que ofrecemos", intro: "Imagenes reales de productos del catalogo." });
  };

  const small = catalog.productCount <= 8;
  const opening = (layout?: string) => ({ intent: "opening", role: "hero", ...(layout ? { layout: { kind: layout } } : {}) });
  const closing = { intent: "closing", role: "cta" };
  const homeCopy = (index: number) => (index === 0 ? { headline: "Una seleccion para empezar", intro: "Piezas elegidas del catalogo de esta tienda." } : undefined);
  const homeSections = pageSections(forPurpose("home"), all, 0, homeCopy);
  if (media.length) homeSections.splice(1, 0, mediaSection("build", true, "bleed"));
  return {
    version: 1,
    roleKey: "full_site_creative_blueprint_v1",
    strategyKey: "bounded_full_site_generation_v1",
    siteConcept: { narrative: small ? "editorial" : "product-led", rhythm: "varied", density: small ? "minimal" : "balanced" },
    navigation: { concept: small ? "editorial" : "classic", primaryPurposes: ["home", "catalog"], cartProminence: "subtle" },
    pages: [
      { purpose: "home", sections: [opening(small ? "oversized-typography" : undefined), ...homeSections, closing] },
      { purpose: "catalog", sections: [opening(), ...pageSections(forPurpose("catalog"), all, 1), { intent: "catalog_surface", role: "products" }, closing] },
      ...categories.map((category, index) => {
        const pool = category.productIndexes.length >= 2 ? category.productIndexes : all;
        const eligible = forPurpose("category");
        const rotated = [...eligible.slice(index % Math.max(1, eligible.length)), ...eligible.slice(0, index % Math.max(1, eligible.length))];
        const count = pool.length <= 3 ? 1 : 1 + (index % 2);
        const chosen = pageSections(rotated.slice(0, count), pool, index + 2, (position) => (position === 0 ? { headline: `${category.label}, de cerca`, intro: `Una mirada a los productos de ${category.label}.` } : undefined));
        const withMedia = media.length && index % 2 === 1 ? [...chosen, mediaSection("build", false, "contained")] : chosen;
        return { purpose: "category", target: { kind: "category", key: category.key }, sections: [opening(index % 2 ? "oversized-typography" : undefined), ...withMedia, closing] };
      }),
    ],
  };
}

export type Cf4dOfflineRunV1 = {
  context: FullSiteCreativeRequestContextV1;
  providerOutput: Json;
  run: Awaited<ReturnType<typeof runAutonomousMultiPageSiteBuilder>>;
  evidence: FullSiteCreativeEvidenceV1;
};

/** Runs the REAL builder with the simulated architect as provider (text through the real parser). */
export async function runWithSimulatedArchitectV1(input: AutonomousSiteBuilderInput, compositionMemory?: CompositionMemoryV1, architect: "synthesizing" | "cloning" = "synthesizing"): Promise<Cf4dOfflineRunV1> {
  let context: FullSiteCreativeRequestContextV1 | null = null;
  let providerOutput: Json | null = null;
  const provider: FullSiteCreativeBlueprintProviderV1 = {
    providerKey: "offline-simulated-architect",
    async generate(request) {
      context = request as FullSiteCreativeRequestContextV1;
      providerOutput = parseFullSiteProviderResponseV1(JSON.stringify((architect === "cloning" ? cloningArchitectBlueprintV1 : simulatedArchitectBlueprintV1)(context)));
      return providerOutput;
    },
  };
  const run = await runAutonomousMultiPageSiteBuilder({ ...input, ...(compositionMemory ? { compositionMemory } : {}), commerceArchitecture: { provider } });
  const captured = context as unknown as FullSiteCreativeRequestContextV1;
  const evidence = analyzeFullSiteCreativeResultV1({
    providerOutput,
    plan: run.plan,
    warnings: [...run.warnings, ...("warnings" in run.fullSiteCreative.lifecycle ? run.fullSiteCreative.lifecycle.warnings : [])],
    catalog: { productCount: captured.catalog.productCount, categoryKeys: captured.catalog.categories.map((category) => category.key), mediaProductIndexes: captured.catalog.products.filter((product) => product.hasImage).map((product) => product.index) },
    suppliedMotifs: captured.designMotifs,
    ...(compositionMemory ? { memory: compositionMemory } : {}),
  });
  return { context: captured, providerOutput: providerOutput as unknown as Json, run, evidence };
}

export function novaMarketInputV1(): AutonomousSiteBuilderInput {
  return buildNovaMarketNewStorePreviewInputV1() as AutonomousSiteBuilderInput;
}

// ─── interpretable structural profile (no score) ───────────────────────────────

export type StructuralProfileV1 = {
  arcs: string[];
  shapes: string[];
  focalRoles: string[];
  densities: number[];
  whitespaces: number[];
  arrangements: string[];
  copyBesideContent: number;
  categoryRegions: number;
  productRegions: number;
  bleedSections: number;
};

export function structuralProfileV1(result: Cf4dOfflineRunV1): StructuralProfileV1 {
  const graphs = ((result.providerOutput.pages as Json[]) ?? []).flatMap((page) => ((page.sections as Json[]) ?? []).flatMap((section) => (section.composition ? [section.composition as Json] : [])));
  const flat = (regions: Json[]): Json[] => regions.flatMap((region) => [region, ...flat((region.regions as Json[]) ?? [])]);
  const regions = graphs.flatMap((graph) => flat(graph.regions as Json[]));
  return {
    arcs: Object.keys(result.evidence.arcDistribution).sort(),
    shapes: [...new Set(result.run.plan.pages.flatMap((page) => Object.values((page.tree as unknown as { nodes: Record<string, { props: Json }> }).nodes).flatMap((node) => { const shape = (node.props.compositionGraph as Json | undefined)?.shape; return typeof shape === "string" ? [shape] : []; })))].sort(),
    focalRoles: [...new Set(regions.filter((region) => region.anchor).map((region) => String(region.role)))].sort(),
    densities: graphs.map((graph) => Number(graph.density)),
    whitespaces: graphs.map((graph) => Number(graph.whitespace)),
    arrangements: [...new Set(regions.flatMap((region) => (region.arrangement ? [String(region.arrangement)] : [])))].sort(),
    copyBesideContent: graphs.filter((graph) => (graph.regions as Json[]).some((region) => region.role === "copy") && (graph.regions as Json[]).some((region) => region.role !== "copy" && region.role !== "cta")).length,
    categoryRegions: regions.filter((region) => region.role === "category-group").length,
    productRegions: regions.filter((region) => region.role === "single-product" || region.role === "product-group").length,
    bleedSections: graphs.filter((graph) => graph.edge === "bleed").length,
  };
}

// ─── historical call #3 baseline (frozen fixture, recomputed) ─────────────────

export async function analyzeCall3BaselineV1(): Promise<{ evidence: FullSiteCreativeEvidenceV1; compiledPages: number }> {
  const { buildFromProviderText, loadCf3bCall3FixtureV1 } = await import("../dev-interaction-review/cf3-fixtures");
  const { buildFullSiteCreativeRequestV1 } = await import("@/lib/orvenix-ai/full-site-generation/request-context");
  const { novaMarketProductsV1 } = await import("./memory-fixtures");
  const providerOutput = loadCf3bCall3FixtureV1().providerOutput;
  const run = await buildFromProviderText(JSON.stringify(providerOutput));
  const catalog = buildFullSiteCreativeRequestV1({ products: novaMarketProductsV1() }).context.catalog;
  const evidence = analyzeFullSiteCreativeResultV1({
    providerOutput,
    plan: run.plan,
    warnings: [...run.warnings, ...("warnings" in run.fullSiteCreative.lifecycle ? run.fullSiteCreative.lifecycle.warnings : [])],
    catalog: { productCount: catalog.productCount, categoryKeys: catalog.categories.map((category) => category.key), mediaProductIndexes: [] },
  });
  return { evidence, compiledPages: run.plan.pages.length };
}

// ─── same business (NovaMarket), with vs without owner memory ─────────────────

export async function novaMarketMemoryEffectV1() {
  const { compileBlueprintPlanV1, memoryRecordV1, motifHistoryBlueprintV1, novaMarketMotifContextV1 } = await import("./memory-fixtures");
  const { deriveCompositionMemoryV1 } = await import("@/lib/orvenix-ai/design-memory/composition-memory");
  const { retrieveReferenceMotifsV2 } = await import("@/lib/orvenix-ai/design-reference/motifs");
  const motifA = retrieveReferenceMotifsV2(novaMarketMotifContextV1()).selections[0].motif;
  const history = await compileBlueprintPlanV1(motifHistoryBlueprintV1(motifA, [0, 1, 2, 3, 4]));
  const memory = deriveCompositionMemoryV1([memoryRecordV1("owner", "published", history, 1), memoryRecordV1("owner", "accepted", history, 2)], { ownerUserId: "owner" });
  const withoutMemory = await runWithSimulatedArchitectV1(novaMarketInputV1());
  const withMemory = await runWithSimulatedArchitectV1(novaMarketInputV1(), memory);
  return { memory, withoutMemory, withMemory };
}
