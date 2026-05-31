import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SectionHeader } from "@/components/marketing/sections/SectionHeader";
import { CtaSection } from "@/components/marketing/sections/CtaSection";

export const metadata: Metadata = {
  title: "NovaBiz Consulting — Estrategia Empresarial",
  description:
    "Consultoría empresarial de alto impacto. Estrategia, crecimiento y transformación digital para tu empresa.",
};

const stats = [
  { value: "120+", label: "proyectos estratégicos" },
  { value: "48h", label: "diagnóstico inicial" },
  { value: "14", label: "sectores atendidos" },
  { value: "LATAM", label: "alcance regional" },
];

const services = [
  {
    title: "Estrategia y crecimiento",
    description:
      "Alineamos posicionamiento, prioridades y oportunidades reales para que la empresa escale con una dirección clara.",
  },
  {
    title: "Transformación digital",
    description:
      "Convertimos procesos dispersos en sistemas operativos más simples, medibles y sostenibles.",
  },
  {
    title: "Optimización comercial",
    description:
      "Revisamos oferta, embudos, pricing y experiencia de cliente para mejorar conversión y retención.",
  },
];

const process = [
  "Diagnóstico ejecutivo y lectura del negocio",
  "Definición de roadmap y quick wins",
  "Implementación con entregables claros",
  "Seguimiento, medición y ajuste",
];

export default function PlataformaConsultoriaPage() {
  return (
    <MarketingLayout>
      <section className="mk-hero min-h-[70vh] flex items-center bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(201,168,76,0.12),transparent_26%),linear-gradient(180deg,#070c1a_0%,#0d1628_100%)]">
        <div className="mk-container">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                Consultoría empresarial
              </div>
              <h1 className="text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
                Estrategia que <span className="mk-gradient-text">convierte resultados</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                Ayudamos a empresas medianas y grandes a definir su dirección, optimizar
                procesos y escalar de forma sostenida con un enfoque ejecutivo y aterrizado.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/contacto" className="mk-btn-primary">
                  Agendar consulta →
                </Link>
                <Link href="/plataforma/plantillas" className="mk-btn-outline">
                  Ver más plantillas
                </Link>
              </div>
            </div>

            <div className="mk-glass-card p-6">
              <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-4">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Panel estratégico
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Activo
                </span>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    crecimiento anual
                  </div>
                  <div className="mt-2 text-3xl font-black text-white">+34%</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    eficiencia operativa
                  </div>
                  <div className="mt-2 text-3xl font-black text-white">82%</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    roadmap de implementación
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-300">
                    Auditoría, prioridades, quick wins y ejecución por fases con seguimiento.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section-alt py-12">
        <div className="mk-container grid gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-black text-blue-300">{stat.value}</div>
              <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Servicios"
            title="Acompañamiento ejecutivo para crecer con orden"
            description="Una base útil para firmas de consultoría, advisory boutique o servicios B2B de alto valor."
            center
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article key={service.title} className="mk-glass-card p-6">
                <h3 className="text-xl font-bold text-orvenix-text">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-orvenix-secondary">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Proceso"
            title="Cómo se traduce la estrategia en entregables"
            description="Una secuencia compacta para explicar valor, claridad y tiempo de respuesta."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {process.map((step, index) => (
              <div key={step} className="mk-glass-card p-6">
                <div className="text-4xl font-black text-blue-300/30">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="mt-3 text-sm leading-7 text-orvenix-secondary">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Quieres usar esta plantilla como base comercial?"
        description="Podemos convertirla en una web real, personalizarla o integrarla a tu cuenta dentro del sistema."
        buttonLabel="Hablar con Orvenix →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
