import fs from "node:fs/promises";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { PublicRenderer } from "@/components/PublicRenderer";
import {
  isAssistedE2EHarnessEnabledV1,
  type AssistedComparisonArtifactV1,
} from "@/lib/orvenix-ai/assisted-generation/e2e/comparison-harness";
import { ASSISTED_COMPARISON_ARTIFACT_PATH_V1 } from "@/lib/orvenix-ai/assisted-generation/e2e/artifact-path";

/**
 * ASSISTED-4A: DEV/E2E-ONLY viewer for the NovaMarket comparison artifact
 * (written by ./run). Same gate as the route, and likewise excluded from
 * production builds by its `.dev.tsx` extension (next.config.ts). Renders the stored trees
 * through the real PublicRenderer -- no second renderer. Reads only the
 * local gitignored artifact; no DB, no network. The top bar is a plain
 * navigation switch between variants/pages, nothing commerce-functional.
 */

export const dynamic = "force-dynamic";

const VARIANTS = { off: "ORVENIX ONLY", assisted: "ORVENIX + CLAUDE" } as const;
type VariantKey = keyof typeof VARIANTS;

export default async function DevAssistedGenerationViewerPage({
  params,
}: {
  params: Promise<{ variant: string; slug: string }>;
}) {
  if (!isAssistedE2EHarnessEnabledV1({ NODE_ENV: process.env.NODE_ENV, ORVENIX_DEV_ASSISTED_E2E: process.env.ORVENIX_DEV_ASSISTED_E2E })) {
    notFound();
  }

  const session = await getAuthSession();
  if (!session?.user?.id) return <pre>No active session.</pre>;

  const { variant, slug } = await params;
  if (variant !== "off" && variant !== "assisted") notFound();
  const variantKey: VariantKey = variant;

  let artifact: AssistedComparisonArtifactV1;
  try {
    artifact = JSON.parse(await fs.readFile(ASSISTED_COMPARISON_ARTIFACT_PATH_V1, "utf8")) as AssistedComparisonArtifactV1;
  } catch {
    return <pre>No comparison artifact yet. POST /dev-assisted-generation-e2e/run first.</pre>;
  }

  const run = artifact[variantKey];
  const page = run.pages.find((entry) => entry.slug === slug);
  if (!page) notFound();

  const siteId = `dev-assisted-e2e-${variantKey}`;
  const availablePages = run.pages.map((entry) => ({
    id: null,
    siteId,
    name: entry.name || entry.slug,
    slug: entry.slug,
    isHome: entry.isHome,
    published: false,
    source: "site-page" as const,
  }));

  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", padding: "8px 16px", background: "#0f172a", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12 }}>
        <strong>{artifact.fixture.name} · {VARIANTS[variantKey]}</strong>
        {(Object.keys(VARIANTS) as VariantKey[]).map((key) => (
          <Link key={key} href={`/dev-assisted-generation-e2e/view/${key}/${artifact[key].pages.some((p) => p.slug === slug) ? slug : "home"}`} style={{ textDecoration: key === variantKey ? "underline" : "none" }}>
            {VARIANTS[key]}
          </Link>
        ))}
        <span>|</span>
        {run.pages.map((entry) => (
          <Link key={entry.slug} href={`/dev-assisted-generation-e2e/view/${variantKey}/${entry.slug}`} style={{ textDecoration: entry.slug === slug ? "underline" : "none" }}>
            {entry.slug}
          </Link>
        ))}
        <span>| assisted: {run.lifecycle.status}</span>
      </div>
      <PublicRenderer siteId={siteId} tree={page.tree} activePageSlug={page.slug} activePageName={page.name || page.slug} availablePages={availablePages} />
    </div>
  );
}
