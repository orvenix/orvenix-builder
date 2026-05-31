import { notFound, redirect } from "next/navigation";
import { getPublishedSite } from "@/lib/auth";
import { PublicRenderer } from "@/components/PublicRenderer";
import { getResolvedSiteRuntimeContext } from "@/lib/builder-core/tree/siteRuntimeContext";
import { getPublishedSitePublicPath, hasPublishedSiteArtifact } from "@/lib/publishedSiteArtifacts";
import { trackPageView } from "@/lib/analytics";
import { SiteCopyrightBar, parseSiteOwnership } from "@/components/SiteCopyrightBar";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSeoTitle(seo: unknown, fallback: string) {
  if (!seo || typeof seo !== "object" || Array.isArray(seo)) return fallback;
  const value = (seo as { title?: unknown }).title;
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function PublicPageBySlug({ params, searchParams }: Props) {
  const { id, slug } = await params;
  const site = await getPublishedSite(id);

  if (!site) notFound();

  if (await hasPublishedSiteArtifact(id, slug)) {
    redirect(getPublishedSitePublicPath(id, slug));
  }

  let runtimeContext;
  try {
    runtimeContext = await getResolvedSiteRuntimeContext(id, slug);
  } catch {
    notFound();
  }

  if (!runtimeContext) {
    notFound();
  }

  trackPageView(id).catch(() => {});
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const funnelId = typeof resolvedSearchParams?.funnelId === "string" ? resolvedSearchParams.funnelId : ""
  const funnelStep = typeof resolvedSearchParams?.funnelStep === "string" ? resolvedSearchParams.funnelStep : ""
  if (funnelId && (funnelStep === "landing" || funnelStep === "checkout" || funnelStep === "upsell" || funnelStep === "downsell" || funnelStep === "thankyou")) {
    const { trackFunnelEvent } = await import("@/lib/commerce/funnel-analytics")
    trackFunnelEvent({ siteId: id, funnelId, step: funnelStep, eventType: "step_view" }).catch(() => {})
  }

  const ownership = parseSiteOwnership(site.description);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <PublicRenderer
          siteId={id}
          tree={runtimeContext.tree}
          activePageSlug={runtimeContext.activePageSlug}
          activePageName={runtimeContext.activePageName}
          availablePages={runtimeContext.pages}
        />
      </div>
      <SiteCopyrightBar siteName={runtimeContext.activePageName || site.name} ownership={ownership} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id, slug } = await params;
  const site = await getPublishedSite(id);
  if (!site) {
    return { title: "Orvenix" };
  }

  const runtimeContext = await getResolvedSiteRuntimeContext(id, slug);
  const title = getSeoTitle(runtimeContext?.page.seo, runtimeContext?.activePageName ?? site.name);
  return { title };
}
