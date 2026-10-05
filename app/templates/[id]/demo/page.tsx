import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PublicRenderer } from "@/components/PublicRenderer"
import { getCommercialTemplateStart } from "@/lib/commercial/template-start"
import { compileCommercialDesignV1, getCommercialDesignV1, getDemoFactsV1 } from "@/lib/orvenix-ai/commercial-designs"
import { getRealTemplate } from "@/lib/realTemplates"

/**
 * CSC-1C: live showcase for a catalog template backed by a CommercialDesignV1.
 * It renders the COMPILED demo (fictional DemoFactsPack) from the same
 * commercial pipeline customers use -- never a hand-built page. Templates
 * without a commercial design (or without a demo pack) have no showcase here.
 * Not indexed: the sample business is fictional.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function CommercialTemplateDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const template = getRealTemplate(id)
  const designId = template?.commercialDesignId
  const version = template?.commercialDesignVersion
  if (!template || !designId || !version || !getCommercialDesignV1(designId, version) || !getDemoFactsV1(designId)) notFound()

  const { page: requestedPage } = await searchParams
  const compiled = await compileCommercialDesignV1({ mode: "demo", designId, version })
  const page = compiled.plan.pages.find((entry) => entry.slug === requestedPage) ?? compiled.plan.pages[0]
  const basePath = `/templates/${encodeURIComponent(template.id)}/demo`
  const startHref = getCommercialTemplateStart(template)?.href ?? `/templates/${encodeURIComponent(template.id)}`
  // An empty site id keeps the demo's internal links inert; pages are switched from the bar below.
  const availablePages = compiled.plan.pages.map((entry) => ({
    id: entry.slug,
    siteId: "",
    slug: entry.slug,
    name: entry.name,
    isHome: entry.isHome,
    published: true,
    source: "site-page" as const,
  }))

  return (
    <>
      <nav aria-label="Páginas del demo" className="sticky top-0 z-[60] flex flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-950 px-4 py-2 text-white">
        <span className="mr-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">{template.name} · demo con datos de ejemplo</span>
        {compiled.plan.pages.map((entry) => (
          <Link
            key={entry.slug}
            href={entry.isHome ? basePath : `${basePath}?page=${encodeURIComponent(entry.slug)}`}
            aria-current={entry.slug === page.slug ? "page" : undefined}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${entry.slug === page.slug ? "bg-white text-zinc-950" : "text-white/75 hover:bg-white/10"}`}
          >
            {entry.name}
          </Link>
        ))}
        {/* _top: the demo is also embedded as an iframe on the template page. */}
        <Link href={startHref} target="_top" className="ml-auto rounded-md border border-white/20 px-2.5 py-1 text-xs font-semibold text-white/80 hover:bg-white/10">
          Usar este diseño
        </Link>
      </nav>
      <PublicRenderer siteId="" tree={page.tree} activePageSlug={page.slug} activePageName={page.name} availablePages={availablePages} />
    </>
  )
}
