import { notFound } from "next/navigation";
import { REVIEW_SITES_V1, loadReviewSiteV1, type ReviewSiteKeyV1 } from "./review-sites";

/**
 * CF-4D.1 review dashboard (DEV ONLY; `.dev.tsx` is excluded from production
 * builds and this 404s under NODE_ENV=production). Compact cards; each site
 * is reviewed in isolation at /dev-motif-review/site/<fixture>/<slug>. The
 * full technical evidence lives at /dev-motif-review/evidence.
 * OFFLINE CONTRACT PROOF -- NOT MODEL OUTPUT. No provider, no DB.
 */

export const dynamic = "force-dynamic";

const button = (primary: boolean) => ({ display: "inline-block", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", background: primary ? "#0f172a" : "#e2e8f0", color: primary ? "#fff" : "#0f172a" });

export default async function DevMotifReviewIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const keys = Object.keys(REVIEW_SITES_V1) as ReviewSiteKeyV1[];
  const sites = await Promise.all(keys.map(async (key) => ({ key, site: await loadReviewSiteV1(key) })));
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Creative Freedom V2 — revisión visual</h1>
      <p style={{ fontSize: 13, color: "#7c2d12", fontWeight: 600 }}>OFFLINE CONTRACT PROOF — NOT MODEL OUTPUT. Sitios compilados por el pipeline real (parser → validador → adaptador → compilador) a partir de un arquitecto simulado.</p>
      <p style={{ fontSize: 13 }}>
        Evidencia técnica completa (CF-4B / CF-4C / CF-4D / CF-4D.1 antes-después): <a href="/dev-motif-review/evidence" style={{ color: "#1d4ed8" }}>/dev-motif-review/evidence</a>
      </p>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", marginTop: 16 }}>
        {sites.map(({ key, site }) => {
          const home = site.pages.find((page) => page.isHome) ?? site.pages[0];
          return (
            <article key={key} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{REVIEW_SITES_V1[key].label}</h2>
              <p style={{ fontSize: 13, color: "#475569" }}>{REVIEW_SITES_V1[key].description}</p>
              <p style={{ fontSize: 12, fontFamily: "monospace", color: "#334155" }}>
                {site.summary.pages} páginas · {site.summary.graphs} grafos · {site.summary.uniqueShapes} formas · {site.summary.uniqueSkeletons} esqueletos
                {site.summary.motifClones !== null ? ` · ${site.summary.motifClones} clones de motivo` : ""}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <a href={`/dev-motif-review/site/${key}/${encodeURIComponent(home.slug)}`} style={button(true)}>Ver sitio</a>
                <a href={`/dev-motif-review/diagnostics/${key}`} style={button(false)}>Ver diagnóstico</a>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
