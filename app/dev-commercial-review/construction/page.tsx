import Link from "next/link"
import { notFound } from "next/navigation"

import { PublicRenderer } from "@/components/PublicRenderer"
import { compileCommercialDesignV1, type BusinessFactsInputV1 } from "@/lib/orvenix-ai/commercial-designs"

export const dynamic = "force-dynamic"

/**
 * CSC-1C: DEV-ONLY human review of the COMPILED Construction design
 * (construction@1) through the same pipeline customers use. Each viewport is
 * a real iframe so responsive breakpoints apply; `?frame=1` renders one bare
 * compiled page for those iframes. Never available in production.
 */

const FRAMES = [
  { label: "Desktop", width: 1280, height: 820 },
  { label: "Tablet", width: 834, height: 900 },
  { label: "Mobile", width: 390, height: 780 },
] as const

/** Review states: FULL EVIDENCE is the demo pack; the others are fictional customer facts exercising declared degradation. */
const STATES = {
  full: { label: "FULL EVIDENCE", note: "DemoFactsPack + derivados WebP sin metadatos" },
  sparse: { label: "SPARSE FACTS", note: "Solo nombre y teléfono" },
  "no-projects": { label: "SERVICIOS SIN PROYECTOS", note: "Servicios y WhatsApp, sin evidencia de proyectos" },
} as const
type ReviewState = keyof typeof STATES

const CUSTOMER_FACTS: Record<Exclude<ReviewState, "full">, BusinessFactsInputV1> = {
  sparse: { businessName: "Constructora Muestra", contact: { phone: "5512345678" } },
  "no-projects": {
    businessName: "Remodelaciones Muestra",
    description: "Remodelación residencial con atención directa por WhatsApp.",
    contact: { whatsapp: "5512345678" },
    serviceArea: ["Zona Sur"],
    services: [{ name: "Remodelación de cocinas" }, { name: "Baños" }, { name: "Acabados" }],
  },
}

function isReviewState(value: string | undefined): value is ReviewState {
  return Boolean(value && value in STATES)
}

async function compileState(state: ReviewState) {
  return state === "full"
    ? compileCommercialDesignV1({ mode: "demo", designId: "construction", version: 1 })
    : compileCommercialDesignV1({ mode: "customer", designId: "construction", version: 1, facts: CUSTOMER_FACTS[state] })
}

function reviewHref(state: ReviewState, page: string, frame = false) {
  const params = new URLSearchParams({ state, page })
  if (frame) params.set("frame", "1")
  return `/dev-commercial-review/construction?${params.toString()}`
}

export default async function DevCommercialConstructionPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; page?: string; frame?: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const params = await searchParams
  const state: ReviewState = isReviewState(params.state) ? params.state : "full"
  const compiled = await compileState(state)
  const page = compiled.plan.pages.find((entry) => entry.slug === params.page) ?? compiled.plan.pages[0]
  // An empty site id keeps internal page links inert ("#"): page switching happens in the review toolbar.
  const availablePages = compiled.plan.pages.map((entry) => ({
    id: entry.slug,
    siteId: "",
    slug: entry.slug,
    name: entry.name,
    isHome: entry.isHome,
    published: true,
    source: "site-page" as const,
  }))

  if (params.frame === "1") {
    return <PublicRenderer siteId="" tree={page.tree} activePageSlug={page.slug} activePageName={page.name} availablePages={availablePages} />
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6">
      <header className="mx-auto mb-6 max-w-7xl space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">Dev commercial review · solo desarrollo</p>
            <h1 className="mt-2 text-3xl font-black">Construction V1 · construction@1</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
              Salida COMPILADA por el pipeline comercial (misma definición para demo y cliente). Sin before/after, sin métricas, años, garantías ni certificaciones inventadas.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 px-4 py-3 text-xs text-white/60">
            <div>Fingerprint: <span className="font-mono text-white/80">{compiled.structuralFingerprint.slice(0, 16)}</span></div>
            <div>Omisiones declaradas: {compiled.resolved.omissions.length}</div>
          </div>
        </div>

        <nav aria-label="Estado de revisión" className="flex flex-wrap gap-2">
          {(Object.keys(STATES) as ReviewState[]).map((key) => (
            <Link
              key={key}
              href={reviewHref(key, "home")}
              className={`rounded-lg border px-3 py-2 text-xs font-bold ${key === state ? "border-amber-300 bg-amber-300 text-zinc-950" : "border-white/15 text-white/70 hover:bg-white/10"}`}
            >
              {STATES[key].label}
              <span className="ml-2 font-normal opacity-70">{STATES[key].note}</span>
            </Link>
          ))}
        </nav>

        <nav aria-label="Páginas compiladas" className="flex flex-wrap gap-2">
          {compiled.plan.pages.map((entry) => (
            <Link
              key={entry.slug}
              href={reviewHref(state, entry.slug)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${entry.slug === page.slug ? "bg-white text-zinc-950" : "bg-white/10 text-white/75 hover:bg-white/20"}`}
            >
              {entry.name}
            </Link>
          ))}
        </nav>

        {compiled.resolved.omissions.length > 0 && (
          <details className="rounded-xl border border-white/10 px-4 py-3 text-xs text-white/60">
            <summary className="cursor-pointer font-bold text-white/80">Degradación declarada</summary>
            <ul className="mt-2 space-y-1 font-mono">
              {compiled.resolved.omissions.map((omission) => (
                <li key={`${omission.page}:${omission.role ?? "page"}`}>{omission.page}{omission.role ? ` · ${omission.role}` : ""} — {omission.reason}</li>
              ))}
            </ul>
          </details>
        )}
      </header>

      <section className="mx-auto grid max-w-7xl gap-8">
        {FRAMES.map((frame) => (
          <div key={frame.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white/75">{STATES[state].label} · {frame.label}</h2>
              <span className="text-xs text-white/40">{frame.width}px · {page.name}</span>
            </div>
            <div className="overflow-x-auto">
              <iframe
                src={reviewHref(state, page.slug, true)}
                title={`${STATES[state].label} ${frame.label}`}
                width={frame.width}
                height={frame.height}
                className="mx-auto block rounded-xl border border-white/10 bg-white"
              />
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
