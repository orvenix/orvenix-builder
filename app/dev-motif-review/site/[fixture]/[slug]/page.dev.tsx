import { notFound } from "next/navigation";
import { REVIEW_SITES_V1, isReviewSiteKeyV1, loadReviewSiteV1 } from "../../../review-sites";

/**
 * CF-4D.1 review UX (DEV ONLY): a small toolbar ABOVE the site plus the site
 * itself in an iframe (/dev-motif-review/frame/...). Device modes only set
 * the iframe width, so the site's own responsive CSS decides the layout --
 * nothing is faked. Diagnostics live on a separate page.
 */

export const dynamic = "force-dynamic";

const VIEWPORTS = { desktop: { label: "Desktop", width: "100%" }, tablet: { label: "Tablet", width: "834px" }, mobile: { label: "Mobile", width: "390px" } } as const;
type Viewport = keyof typeof VIEWPORTS;

const chip = (active: boolean) => ({ padding: "4px 10px", borderRadius: 999, fontSize: 12, textDecoration: "none", background: active ? "#f8fafc" : "transparent", color: active ? "#0f172a" : "#e2e8f0", border: "1px solid #475569" });

export default async function DevMotifReviewSitePage({ params, searchParams }: { params: Promise<{ fixture: string; slug: string }>; searchParams: Promise<{ vp?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { fixture, slug } = await params;
  const { vp } = await searchParams;
  if (!isReviewSiteKeyV1(fixture)) notFound();
  const site = await loadReviewSiteV1(fixture);
  const current = decodeURIComponent(slug);
  const page = site.pages.find((entry) => entry.slug === current);
  if (!page) notFound();
  const viewport: Viewport = vp === "tablet" || vp === "mobile" ? vp : "desktop";
  const siteHref = (pageSlug: string, nextViewport: Viewport = viewport) => `/dev-motif-review/site/${fixture}/${encodeURIComponent(pageSlug)}${nextViewport === "desktop" ? "" : `?vp=${nextViewport}`}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", fontFamily: "system-ui, sans-serif" }}>
      <nav aria-label="Review toolbar" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "8px 14px", color: "#e2e8f0", fontSize: 13, borderBottom: "1px solid #334155" }}>
        <a href="/dev-motif-review" style={{ color: "#93c5fd", textDecoration: "none" }}>← Volver a revisión</a>
        <span style={{ fontWeight: 700 }}>Fixture: {REVIEW_SITES_V1[fixture].label}</span>
        <span style={{ color: "#94a3b8" }}>Página:</span>
        {site.pages.map((entry) => (
          <a key={entry.slug} href={siteHref(entry.slug)} style={chip(entry.slug === current)}>{entry.name || entry.slug}</a>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {(Object.keys(VIEWPORTS) as Viewport[]).map((key) => (
            <a key={key} href={siteHref(current, key)} style={chip(key === viewport)}>{VIEWPORTS[key].label}</a>
          ))}
          <a href={`/dev-motif-review/diagnostics/${fixture}`} style={chip(false)}>Diagnostics</a>
        </span>
      </nav>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", background: viewport === "desktop" ? "#ffffff" : "#1e293b", overflow: "hidden" }}>
        <iframe
          key={`${current}-${viewport}`}
          title={`${REVIEW_SITES_V1[fixture].label} — ${page.name || page.slug}`}
          src={`/dev-motif-review/frame/${fixture}/${encodeURIComponent(current)}`}
          style={{ width: VIEWPORTS[viewport].width, maxWidth: "100%", height: "100%", border: 0, background: "#fff", boxShadow: viewport === "desktop" ? "none" : "0 0 0 1px #475569" }}
        />
      </div>
    </div>
  );
}
