import { notFound } from "next/navigation";
import { PublicRenderer } from "@/components/PublicRenderer";
import { isReviewSiteKeyV1, loadReviewSiteV1 } from "../../../review-sites";

/**
 * CF-4D.1 review UX (DEV ONLY): ONE fixture page, rendered alone through the
 * real PublicRenderer -- navigation, sections, footer and theme exactly as
 * compiled. No diagnostics, no wrappers. Internal links stay inside
 * /dev-motif-review/frame/<fixture>/<slug>. Loaded inside the review
 * toolbar's iframe so device widths use the site's real media queries.
 */

export const dynamic = "force-dynamic";

export default async function DevMotifReviewFramePage({ params }: { params: Promise<{ fixture: string; slug: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { fixture, slug } = await params;
  if (!isReviewSiteKeyV1(fixture)) notFound();
  const site = await loadReviewSiteV1(fixture);
  const page = site.pages.find((entry) => entry.slug === decodeURIComponent(slug));
  if (!page) notFound();
  const siteId = `dev-motif-review-${fixture}`;
  const availablePages = site.pages.map((entry) => ({ id: null, siteId, name: entry.name || entry.slug, slug: entry.slug, isHome: entry.isHome, published: false, source: "site-page" as const }));
  return <PublicRenderer siteId={siteId} tree={page.tree} activePageSlug={page.slug} activePageName={page.name || page.slug} availablePages={availablePages} />;
}
