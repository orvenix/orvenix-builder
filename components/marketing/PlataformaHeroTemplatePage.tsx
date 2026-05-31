import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CtaSection } from "@/components/marketing/sections/CtaSection";
import type { PlataformaHeroTemplate } from "@/lib/plataformaHeroTemplates";

export function PlataformaHeroTemplatePage({
  template,
}: {
  template: PlataformaHeroTemplate;
}) {
  const isLight = template.id === "inmobiliaria-hero";
  const textClassName = "text-orvenix-text";
  const copyClassName = "text-orvenix-secondary";
  const pillClassName = isLight
    ? "mk-template-pill-light"
    : "mk-template-pill";

  return (
    <MarketingLayout>
      <section className={`min-h-[72vh] ${template.backgroundClassName}`}>
        <div className="mk-container flex min-h-[72vh] items-center py-20">
          <div className="max-w-3xl">
            {template.badge ? (
              <div
                className={`mb-5 inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${pillClassName}`}
              >
                {template.badge}
              </div>
            ) : (
              <div
                className={`mb-5 inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${pillClassName}`}
              >
                Plantilla Orvenix
              </div>
            )}

            <h1
              className={`text-5xl font-black leading-none tracking-tight md:text-7xl ${textClassName}`}
            >
              <span
                className={`bg-linear-to-r ${template.accentClassName} bg-clip-text text-transparent`}
              >
                {template.title}
              </span>
            </h1>

            <p className={`mt-6 max-w-2xl text-base leading-8 md:text-lg ${copyClassName}`}>
              {template.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${pillClassName}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href={template.ctaHref} className="mk-btn-primary">
                {template.ctaLabel} →
              </Link>
              {template.secondaryLabel && template.secondaryHref ? (
                <Link href={template.secondaryHref} className="mk-btn-outline">
                  {template.secondaryLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Quieres convertir esta plantilla en un sitio real?"
        description="Podemos asignarla a tu cuenta, personalizarla o tomarla como base para una web totalmente a medida."
        buttonLabel="Hablar con Orvenix →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
