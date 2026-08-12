import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  BRAND,
  ABOUT_HEADER,
  ABOUT_MISSION_VISION,
  STATS,
  VALUES_INTRO,
  VALUES,
  CTA_ABOUT,
  NAVBAR,
} from "@/lib/content";

export const metadata: Metadata = {
  title: `Nosotros — ${BRAND.name}`,
  description: ABOUT_HEADER.intro,
};

export default function NosotrosPage() {
  return (
    <>
      <Navbar />

      {/* Encabezado */}
      <section className="relative grid-bg">
        <div className="absolute -top-24 -right-24 w-96 h-96 blob-teal rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20 relative">
          <p className="pill inline-block px-3.5 py-1.5 rounded-full mb-6">{ABOUT_HEADER.eyebrow}</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.15] font-semibold tracking-tight mb-6">
            {ABOUT_HEADER.title}
          </h1>
          <p className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl">{ABOUT_HEADER.intro}</p>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="card rounded-2xl p-6 text-center">
              <p className="font-display text-3xl sm:text-4xl font-semibold mb-1" style={{ color: "var(--coral)" }}>
                {stat.value}
              </p>
              <p className="text-xs text-faint">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Misión y visión */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card rounded-2xl p-8">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "var(--coral-tint)" }}
            >
              <Target size={19} color="var(--coral)" />
            </span>
            <h2 className="font-display text-xl font-semibold mb-3">{ABOUT_MISSION_VISION.missionTitle}</h2>
            <p className="text-sm text-muted leading-relaxed">{ABOUT_MISSION_VISION.mission}</p>
          </div>

          <div className="card rounded-2xl p-8">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "var(--teal-tint)" }}
            >
              <Eye size={19} color="var(--teal)" />
            </span>
            <h2 className="font-display text-xl font-semibold mb-3">{ABOUT_MISSION_VISION.visionTitle}</h2>
            <p className="text-sm text-muted leading-relaxed">{ABOUT_MISSION_VISION.vision}</p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="px-5 sm:px-8 py-20 sm:py-28" style={{ background: "var(--paper-alt)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="pill inline-block px-3.5 py-1.5 rounded-full mb-4">{VALUES_INTRO.eyebrow}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">{VALUES_INTRO.title}</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {VALUES.map((value, i) => (
              <div key={value.title} className="feature-card card rounded-2xl p-6">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-4"
                  style={{ background: "var(--surface)", border: "1.5px solid var(--border-strong)", color: "var(--ink-muted)" }}
                >
                  {i + 1}
                </span>
                <h3 className="font-display text-base font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="card rounded-3xl px-8 py-14 sm:py-16 text-center relative overflow-hidden">
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 blob-teal rounded-full pointer-events-none" />
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-4 relative">{CTA_ABOUT.title}</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto relative">{CTA_ABOUT.subtitle}</p>
          <Link href={NAVBAR.loginHref} className="btn-primary px-7 py-3.5 rounded-full text-sm inline-flex items-center gap-2 relative">
            {CTA_ABOUT.buttonLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
