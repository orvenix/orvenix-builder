import fs from "node:fs/promises";
import path from "node:path";
import { composeSection } from "@/lib/orvenix-ai/composer/section-composer";
import type { ComposedSection, SectionCompositionContext } from "@/lib/orvenix-ai/composer/types";
import { bindStoreProductRecordsV1 } from "@/lib/orvenix-ai/commerce/product-facts";
import { buildNovaMarketMockStoreRecordsV1, NOVAMARKET_MOCK_SITE_ID_V1 } from "@/lib/orvenix-ai/assisted-generation/e2e/novamarket-fixture";
import { rewriteTreeForAssistedViewerV1 } from "@/lib/orvenix-ai/assisted-generation/e2e/viewer-links";
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

  const navigation = composeSection("navigation", { ...base, navigationCartProminence: "prominent" });
  const navRoot = copyComposed(navigation, "nav", nodes);
  if (navRoot) {
    // The store shell sets showCart on selling pages (PCE-2); nothing else is changed.
    for (const node of Object.values(nodes)) if (node.type === "siteNav") node.props = { ...node.props, showCart: true };
    children.push(navRoot);
  }

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
  push("cta", composeSection("cta", base));

  nodes["cart-drawer"] = { id: "cart-drawer", type: "store-cart-drawer", props: {}, children: [], version: 1 };
  children.push("cart-drawer");
  nodes.root = { id: "root", type: "section", props: { maxWidth: "full", paddingY: "none", paddingX: "none" }, children, version: 1 };

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
