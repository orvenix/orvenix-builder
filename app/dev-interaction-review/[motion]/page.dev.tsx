import { notFound } from "next/navigation";
import { PublicRenderer } from "@/components/PublicRenderer";
import { RUNTIME_MOTION_BUCKETS } from "@/lib/builder-core/runtime/motion";
import { buildVocabularyReviewTree, readPce3cArtifact } from "../review-fixtures";
import { ReviewBar } from "../ReviewBar";

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
 */

export const dynamic = "force-dynamic";

export default async function DevInteractionReviewVocabularyPage({ params }: { params: Promise<{ motion: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { motion } = await params;
  const bucket = RUNTIME_MOTION_BUCKETS.find((value) => value === motion);
  if (!bucket) notFound();
  const artifact = await readPce3cArtifact();

  return (
    <div>
      <ReviewBar bucket={bucket} current="vocabulary" artifactVariants={artifact ? Object.entries(artifact.labels) : []} />
      <PublicRenderer siteId="" tree={buildVocabularyReviewTree(bucket)} activePageSlug="home" activePageName="Inicio" />
    </div>
  );
}
