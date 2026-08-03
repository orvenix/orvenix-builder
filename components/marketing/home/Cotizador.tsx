import Link from 'next/link';
import { ArrowRight, CheckCircle2, Compass, FileText, Layers } from 'lucide-react';
import { formatUsd, officialPlans2026 } from '@/lib/orvenix-official-2026';
import { SectionHeader } from '../sections/SectionHeader';

const guideCards = [
  {
    planId: 'starter',
    icon: Compass,
    eyebrow: 'Presencia inicial',
    title: 'Necesito verme profesional rapido',
    signal: 'Sitio institucional, pocas secciones y mantenimiento administrado.',
    outcome: 'Empieza con Starter',
  },
  {
    planId: 'pro',
    icon: Layers,
    eyebrow: 'Crecimiento comercial',
    title: 'Quiero vender, captar leads y usar IA',
    signal: 'Tienda, CRM, blog, SEO, exportacion y varios sitios.',
    outcome: 'Revisa Pro',
    featured: true,
  },
  {
    planId: 'business',
    icon: FileText,
    eyebrow: 'Operacion avanzada',
    title: 'Tengo funnels, automatizaciones o varios negocios',
    signal: 'Sitios ilimitados, soporte omnicanal y flujos comerciales mas robustos.',
    outcome: 'Compara Business',
  },
] as const;

function getPlan(planId: string) {
  return officialPlans2026.find((plan) => plan.id === planId);
}

function fromPrice(planId: string) {
  const plan = getPlan(planId);
  if (!plan || plan.monthlyUsd === null) return 'Cotizacion';
  return 'Desde ' + formatUsd(plan.monthlyUsd) + '/mes';
}

export function Cotizador() {
  return (
    <section id="cotizador" className="py-0 pb-24">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orvenix-accent" />
              <span className="text-xs font-medium text-orvenix-secondary">Guia rapida de eleccion</span>
            </div>
            <SectionHeader
              title={<>Encuentra tu ruta<br /><span className="mk-gradient-text">antes de comparar precios</span></>}
              description="Inicio te ayuda a reconocer tu escenario. La pagina de precios queda como el lugar para comparar condiciones y tomar la decision final."
              center
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {guideCards.map((card) => {
              const Icon = card.icon;
              const featured = 'featured' in card && card.featured;
              return (
                <article
                  key={card.planId}
                  className="relative flex min-h-[320px] flex-col overflow-hidden rounded-[24px] border p-5 shadow-[var(--shadow-lg)] transition duration-200 hover:-translate-y-1"
                  style={{
                    background: featured ? 'rgba(0,181,246,0.09)' : 'var(--glass)',
                    borderColor: featured ? 'rgba(0,181,246,0.35)' : 'var(--glass-border)',
                  }}
                >
                  {featured && (
                    <div className="absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: 'rgba(0,181,246,0.16)', color: 'var(--accent)' }}>
                      Mas elegido
                    </div>
                  )}

                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'rgba(0,181,246,0.12)', color: 'var(--accent)' }}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>{card.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-black leading-tight" style={{ color: 'var(--text)' }}>{card.title}</h3>
                  <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>{card.signal}</p>

                  <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: 'var(--glass-border)', background: 'rgba(255,255,255,0.035)' }}>
                    <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--accent)' }}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      {card.outcome}
                    </div>
                    <p className="mt-2 text-sm font-black" style={{ color: 'var(--text)' }}>{fromPrice(card.planId)}</p>
                  </div>

                  <Link
                    href="/precios#planes"
                    className="mt-auto inline-flex items-center justify-between gap-3 pt-5 text-sm font-black transition hover:text-orvenix-accent"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Ver detalles del plan
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="mt-5 rounded-[24px] border p-5 text-center" style={{ background: 'rgba(0,181,246,0.06)', borderColor: 'rgba(0,181,246,0.20)' }}>
            <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              Enterprise, compra definitiva, migraciones e integraciones se revisan por alcance. Si quieres ver condiciones completas y activar un plan, continua en precios.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/precios#planes" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition hover:-translate-y-0.5" style={{ background: 'var(--accent-gradient)', color: '#fff' }}>
                Comparar planes
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/contacto" className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>
                Hablar con ventas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
