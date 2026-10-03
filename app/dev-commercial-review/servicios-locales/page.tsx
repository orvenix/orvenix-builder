import Link from "next/link"
import { notFound } from "next/navigation"

import { PublicRenderer } from "@/components/PublicRenderer"
import { compileCommercialDesignV1 } from "@/lib/orvenix-ai/commercial-designs"

export const dynamic = "force-dynamic"

const FRAMES = [
  { label: "Desktop", width: 1280 },
  { label: "Tablet", width: 834 },
  { label: "Mobile", width: 390 },
] as const

export default async function DevCommercialServiciosLocalesPage() {
  if (process.env.NODE_ENV === "production") notFound()

  const compiled = await compileCommercialDesignV1({
    mode: "demo",
    designId: "servicios-locales",
    version: 1,
  })

  const pages = compiled.plan.pages.map((page) => ({
    id: page.slug,
    siteId: "dev-commercial-servicios-locales",
    slug: page.slug,
    name: page.name,
    isHome: page.isHome,
    published: true,
    source: "site-page" as const,
  }))

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <header className="mx-auto mb-8 flex max-w-7xl flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Dev commercial review</p>
          <h1 className="mt-2 text-3xl font-black">Servicios Locales V1</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Referencia visual heredada contra el compilado autoritativo desde CommercialDesignV1 + DemoFactsPack.
            Esta ruta no existe en producción.
          </p>
        </div>
        <Link href="/webs/servicios-locales" className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/75 hover:bg-white/10">
          Abrir referencia
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white/70">Reference: /webs/servicios-locales</h2>
            <span className="text-xs text-white/40">solo comparación visual</span>
          </div>
          <iframe src="/webs/servicios-locales" title="Referencia Servicios Locales" className="h-[520px] w-full rounded-2xl border border-white/10 bg-white" />
        </div>

        {FRAMES.map((frame) => (
          <div key={frame.label} className="rounded-3xl border border-cyan-300/15 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">Compiled: {frame.label}</h2>
              <span className="text-xs text-white/40">{frame.width}px</span>
            </div>
            <div className="mx-auto h-[640px] overflow-auto rounded-2xl border border-white/10 bg-white" style={{ width: frame.width, maxWidth: "100%" }}>
              <PublicRenderer
                siteId="dev-commercial-servicios-locales"
                tree={compiled.plan.pages[0].tree}
                activePageSlug="home"
                activePageName="Inicio"
                availablePages={pages}
              />
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
