import Link from "next/link";
import { ArrowRight, LayoutTemplate, Star } from "lucide-react";
import { REAL_TEMPLATES } from "@/lib/realTemplates";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { TemplateGrid } from "./TemplateGrid";

const STATS = [
  { value: `${REAL_TEMPLATES.length}`, label: "sitios reales" },
  { value: `${new Set(REAL_TEMPLATES.map(t => t.category)).size}`, label: "industrias" },
  { value: "100%", label: "editables" },
  { value: "Next.js", label: "stack moderno" },
];

export default function TemplatesCatalogPage() {
  return (
    <MarketingLayout>
      <main>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/[0.06] pb-16 pt-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(0,181,246,0.07)_0%,transparent_70%)]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/50">
              <LayoutTemplate size={13} className="text-cyan-400" />
              Catálogo de webs profesionales · Listas para producción
            </div>

            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-7xl">
                  Webs reales.<br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Listas para tu cliente.
                  </span>
                </h1>
                <p className="mt-5 text-base leading-7 text-white/45 md:text-lg">
                  Cada template es un sitio completo, funcional y editable. Elige por industria, prueba la demo en vivo y actívalo desde tu cuenta en minutos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:min-w-[280px]">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
                    <div className="text-2xl font-black text-white">{value}</div>
                    <div className="mt-0.5 text-xs text-white/35">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── GRID con filtro interactivo ──────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <TemplateGrid />
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────── */}
        <section className="border-t border-white/[0.06] bg-white/[0.015] py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-yellow-400/80">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />)}
              <span className="text-white/40 text-xs ml-1">Webs reales, clientes reales</span>
            </div>
            <h2 className="text-4xl font-black text-white md:text-5xl">
              ¿No encuentras tu industria?
            </h2>
            <p className="mt-4 text-base text-white/40">
              Contáctanos y construimos un sitio a medida para tu negocio o el de tu cliente.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contacto"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-slate-950 transition hover:bg-white/90"
              >
                Solicitar sitio a medida
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/webs"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                Ver demos en vivo
              </Link>
            </div>
          </div>
        </section>

      </main>
    </MarketingLayout>
  );
}
