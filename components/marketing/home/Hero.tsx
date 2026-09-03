'use client';

import Link from 'next/link';
import { ArrowRight, CreditCard, LayoutTemplate, ShieldCheck, Sparkles } from 'lucide-react';
import { OrvenixBuilderShowcase } from '@/components/marketing/home/OrvenixBuilderShowcase';

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="home-hero-stat">
      <div className="mk-stat-num">{value}</div>
      <div className="text-sm text-orvenix-muted">{label}</div>
    </div>
  );
}

const trustItems = [
  { icon: ShieldCheck, label: 'Hosting, SSL y soporte incluidos' },
  { icon: LayoutTemplate, label: 'Templates reales por industria' },
  { icon: CreditCard, label: 'Planes claros desde 15 USD/mes + IVA' },
];

const activationSteps = [
  'Elige tu plan',
  'Genera tu sitio',
  'Edita lo basico',
  'Publica con confianza',
];

export function Hero() {
  return (
    <section className="mk-hero home-hero" aria-label="Portada Orvenix">
      <div className="mk-hero-glow mk-hero-glow-1" aria-hidden="true" />
      <div className="mk-hero-glow mk-hero-glow-2" aria-hidden="true" />
      <div className="home-hero-orbit home-hero-orbit-1" aria-hidden="true" />
      <div className="home-hero-orbit home-hero-orbit-2" aria-hidden="true" />

      <div className="mk-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:gap-12">
          <div className="home-hero-copy">
            <div className="home-hero-pill mb-5">
              <span className="mk-eyebrow-dot" aria-hidden="true" />
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Super Builder + IA para lanzar mas rapido</span>
            </div>

            <h1 className="mk-hero-title mb-5 text-orvenix-text">
              Vende con un sitio premium
              <span className="block">que puedes editar</span>
              <span className="mk-gradient-text block">sin depender de nadie</span>
            </h1>

            <p className="home-hero-lead mb-7 max-w-xl text-orvenix-secondary">
              Orvenix combina sitio profesional, editor visual, templates por industria, pagos y panel privado para que tu negocio se vea listo para comprar desde el primer clic.
            </p>

            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/precios" className="mk-btn-primary home-hero-cta-primary">
                Comenzar ahora
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/webs" className="mk-btn-outline home-hero-cta-secondary">
                Ver demostración
              </Link>
            </div>

            <p className="home-hero-proof mb-8">Sin código · Hosting incluido · Publica cuando quieras</p>

            <div className="home-hero-trust-grid mb-8">
              {trustItems.map(({ icon: Icon, label }) => (
                <div key={label} className="home-hero-trust-item">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="home-hero-activation mb-9" aria-label="Ruta de activacion">
              {activationSteps.map((step, index) => (
                <div key={step} className="home-hero-step">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 mk-divider">
              <StatItem value="150+" label="Proyectos completados" />
              <StatItem value="99.9%" label="Uptime objetivo" />
              <StatItem value="24h" label="Activacion guiada" />
            </div>
          </div>

          <div className="home-hero-showcase relative flex justify-center lg:justify-end">
            <OrvenixBuilderShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
