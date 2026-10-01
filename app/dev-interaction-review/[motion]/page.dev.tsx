import { notFound } from "next/navigation";
import { PublicRenderer } from "@/components/PublicRenderer";
import { RUNTIME_MOTION_BUCKETS } from "@/lib/builder-core/runtime/motion";
import { buildReviewCartItems, buildVocabularyReviewTree, CF1_REVIEW_LABELS, readPce3cArtifact, REVIEW_CART_PRESETS } from "../review-fixtures";
import { ReviewCartSeeder } from "../ReviewCartSeeder";
import { ReviewBar } from "../ReviewBar";
import { CF2_REVIEW_VARIANTS } from "../cf2-fixtures";
import { CF3_REVIEW_VARIANTS } from "../cf3-fixtures";

/**
 * PCE-4A: DEV-ONLY interaction review -- commerce VOCABULARY page.
 * Excluded from production builds by its `.dev.tsx` extension
 * (next.config.ts) and 404s under NODE_ENV=production.
 *
 * Built from the real composer: all six merchandising compositions, all five
 * ProductCard treatments, hero/CTA/nav and the CartDrawer, rendered through
 * the real PublicRenderer. The accepted PCE-3C pages themselves are linked in
 * the bar (/dev-interaction-review/<bucket>/<variant>/<slug>).
 *
 * Empty siteId: the cart stays in memory (non-/p/ path) and CartDrawer
 * checkout stops at "Configura el sitio" before any request.
 * PCE-4B: ?cart=empty|one|several|long preloads the in-memory cart.
 */

export const dynamic = "force-dynamic";

export default async function DevInteractionReviewVocabularyPage({
  params,
  searchParams,
}: {
  params: Promise<{ motion: string }>;
  searchParams: Promise<{ cart?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { motion } = await params;
  const bucket = RUNTIME_MOTION_BUCKETS.find((value) => value === motion);
  if (!bucket) notFound();
  const artifact = await readPce3cArtifact();
  const cartParam = (await searchParams).cart;
  const cartPreset = REVIEW_CART_PRESETS.find((preset) => preset === cartParam);

  return (
    <div>
      <ReviewBar bucket={bucket} current="vocabulary" artifactVariants={[...(artifact ? Object.entries(artifact.labels) : []), ...Object.entries(CF1_REVIEW_LABELS), ...Object.entries(CF2_REVIEW_VARIANTS), ...Object.entries(CF3_REVIEW_VARIANTS)]} cartPresets={[...REVIEW_CART_PRESETS]} activeCartPreset={cartPreset} />
      <PublicRenderer siteId="" tree={buildVocabularyReviewTree(bucket)} activePageSlug="home" activePageName="Inicio" />
      {cartPreset ? <ReviewCartSeeder items={buildReviewCartItems(cartPreset)} /> : null}
    </div>
  );
}
