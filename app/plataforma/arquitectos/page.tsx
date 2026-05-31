import type { Metadata } from "next";
import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SectionHeader } from "@/components/marketing/sections/SectionHeader";
import { CtaSection } from "@/components/marketing/sections/CtaSection";

export const metadata: Metadata = {
  title: "Forma Estudio | Arquitectura contemporánea",
  description:
    "Estudio de arquitectura con 15 años creando espacios únicos. Diseño residencial, corporativo, cultural y paisajismo.",
};

const projects = [
  "Residencial contemporáneo",
  "Hospitalidad boutique",
  "Espacio cultural",
  "Oficinas y corporativo",
];

const principles = [
  "Claridad espacial y ritmo visual",
  "Materialidad con intención",
  "Proyectos que equilibran forma y uso",
];

export default function PlataformaArquitectosPage() {
  return (
    <MarketingLayout>
      <section className="min-h-[76vh] bg-[linear-gradient(180deg,#080808_0%,#0f0f0f_100%)]">
        <div className="mk-container grid min-h-[76vh] items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              Arquitectura contemporánea
            </div>
            <h1 className="text-5xl font-thin leading-none tracking-tight text-white md:text-7xl">
              Espacios que combinan <span className="text-amber-300 italic">precisión</span> y
              presencia
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
              Una base minimalista para estudios de arquitectura, interiorismo o diseño espacial
              que necesitan mostrar portafolio, filosofía y proceso con mucho aire visual.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/portafolio" className="mk-btn-primary">
                Ver portafolio →
              </Link>
              <Link href="/templates" className="mk-btn-outline">
                Explorar plantillas
              </Link>
            </div>
          </div>

          <div className="mk-glass-card overflow-hidden p-0">
            <div className="h-80 bg-[linear-gradient(145deg,#141006,#080808_60%,#100e08)]" />
            <div className="border-t border-white/8 p-6">
              <div className="text-xs uppercase tracking-[0.18em] text-amber-300">
                Proyecto destacado
              </div>
              <div className="mt-2 text-lg font-medium text-white">
                Residencia de líneas puras y materialidad cálida
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Visual hero para galería, estudio o presentación arquitectónica premium.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Portafolio"
            title="Categorías listas para una galería editorial"
            description="Pensado para mostrar proyectos por tipología, etapa o especialidad."
            center
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {projects.map((project) => (
              <article key={project} className="mk-glass-card p-6">
                <div className="mb-3 text-xs uppercase tracking-[0.18em] text-amber-300">
                  Proyecto
                </div>
                <h3 className="text-lg font-medium text-white">{project}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="Filosofía"
            title="Una plantilla sobria, pensada para diseño espacial"
            description="La composición prioriza blanco visual, imágenes grandes y narrativa de proyecto."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {principles.map((principle) => (
              <div key={principle} className="mk-glass-card p-6">
                <p className="text-sm leading-7 text-orvenix-secondary">{principle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Quieres adaptar esta plantilla a tu estudio?"
        description="Podemos convertirla en un sitio real con galería, contacto y contenido editorial para tu firma."
        buttonLabel="Solicitar versión real →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
