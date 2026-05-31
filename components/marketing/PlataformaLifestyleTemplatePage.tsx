import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { SectionHeader } from "@/components/marketing/sections/SectionHeader";
import { CtaSection } from "@/components/marketing/sections/CtaSection";
import type { PlataformaLifestyleTemplate } from "@/lib/plataformaLifestyleTemplates";

export function PlataformaLifestyleTemplatePage({
  template,
}: {
  template: PlataformaLifestyleTemplate;
}) {
  return (
    <MarketingLayout>
      <section className={`min-h-[72vh] ${template.backgroundClassName}`}>
        <div className="mk-container grid min-h-[72vh] items-center gap-12 py-20 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="mk-template-pill mb-5 inline-flex px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
              {template.badge}
            </div>
            <h1 className="text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
              {template.title} <span className="mk-gradient-text">{template.highlight}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-orvenix-secondary md:text-lg">
              {template.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href={template.primaryHref} className="mk-btn-primary">
                {template.primaryLabel} →
              </Link>
              <Link href={template.secondaryHref} className="mk-btn-outline">
                {template.secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="mk-glass-card p-6">
            <div className="mb-5 border-b border-white/8 pb-4">
              <div className="text-xs uppercase tracking-[0.18em] text-orvenix-muted">
                {template.showcaseTitle}
              </div>
              <div className="mt-2 text-sm leading-7 text-orvenix-secondary">
                {template.showcaseDescription}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {template.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="mk-template-metric rounded-2xl p-4"
                >
                  <div className="text-3xl font-black text-orvenix-text">{metric.value}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.16em] text-orvenix-muted">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Comercial"
            title={template.sectionTitle}
            description={template.sectionDescription}
            center
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {template.cards.map((card) => (
              <article key={card.title} className="mk-glass-card p-6">
                <h3 className="text-xl font-bold text-orvenix-text">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-orvenix-secondary">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaSection
        title={template.ctaTitle}
        description={template.ctaDescription}
        buttonLabel="Hablar con Orvenix →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
