import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicRenderer } from "@/components/PublicRenderer";
import { RUNTIME_MOTION_BUCKETS } from "@/lib/builder-core/runtime/motion";
import { buildPce3cReviewTree, readPce3cArtifact } from "../../../review-fixtures";
import { ReviewBar } from "../../../ReviewBar";

/**
 * PCE-4A: DEV-ONLY review of the ACCEPTED PCE-3C pages (the human-approved
 * visual authority), rendered through the real PublicRenderer. The trees are
 * unmodified except for theme.motion.duration (the motion bucket) and
 * internal links pointed back into this route. Reads only the local
 * gitignored artifact -- no DB, no network. Excluded from production builds.
 */

export const dynamic = "force-dynamic";

export default async function DevInteractionReviewPce3cPage({
  params,
}: {
  params: Promise<{ motion: string; variant: string; slug: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { motion, variant, slug } = await params;
  const bucket = RUNTIME_MOTION_BUCKETS.find((value) => value === motion);
  if (!bucket) notFound();
  const artifact = await readPce3cArtifact();
  const pages = artifact?.pages[variant];
  if (!artifact || !pages) notFound();
  const page = pages.find((entry) => entry.slug === slug);
  if (!page) notFound();

  const siteId = `dev-assisted-e2e-${variant}`;
  const tree = buildPce3cReviewTree(page, variant, new Set(pages.map((entry) => entry.slug)), bucket);
  const availablePages = pages.map((entry) => ({
    id: null,
    siteId,
    name: entry.name || entry.slug,
    slug: entry.slug,
    isHome: Boolean(entry.isHome),
    published: false,
    source: "site-page" as const,
  }));

  return (
    <div>
      <ReviewBar bucket={bucket} current={variant} artifactVariants={Object.entries(artifact.labels)} suffix={`/${variant}/${slug}`} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: "6px 16px", background: "#1e293b", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12 }}>
        {pages.map((entry) => (
          <Link key={entry.slug} href={`/dev-interaction-review/${bucket}/${variant}/${entry.slug}`} style={{ color: "#e2e8f0", textDecoration: entry.slug === slug ? "underline" : "none" }}>
            {entry.slug}
          </Link>
        ))}
      </div>
      <PublicRenderer siteId={siteId} tree={tree} activePageSlug={page.slug} activePageName={page.name || page.slug} availablePages={availablePages} />
    </div>
  );
}
