'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { CtaSection } from '@/components/marketing/sections/CtaSection';

const servicios = [
  'Quiero activar un plan',
  'Quiero una landing que venda',
  'Quiero vender en línea',
  'Quiero mejorar mi sitio actual',
  'Necesito acompañamiento Pro',
  'Quiero más clientes',
  'Tengo dudas de qué plan elegir',
  'Otro',
];

const marketingSiteId = process.env.NEXT_PUBLIC_ORVENIX_MARKETING_SITE_ID ?? '';

export default function ContactoPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    servicio: '',
    mensaje: '',
    privacidad: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          servicio: form.servicio,
          mensaje: form.mensaje,
          ...(marketingSiteId ? { siteId: marketingSiteId } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSent(true);
      } else {
        setError(data.message ?? 'Error al enviar. Intenta de nuevo.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
            Contacto
          </p>
          <h1 className="mk-hero-title">
            Hablemos de tu{' '}
            <span className="mk-gradient-text">siguiente sitio</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-xl">
            Cuéntanos qué quieres vender, publicar o mejorar y te guiamos al plan correcto para empezar sin vueltas.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="mk-section">
        <div className="mk-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div className="mk-glass-card p-8">
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-orvenix-text mb-3">¡Recibimos tu solicitud!</h2>
                  <p className="text-orvenix-secondary">
                    Revisaremos tu caso y te responderemos con una ruta clara para activar tu sitio o elegir el plan ideal.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-orvenix-text mb-6">Dinos qué necesitas activar</h2>

                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-orvenix-secondary mb-1">
                      Nombre completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 rounded-lg bg-orvenix-surface border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-orvenix-secondary mb-1">
                      Correo electrónico <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      className="w-full px-4 py-3 rounded-lg bg-orvenix-surface border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-orvenix-secondary mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="+52 81 0000 0000"
                      className="w-full px-4 py-3 rounded-lg bg-orvenix-surface border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="servicio" className="block text-sm font-medium text-orvenix-secondary mb-1">
                      Qué quieres lograr
                    </label>
                    <select
                      id="servicio"
                      name="servicio"
                      value={form.servicio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-orvenix-surface border border-orvenix-border text-orvenix-text focus:outline-none focus:border-orvenix-accent transition-colors"
                    >
                      <option value="">Elige una opción</option>
                      {servicios.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mensaje" className="block text-sm font-medium text-orvenix-secondary mb-1">
                      Cuéntanos tu objetivo <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      required
                      rows={5}
                      value={form.mensaje}
                      onChange={handleChange}
                      placeholder="Ejemplo: quiero publicar mi sitio, vender productos, mejorar mi imagen o saber qué plan me conviene..."
                      className="w-full px-4 py-3 rounded-lg bg-orvenix-surface border border-orvenix-border text-orvenix-text placeholder:text-orvenix-muted focus:outline-none focus:border-orvenix-accent transition-colors resize-none"
                    />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacidad"
                      required
                      checked={form.privacidad}
                      onChange={handleChange}
                      className="mt-1 accent-orvenix-accent"
                    />
                    <span className="text-sm text-orvenix-secondary">
                      He leído y acepto la{' '}
                      <Link href="/legal/privacidad" className="mk-accent-text underline underline-offset-2">
                        Política de Privacidad
                      </Link>
                    </span>
                  </label>

                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mk-btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enviando…' : 'Quiero que me asesoren →'}
                  </button>
                </form>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-orvenix-text mb-6">Contacto directo Orvenix</h2>
              </div>

              <div className="mk-glass-card p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0">📧</span>
                  <div>
                    <p className="text-sm font-semibold text-orvenix-secondary mb-1">Correo principal</p>
                    <a href="mailto:contacto@orvenix.com.mx" className="mk-accent-text font-medium hover:underline">
                      contacto@orvenix.com.mx
                    </a>
                  </div>
                </div>

                <div className="mk-divider" />

                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0">💼</span>
                  <div>
                    <p className="text-sm font-semibold text-orvenix-secondary mb-1">Planes y activación</p>
                    <a href="mailto:contacto@orvenix.com.mx" className="mk-accent-text font-medium hover:underline">
                      contacto@orvenix.com.mx
                    </a>
                  </div>
                </div>

                <div className="mk-divider" />

                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0">💬</span>
                  <div>
                    <p className="text-sm font-semibold text-orvenix-secondary mb-1">WhatsApp</p>
                    <a
                      href="https://wa.me/528128985846"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mk-accent-text font-medium hover:underline"
                    >
                      +52 81 2898 5846
                    </a>
                  </div>
                </div>

                <div className="mk-divider" />

                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0">📍</span>
                  <div>
                    <p className="text-sm font-semibold text-orvenix-secondary mb-1">Ubicación</p>
                    <p className="text-orvenix-text">Monterrey, Nuevo León, México</p>
                  </div>
                </div>
              </div>

              <div className="mk-guarantee-banner">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-semibold text-orvenix-text">Te guiamos rápido</p>
                    <p className="text-sm text-orvenix-secondary">Respondemos con una ruta simple: plan recomendado, siguiente paso y forma de activación</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Quieres avanzar más rápido?"
        description="Escríbenos por WhatsApp y te ayudamos a elegir el plan correcto para publicar cuanto antes."
        buttonLabel="Hablar por WhatsApp →"
        buttonHref="https://wa.me/528128985846"
      />
    </MarketingLayout>
  );
}
