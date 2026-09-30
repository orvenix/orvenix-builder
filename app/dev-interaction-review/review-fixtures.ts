import fs from "node:fs/promises";
import path from "node:path";
import { composeSection } from "@/lib/orvenix-ai/composer/section-composer";
import type { ComposedSection, SectionCompositionContext } from "@/lib/orvenix-ai/composer/types";
import { bindStoreProductRecordsV1 } from "@/lib/orvenix-ai/commerce/product-facts";
import { buildNovaMarketMockStoreRecordsV1, NOVAMARKET_MOCK_SITE_ID_V1 } from "@/lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture";
import { rewriteTreeForAssistedViewerV1 } from "@/lib/orvenix-ai/assisted-generation/e2e/viewer-links";
import { injectStoreCartShellNodesV1 } from "@/lib/orvenix-ai/commerce/store-shell";
import { resolveCommerceSurfaceV1 } from "@/lib/orvenix-ai/commerce/commerce-surface";
import { toPublicProductDetailV1 } from "@/lib/commerce/public-product-detail";
import type { CartItem } from "@/store/useCartStore";
import type { RuntimeMotionBucket } from "@/lib/builder-core/runtime/motion";
import type { EditorNode, EditorTree, GlobalTheme } from "@/types/editor";

/**
 * PCE-4A review fixtures (DEV ONLY; imported only by `.dev.tsx` routes).
 *
 * Nothing here invents design: the "vocabulary" page is assembled from the
 * real composer (composeSection -- the same call the blueprint compiler
 * makes) with the NovaMarket mock catalog, and the "pce3c" pages are the
 * accepted PCE-3C artifact trees rendered unmodified except for
 * theme.motion.duration, which is how production expresses the motion bucket.
 * No DB, no network, no provider.
 */

/** What site-builder writes for each AI motionBucket. */
export const REVIEW_DURATION_BY_BUCKET: Record<RuntimeMotionBucket, string> = {
  none: "0ms",
  subtle: "180ms",
  expressive: "320ms",
};

/** The accepted PCE-3C snapshot (local, gitignored, written by the ASSISTED e2e harness). */
export const PCE3C_ARTIFACT_PATH = path.join(process.cwd(), ".tmp", "dev-assisted-generation-e2e", "novamarket-comparison-pce3c.json");

/** Theme values copied from the accepted PCE-3C catalog artifact. */
const PCE3C_THEME: GlobalTheme = {
  colors: { accent: "#4ade80", background: "#eef9ff", primary: "#16a34a", secondary: "#166534", text: "#062f44" },
  fontBody: "Inter",
  fontHeading: "Inter",
  motion: { duration: "220ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  radius: { button: "999px", card: "24px" },
  shadow: { soft: "0 18px 48px rgba(7,89,133,0.10)", strong: "0 30px 90px rgba(7,89,133,0.18)" },
  spacing: { sectionX: "1.75rem", sectionY: "3.5rem", stack: "1.25rem" },
};

export const REVIEW_COMPOSITIONS = [
  "featured-plus-grid",
  "product-rail",
  "category-spotlight",
  "editorial-collection",
  "alternating-story",
  "dense-catalog",
] as const;

export const REVIEW_TREATMENTS = ["compact-catalog", "editorial", "image-led", "featured", "horizontal"] as const;

export function withMotionBucket(theme: GlobalTheme | undefined, bucket: RuntimeMotionBucket): GlobalTheme {
  const base = theme ?? PCE3C_THEME;
  return {
    ...base,
    motion: { ...(base.motion ?? { easing: "ease" }), duration: REVIEW_DURATION_BY_BUCKET[bucket] },
  };
}

/** Copies a composed section into editor nodes exactly like the blueprint compiler (deterministic ids). */
function copyComposed(section: ComposedSection | null, prefix: string, nodes: Record<string, EditorNode>): string | null {
  if (!section) return null;
  const id = (tempId: string) => `${prefix}-${tempId}`;
  for (const composed of Object.values(section.nodes)) {
    nodes[id(composed.tempId)] = {
      id: id(composed.tempId),
      type: composed.type,
      displayName: composed.displayName,
      props: { ...composed.props },
      children: composed.children.map(id),
      version: 1,
    };
  }
  return id(section.rootId);
}

export function buildVocabularyReviewTree(bucket: RuntimeMotionBucket): EditorTree {
  const records = buildNovaMarketMockStoreRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1);
  const products = bindStoreProductRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1, records);
  const palette = PCE3C_THEME.colors!;
  const base: SectionCompositionContext = {
    businessName: "NovaMarket",
    products,
    commerceSurfaces: true,
    themePalette: palette,
    accentColor: palette.accent,
  };

  const nodes: Record<string, EditorNode> = {};
  const children: string[] = [];
  const push = (prefix: string, section: ComposedSection | null) => {
    const rootId = copyComposed(section, prefix, nodes);
    if (rootId) children.push(rootId);
  };

  push("nav", composeSection("navigation", { ...base, navigationCartProminence: "prominent" }));

  push("hero", composeSection("hero", base));
  for (const composition of REVIEW_COMPOSITIONS) {
    push(composition, composition === "category-spotlight"
      ? composeSection("content", {
        ...base,
        commerceMerchandisingComposition: composition,
        commerceCategoryLinks: [
          { label: "Tecnología", href: "#featured-plus-grid" },
          { label: "Audio", href: "#product-rail" },
          { label: "Hogar", href: "#dense-catalog" },
        ],
      })
      : composeSection("products", { ...base, commerceMerchandisingComposition: composition }));
  }
  for (const treatment of REVIEW_TREATMENTS) {
    push(`treatment-${treatment}`, composeSection("products", { ...base, products: products.slice(0, 3), commerceProductCardTreatment: treatment }));
  }
  // PCE-4B: variant selection review -- the authoritative row mapping
  // (toPublicProductDetailV1), not hand-written variants.
  const detail = toPublicProductDetailV1({ ...records[0], media: [] }, NOVAMARKET_MOCK_SITE_ID_V1);
  if (detail) {
    nodes["detail-section"] = { id: "detail-section", type: "section", props: { maxWidth: "xl", paddingY: "xl", paddingX: "lg" }, children: ["detail"], version: 1 };
    nodes.detail = {
      id: "detail",
      type: "store-product-detail",
      props: {
        productId: detail.productId,
        productName: detail.name,
        ...(detail.description ? { description: detail.description } : {}),
        variants: detail.variants.map((variant) => ({ ...variant })),
        surface: resolveCommerceSurfaceV1(palette, { relation: "continuous" }),
      },
      children: [],
      version: 1,
    };
    children.push("detail-section");
  }
  push("cta", composeSection("cta", base));

  // PCE-4B: the cart shell comes from the canonical store shell -- the same
  // call the compiler makes -- never hand-inserted.
  const shellChildren = injectStoreCartShellNodesV1(nodes, "root", children, palette.accent);
  nodes.root = { id: "root", type: "section", props: { maxWidth: "full", paddingY: "none", paddingX: "none" }, children: shellChildren, version: 1 };

  const theme = withMotionBucket(PCE3C_THEME, bucket);
  return { version: 1, rootId: "root", nodes, theme, globalTheme: theme };
}

type ArtifactPage = { slug: string; name?: string; isHome?: boolean; tree: EditorTree };
type Pce3cArtifact = { variantLabels?: Record<string, string>; [key: string]: unknown };

export async function readPce3cArtifact(): Promise<{ labels: Record<string, string>; pages: Record<string, ArtifactPage[]> } | null> {
  let artifact: Pce3cArtifact;
  try {
    artifact = JSON.parse(await fs.readFile(PCE3C_ARTIFACT_PATH, "utf8")) as Pce3cArtifact;
  } catch {
    return null;
  }
  const labels = artifact.variantLabels ?? {};
  const pages: Record<string, ArtifactPage[]> = {};
  for (const key of Object.keys(labels)) {
    const run = artifact[key] as { pages?: ArtifactPage[] } | undefined;
    if (run && Array.isArray(run.pages)) pages[key] = run.pages;
  }
  return { labels, pages };
}

/**
 * Accepted PCE-3C page, unmodified except for theme.motion.duration. Internal
 * page links are pointed back into this review route (render copy only).
 */
export function buildPce3cReviewTree(page: ArtifactPage, variant: string, slugs: ReadonlySet<string>, bucket: RuntimeMotionBucket): EditorTree {
  const { tree } = rewriteTreeForAssistedViewerV1(page.tree, variant, slugs);
  const relinked = JSON.parse(
    JSON.stringify(tree).split(`/dev-assisted-generation-e2e/view/${variant}/`).join(`/dev-interaction-review/${bucket}/${variant}/`),
  ) as EditorTree;
  const theme = withMotionBucket(relinked.theme, bucket);
  return { ...relinked, theme, globalTheme: relinked.globalTheme ? theme : relinked.globalTheme };
}

export const REVIEW_CART_PRESETS = ["empty", "one", "several", "long"] as const;
export type ReviewCartPreset = (typeof REVIEW_CART_PRESETS)[number];

/**
 * In-memory cart contents for drawer review (never persisted: the review
 * route is not /p/, so the cart has no site key). Items come from the mock
 * catalog; "long" stretches one name/variant to exercise wrapping.
 */
export function buildReviewCartItems(preset: ReviewCartPreset): CartItem[] {
  if (preset === "empty") return [];
  const records = buildNovaMarketMockStoreRecordsV1(NOVAMARKET_MOCK_SITE_ID_V1);
  const toItem = (index: number, quantity: number): CartItem | null => {
    const record = records[index];
    const variant = record?.variants[0];
    if (!record || !variant) return null;
    return { productId: record.id, variantId: variant.id, productName: record.name, variantName: variant.name, priceMxn: variant.priceMxn, quantity };
  };
  const items = (preset === "one" ? [toItem(0, 1)] : [toItem(0, 2), toItem(1, 1), toItem(3, 3), toItem(8, 1), toItem(16, 2), toItem(17, 1)])
    .filter((item): item is CartItem => item !== null);
  if (preset === "long" && items[0]) {
    items[0] = {
      ...items[0],
      productName: `${items[0].productName} edición extendida con un nombre deliberadamente largo para revisar el ajuste de línea`,
      variantName: "Variante con una descripción también larga: 128 GB · Wi-Fi · color grafito",
      quantity: 99,
    };
  }
  return items;
}
