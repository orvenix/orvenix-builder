import Link from "next/link";
import { ArrowRight, Check, Sparkles, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlockCanvasMockup from "@/components/BlockCanvasMockup";
import FaqAccordion from "@/components/FaqAccordion";
import FeatureIcon from "@/components/FeatureIcon";
import {
  HERO,
  FEATURES,
  FEATURES_INTRO,
  PRICING,
  PRICING_INTRO,
  PRICING_BADGE_LABEL,
  TESTIMONIALS,
  TESTIMONIALS_INTRO,
  FAQ_INTRO,
  CTA_HOME,
  NAVBAR,
} from "@/lib/content";

const ICON_TONES = ["var(--coral)", "var(--teal)", "var(--amber)"];
const ICON_BG = ["var(--coral-tint)", "var(--teal-tint)", "var(--amber-tint)"];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section id="producto" className="relative grid-bg">
        <div className="absolute -top-24 -left-24 w-96 h-96 blob-coral rounded-full pointer-events-none" />
        <div className="absolute top-40 -right-24 w-96 h-96 blob-teal rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-14 items-center relative">
          <div>
            <span className="pill inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full mb-6">
              <Sparkles size={13} />
              {HERO.eyebrow}
            </span>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.3rem] leading-[1.12] font-semibold tracking-tight mb-6">
              {HERO.title}
            </h1>

            <p className="text-muted text-base sm:text-lg leading-relaxed mb-8 max-w-xl">{HERO.subtitle}</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link href="#precios" className="btn-primary px-6 py-3.5 rounded-full text-sm inline-flex items-center justify-center gap-2">
                {HERO.ctaPrimary}
                <ArrowRight size={16} />
              </Link>
              <Link href="#producto" className="btn-secondary px-6 py-3.5 rounded-full text-sm inline-flex items-center justify-center">
                {HERO.ctaSecondary}
              </Link>
            </div>
            <p className="text-xs text-faint">{HERO.note}</p>
          </div>

          <BlockCanvasMockup />
        </div>
      </section>

      {/* Características */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mb-14">
          <p className="pill inline-block px-3.5 py-1.5 rounded-full mb-4">{FEATURES_INTRO.eyebrow}</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4">{FEATURES_INTRO.title}</h2>
          <p className="text-muted leading-relaxed">{FEATURES_INTRO.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feature-card card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: ICON_BG[i % ICON_BG.length] }}
                >
                  <FeatureIcon name={f.iconName} size={19} color={ICON_TONES[i % ICON_TONES.length]} />
                </span>
                <span className="text-[11px] font-semibold text-faint uppercase tracking-wide">{f.tag}</span>
              </div>
              <h3 className="font-display text-base font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="px-5 sm:px-8 py-20 sm:py-28" style={{ background: "var(--paper-alt)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <p className="pill inline-block px-3.5 py-1.5 rounded-full mb-4">{PRICING_INTRO.eyebrow}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4">{PRICING_INTRO.title}</h2>
            <p className="text-muted leading-relaxed">{PRICING_INTRO.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`price-card card rounded-2xl p-6 flex flex-col ${plan.highlight ? "highlight" : ""}`}
              >
                {plan.highlight && (
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full self-start mb-4"
                    style={{ background: "var(--coral)", color: "#fff8f5" }}
                  >
                    {PRICING_BADGE_LABEL.toUpperCase()}
                  </span>
                )}
                <h3 className="font-display text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted mb-5">{plan.description}</p>

                <div className="mb-6">
                  <span className="font-display text-3xl font-semibold">{plan.price}</span>
                  <span className="text-xs text-faint ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-muted">
                      <Check size={14} color="var(--teal)" className="mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href={NAVBAR.loginHref}
                  className={`text-sm px-4 py-3 rounded-full text-center ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="clientes" className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-2xl mb-14">
          <p className="pill inline-block px-3.5 py-1.5 rounded-full mb-4">{TESTIMONIALS_INTRO.eyebrow}</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{TESTIMONIALS_INTRO.title}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card rounded-2xl p-6 flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} color="var(--amber)" fill="var(--amber)" />
                ))}
              </div>
              <p className="text-sm text-muted leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-faint">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="px-5 sm:px-8 py-20 sm:py-28" style={{ background: "var(--paper-alt)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="pill inline-block px-3.5 py-1.5 rounded-full mb-4">{FAQ_INTRO.eyebrow}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{FAQ_INTRO.title}</h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="card rounded-3xl px-8 py-14 sm:py-16 text-center relative overflow-hidden">
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 blob-coral rounded-full pointer-events-none" />
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4 relative">{CTA_HOME.title}</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto relative">{CTA_HOME.subtitle}</p>
          <Link href={NAVBAR.loginHref} className="btn-primary px-7 py-3.5 rounded-full text-sm inline-flex items-center gap-2 relative">
            {CTA_HOME.buttonLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
