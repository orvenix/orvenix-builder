import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SectionHeader } from "@/components/marketing/sections/SectionHeader";
import { CtaSection } from "@/components/marketing/sections/CtaSection";

export const metadata: Metadata = {
  title: "MERIDIANO — Revista digital de análisis y cultura",
  description:
    "Revista digital con periodismo de análisis sobre tecnología, negocios, cultura y ciencia.",
};

const metrics = [
  { value: "280k+", label: "lectores mensuales" },
  { value: "1,400+", label: "artículos publicados" },
  { value: "45", label: "colaboradores expertos" },
  { value: "8", label: "años de trayectoria" },
];

const featuredPosts = [
  {
    title: "El futuro del trabajo en la era de la inteligencia artificial",
    description:
      "Cómo las empresas mexicanas están navegando la disrupción tecnológica sin perder a su talento más valioso.",
    category: "Tecnología",
  },
  {
    title: "La nueva economía de suscripción en LATAM",
    description:
      "Modelos de recurrencia, comunidad y valor percibido en negocios digitales de la región.",
    category: "Negocios",
  },
  {
    title: "Diseño editorial para audiencias que sí leen",
    description:
      "Jerarquía, ritmo y claridad visual para publicaciones que necesitan profundidad y legibilidad.",
    category: "Cultura",
  },
];

export default function PlataformaBlogSimplePage() {
  return (
    <MarketingLayout>
      <section className="mk-hero min-h-[62vh] flex items-center bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,#060608_0%,#0c0c10_100%)]">
        <div className="mk-container">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Análisis · Tecnología
            </div>
            <h1 className="text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
              El futuro del trabajo en la era de la{" "}
              <span className="mk-gradient-text">inteligencia artificial</span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              Una plantilla editorial pensada para medios, blogs premium o revistas digitales con
              jerarquía fuerte, foco en lectura y bloques listos para crecer.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/blog" className="mk-btn-primary">
                Ir al blog SaaS →
              </Link>
              <Link href="/templates" className="mk-btn-outline">
                Ver plantillas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section-alt py-12">
        <div className="mk-container grid gap-6 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <div className="text-4xl font-black text-cyan-300">{metric.value}</div>
              <div className="mt-2 text-sm text-slate-400">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Editorial"
            title="Lecturas destacadas y portada modular"
            description="Ideal para publicaciones que mezclan análisis, negocio, cultura o newsletters especializadas."
            center
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featuredPosts.map((post, index) => (
              <article key={post.title} className="mk-glass-card overflow-hidden">
                <div className="h-44 bg-[linear-gradient(145deg,#080c14,#060608)]" />
                <div className="p-6">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    {post.category} · {index === 0 ? "Portada" : "Columna"}
                  </div>
                  <h3 className="text-xl font-bold text-orvenix-text">{post.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-orvenix-secondary">
                    {post.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section-alt">
        <div className="mk-container">
          <div className="mk-glass-card p-8 text-center">
            <h2 className="text-3xl font-bold text-orvenix-text">
              Newsletter y membresía listos para crecer
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-orvenix-secondary">
              Esta base editorial ya puede servir como landing de publicación, medio temático o
              magazine premium dentro del ecosistema Orvenix.
            </p>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Quieres una versión viva de esta plantilla?"
        description="La podemos convertir en sitio real, blog de marca o publicación editorial conectada al sistema."
        buttonLabel="Solicitar adaptación →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
