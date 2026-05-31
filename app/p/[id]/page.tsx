import { notFound, redirect } from "next/navigation";
import { getPublishedSite } from "@/lib/auth";
import { PublicRenderer } from "@/components/PublicRenderer";
import { getResolvedSiteRuntimeContext } from "@/lib/builder-core/tree/siteRuntimeContext";
import { getPublishedSitePublicPath, hasPublishedSiteArtifact } from "@/lib/publishedSiteArtifacts";
import { trackPageView } from "@/lib/analytics";
import { SiteCopyrightBar, parseSiteOwnership } from "@/components/SiteCopyrightBar";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function getSeoTitle(seo: unknown, fallback: string) {
  if (!seo || typeof seo !== "object" || Array.isArray(seo)) return fallback;
  const value = (seo as { title?: unknown }).title;
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function PublicPage({ params, searchParams }: Props) {
  const { id } = await params;
  const site = await getPublishedSite(id);

  if (!site) notFound();

  // Registrar visita de forma asíncrona — no bloquea el renderizado
  trackPageView(id).catch(() => {})
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const funnelId = typeof resolvedSearchParams?.funnelId === "string" ? resolvedSearchParams.funnelId : ""
  const funnelStep = typeof resolvedSearchParams?.funnelStep === "string" ? resolvedSearchParams.funnelStep : ""
  if (funnelId && (funnelStep === "landing" || funnelStep === "checkout" || funnelStep === "upsell" || funnelStep === "downsell" || funnelStep === "thankyou")) {
    const { trackFunnelEvent } = await import("@/lib/commerce/funnel-analytics")
    trackFunnelEvent({ siteId: id, funnelId, step: funnelStep, eventType: "step_view" }).catch(() => {})
  }

  if (await hasPublishedSiteArtifact(id)) {
    redirect(getPublishedSitePublicPath(id));
  }

  let runtimeContext;
  try {
    runtimeContext = await getResolvedSiteRuntimeContext(id);
  } catch {
    notFound();
  }

  if (!runtimeContext) {
    notFound();
  }

  const ownership = parseSiteOwnership(site.description)

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
      <SiteCopyrightBar siteName={site.name} ownership={ownership} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const site = await getPublishedSite(id);
  const runtimeContext = site ? await getResolvedSiteRuntimeContext(id) : null;
  return { title: getSeoTitle(runtimeContext?.page.seo, site?.name ?? "Orvenix") };
}
