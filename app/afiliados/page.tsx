'use client';

import { useState } from 'react';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';
import { FaqAccordion } from '@/components/marketing/sections/FaqAccordion';

const tiers = [
  {
    name: 'Plan Básico',
    pct: '20%',
    monthly: '$69.80/mes',
    base: '$349/mes',
    label: null,
  },
  {
    name: 'Plan Pro',
    pct: '25%',
    monthly: '$174.75/mes',
    base: '$699/mes',
    label: 'Más rentable',
  },
  {
    name: 'Plan Empresa',
    pct: '30%',
    monthly: '$419.70/mes',
    base: '$1,399/mes',
    label: null,
  },
];

const highlights = [
  { value: 'Hasta 30%', label: 'Comisión recurrente' },
  { value: 'Mensual', label: 'Pago automático' },
  { value: 'Gratis', label: 'Sin costo de entrada' },
  { value: '24h', label: 'Activación' },
];

const steps = [
  { num: '1', title: 'Regístrate gratis', desc: 'Completa el formulario y recibe acceso a tu panel de afiliado con tu link personalizado.' },
  { num: '2', title: 'Comparte tu link', desc: 'Comparte tu enlace único con tu red de contactos, redes sociales, blog o cualquier canal.' },
  { num: '3', title: 'Cobra mensualmente', desc: 'Cada mes que tu referido mantenga su plan activo, recibes tu comisión automáticamente.' },
];

const profiles = [
  { icon: '💻', title: 'Diseñadores y desarrolladores', desc: 'Recomienda Orvenix a tus clientes y gana mientras ellos crecen.' },
  { icon: '📱', title: 'Creadores de contenido', desc: 'Monetiza tu audiencia recomendando una solución de alta calidad.' },
  { icon: '📊', title: 'Consultores de negocios', desc: 'Añade valor a tus clientes y genera ingresos pasivos recurrentes.' },
  { icon: '🌐', title: 'Profesionales con red de contactos', desc: 'Si conoces empresas que necesitan presencia digital, este programa es para ti.' },
];

const faqs = [
  {
    question: '¿Cuándo recibo mi primer pago?',
    answer: 'El primer pago se procesa 30 días después de que tu referido complete su primer mes activo.',
  },
  {
    question: '¿Qué pasa si mi referido cambia de plan?',
    answer: 'Tu comisión se ajusta automáticamente al nuevo plan. Siempre ganas sobre lo que paga tu referido.',
  },
  {
    question: '¿Hay un límite de referidos?',
    answer: 'No. Puedes referir a tantos clientes como quieras. No hay techo en tus ingresos.',
  },
  {
    question: '¿Qué pasa si mi referido cancela?',
    answer: 'La comisión aplica mientras el cliente esté activo. Si cancela, dejas de recibir esa comisión.',
  },
  {
    question: '¿Puedo ser afiliado y cliente al mismo tiempo?',
    answer: 'Sí. Muchos de nuestros mejores afiliados son también clientes que comparten su experiencia real.',
  },
];

const perfiles = [
  'Diseñador/Desarrollador',
  'Creador de contenido',
  'Consultor de negocios',
  'Otro profesional',
];

export default function AfiliadosPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    whatsapp: '',
    perfil: '',
    estrategia: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">
            <span className="mk-eyebrow-dot" />
            Programa de Afiliados
          </p>
          <h1 className="mk-hero-title">
            Recomienda Orvenix.{' '}
            <span className="mk-gradient-text">Gana cada mes.</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-xl">
            Gana comisiones recurrentes cada mes por cada cliente que refieras. Sin límite de ingresos, sin costo de entrada.
          </p>
        </div>
      </section>

      {/* Key stats */}
      <section className="py-12 mk-section-alt">
        <div className="mk-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {highlights.map((h) => (
              <div key={h.label} className="text-center">
                <div className="text-4xl font-black mk-gradient-text mb-2">{h.value}</div>
                <div className="text-sm text-orvenix-secondary">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission tiers */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="Comisiones"
            title={<>Elige tu <em className="not-italic mk-accent-text">nivel de ganancias</em></>}
            description="Tu comisión depende del plan que contrate tu referido. A mejor plan, mayor ingreso mensual."
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {tiers.map((t) => (
              <div key={t.name} className={`mk-glass-card p-8 text-center relative ${t.label ? 'border-orvenix-accent' : ''}`}>
                {t.label && (
                  <span className="mk-feature-tag absolute -top-3 left-1/2 -translate-x-1/2">{t.label}</span>
                )}
                <h3 className="font-bold text-orvenix-text mb-2">{t.name}</h3>
                <div className="text-5xl font-black mk-gradient-text my-4">{t.pct}</div>
                <p className="text-sm text-orvenix-muted mb-1">mensual por referido</p>
                <p className="text-2xl font-bold text-orvenix-text my-3">{t.monthly}</p>
                <p className="text-xs text-orvenix-muted">por referido en {t.base}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-step process */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="¿Cómo funciona?"
            title={<>3 pasos para <em className="not-italic mk-accent-text">empezar a ganar</em></>}
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {steps.map((s) => (
              <div key={s.num} className="mk-glass-card p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-orvenix-accent/20 border border-orvenix-accent/40 flex items-center justify-center mx-auto mb-4 text-xl font-black mk-accent-text">
                  {s.num}
                </div>
                <h3 className="font-bold text-orvenix-text mb-2">{s.title}</h3>
                <p className="text-sm text-orvenix-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target profiles */}
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            tag="¿Para quién?"
            title={<>Ideal para <em className="not-italic mk-accent-text">estos perfiles</em></>}
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
            {profiles.map((p) => (
              <div key={p.title} className="mk-glass-card p-6 flex gap-4">
                <span className="text-3xl shrink-0">{p.icon}</span>
                <div>
                  <h3 className="font-bold text-orvenix-text mb-1">{p.title}</h3>
                  <p className="text-sm text-orvenix-secondary leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration form */}
      <section className="mk-section mk-section-alt">
        <div className="mk-container max-w-xl mx-auto">
          <SectionHeader
            tag="Únete gratis"
            title={<>Solicita tu <em className="not-italic mk-accent-text">acceso</em></>}
            center
          />
          <div className="mk-glass-card p-8 mt-10">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-orvenix-text mb-2">¡Solicitud recibida!</h2>
                <p className="text-orvenix-secondary">Revisaremos tu solicitud y te contactaremos en menos de 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="af-nombre" className="block text-sm font-medium text-orvenix-secondary mb-1">Nombre completo</label>
                  <input
                    id="af-nombre"
                    name="nombre"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 rounded-lg bg-orvenix-bg border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="af-email" className="block text-sm font-medium text-orvenix-secondary mb-1">Correo electrónico</label>
                  <input
                    id="af-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-3 rounded-lg bg-orvenix-bg border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="af-whatsapp" className="block text-sm font-medium text-orvenix-secondary mb-1">WhatsApp</label>
                  <input
                    id="af-whatsapp"
                    name="whatsapp"
                    type="tel"
                    value={form.whatsapp}
                    onChange={handleChange}
                    placeholder="+52 81 0000 0000"
                    className="w-full px-4 py-3 rounded-lg bg-orvenix-bg border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="af-perfil" className="block text-sm font-medium text-orvenix-secondary mb-1">Tipo de perfil</label>
                  <select
                    id="af-perfil"
                    name="perfil"
                    value={form.perfil}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-orvenix-bg border border-orvenix-border text-orvenix-text focus:outline-none focus:border-orvenix-accent transition-colors"
                  >
                    <option value="">Selecciona tu perfil</option>
                    {perfiles.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="af-estrategia" className="block text-sm font-medium text-orvenix-secondary mb-1">¿Cómo planeas promocionar Orvenix?</label>
                  <textarea
                    id="af-estrategia"
                    name="estrategia"
                    rows={4}
                    value={form.estrategia}
                    onChange={handleChange}
                    placeholder="Cuéntanos tu estrategia de promoción..."
                    className="w-full px-4 py-3 rounded-lg bg-orvenix-bg border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors resize-none"
                  />
                </div>
                <button type="submit" className="mk-btn-primary w-full justify-center">
                  Quiero ser afiliado →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-section">
        <div className="mk-container max-w-3xl mx-auto">
          <SectionHeader
            tag="Preguntas frecuentes"
            title={<>Todo lo que necesitas <em className="not-italic mk-accent-text">saber</em></>}
            center
          />
          <div className="mt-10">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
