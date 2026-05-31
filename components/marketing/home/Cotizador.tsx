'use client';

import { useState } from 'react';
import { SectionHeader } from '../sections/SectionHeader';

type ProjectType = 'landing' | 'corporate' | 'ecommerce' | 'webapp' | null;
type TimeMultiplier = 1.2 | 1.0 | 0.9 | null;

const TYPE_DATA: Record<string, { label: string; min: number; max: number }> = {
  landing:   { label: 'Landing Page',    min: 7000,  max: 12000  },
  corporate: { label: 'Web Corporativa', min: 15000, max: 28000  },
  ecommerce: { label: 'Tienda en Línea', min: 25000, max: 55000  },
  webapp:    { label: 'App / Sistema',   min: 45000, max: 120000 },
};

const FEATURES_DATA = [
  { key: 'blog',          icon: '📝', label: 'Blog / Noticias',     add: 2000 },
  { key: 'pagos',         icon: '💳', label: 'Pasarela de pagos',   add: 3500 },
  { key: 'crm',           icon: '👥', label: 'CRM / Clientes',      add: 4000 },
  { key: 'galeria',       icon: '🖼️', label: 'Galería / Portafolio', add: 1500 },
  { key: 'seo',           icon: '🔍', label: 'SEO avanzado',        add: 2500 },
  { key: 'multilenguaje', icon: '🌐', label: 'Multilenguaje',       add: 3000 },
];

const TIMES = [
  { key: 'urgente',  icon: '⚡', name: 'Urgente',  desc: 'En menos de 2 semanas', mult: 1.2,  tag: '+20%',            tagColor: 'var(--accent-3)' },
  { key: 'normal',   icon: '📅', name: 'Normal',   desc: '3 a 6 semanas',         mult: 1.0,  tag: 'Precio estándar', tagColor: 'var(--text-secondary)' },
  { key: 'flexible', icon: '🗓️', name: 'Flexible', desc: 'Más de 2 meses',        mult: 0.9,  tag: '-10% descuento',  tagColor: 'var(--accent)' },
] as const;

const fmt = (n: number) => '$' + n.toLocaleString('es-MX');

export function Cotizador() {
  const [step, setStep] = useState<1 | 2 | 3 | 'result'>(1);
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [timeMult, setTimeMult] = useState<TimeMultiplier>(null);
  const [timeLabel, setTimeLabel] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const extras = FEATURES_DATA.filter(f => selectedFeatures.has(f.key)).reduce((a, f) => a + f.add, 0);
  const typeData = projectType ? TYPE_DATA[projectType] : null;

  const rawMin = typeData && timeMult
    ? Math.round((typeData.min + extras) * timeMult / 500) * 500
    : 0;
  const rawMax = typeData && timeMult
    ? Math.round((typeData.max + extras) * timeMult / 500) * 500
    : 0;

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const reset = () => {
    setStep(1);
    setProjectType(null);
    setSelectedFeatures(new Set());
    setTimeMult(null);
    setTimeLabel('');
    setEmail('');
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubmitted(true);
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: '24px',
    padding: 'clamp(1.75rem, 5vw, 2.75rem)',
    boxShadow: 'var(--shadow-lg)',
  };

  const btnBase = 'cursor-pointer rounded-xl p-4 text-left transition-all duration-200 border font-sans flex flex-col gap-1';
  const btnStyle = (selected: boolean): React.CSSProperties => ({
    background: selected ? 'rgba(0,181,246,0.08)' : 'rgba(255,255,255,0.02)',
    borderColor: selected ? 'var(--accent)' : 'var(--glass-border)',
    boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
    transform: selected ? 'none' : undefined,
  });

  return (
    <section id="cotizador" className="py-0 pb-24">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="max-w-[780px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orvenix-accent animate-pulse" />
              <span className="text-xs font-medium text-orvenix-secondary">Calculadora de precios instantánea</span>
            </div>
            <SectionHeader
              title={<>¿Cuánto cuesta<br /><span style={{ backgroundImage: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>tu proyecto?</span></>}
              description="Responde 3 preguntas y obtén un estimado real en segundos."
              center
            />
          </div>

          {/* Step bar */}
          <div className="flex items-center justify-center mb-6" aria-label="Progreso del cotizador">
            {[1, 2, 3].map((n, i) => (
              <div key={n} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: step === n ? 'var(--accent)' : (typeof step === 'number' ? step > n : true) ? 'var(--accent-2)' : 'rgba(255,255,255,0.08)',
                      color: (step === n || (typeof step === 'number' && step > n) || step === 'result') ? (step === n ? 'var(--bg)' : '#fff') : 'var(--text-muted)',
                    }}
                  >
                    {n}
                  </div>
                  <span
                    className="hidden sm:block text-xs whitespace-nowrap transition-colors duration-300"
                    style={{ color: step === n ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    {['Tipo de proyecto', 'Funciones', 'Tiempo'][n - 1]}
                  </span>
                </div>
                {i < 2 && (
                  <div className="w-8 sm:w-16 h-px mx-2 sm:mx-3" style={{ background: 'var(--glass-border)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div style={cardStyle}>

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <h3 className="text-lg font-extrabold mb-4" style={{ color: 'var(--text)' }}>¿Qué tipo de sitio necesitas?</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { key: 'landing',   icon: '🚀', name: 'Landing Page',    desc: 'Página única de alto impacto',   price: 'desde $7,000'   },
                    { key: 'corporate', icon: '🏢', name: 'Web Corporativa', desc: 'Sitio completo con secciones',   price: 'desde $15,000'  },
                    { key: 'ecommerce', icon: '🛒', name: 'Tienda en Línea', desc: 'Catálogo, carrito y pagos',      price: 'desde $25,000'  },
                    { key: 'webapp',    icon: '⚙️', name: 'App / Sistema',   desc: 'Plataforma web a medida',        price: 'desde $45,000'  },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setProjectType(t.key as ProjectType)}
                      className={btnBase}
                      style={btnStyle(projectType === t.key)}
                    >
                      <span className="text-2xl mb-1">{t.icon}</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{t.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.desc}</span>
                      <span className="text-xs font-bold mt-1" style={{ color: 'var(--accent)' }}>{t.price}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!projectType}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--accent-gradient)', color: '#fff' }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <h3 className="text-lg font-extrabold mb-1" style={{ color: 'var(--text)' }}>¿Qué funciones necesitas?</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Selecciona todo lo que aplique</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {FEATURES_DATA.map(f => (
                    <button
                      key={f.key}
                      onClick={() => toggleFeature(f.key)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all duration-200 border"
                      style={{
                        background: selectedFeatures.has(f.key) ? 'rgba(0,181,246,0.08)' : 'rgba(255,255,255,0.02)',
                        borderColor: selectedFeatures.has(f.key) ? 'var(--accent)' : 'var(--glass-border)',
                        color: selectedFeatures.has(f.key) ? 'var(--text)' : 'var(--text-muted)',
                      }}
                    >
                      <span>{f.icon}</span>
                      <span className="flex-1">{f.label}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--accent)' }}>+${f.add.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(1)} className="text-sm px-4 py-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>← Atrás</button>
                  <button onClick={() => setStep(3)} className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200" style={{ background: 'var(--accent-gradient)', color: '#fff' }}>Siguiente →</button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <h3 className="text-lg font-extrabold mb-4" style={{ color: 'var(--text)' }}>¿Para cuándo lo necesitas?</h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {TIMES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => { setTimeMult(t.mult as TimeMultiplier); setTimeLabel(t.name); }}
                      className={`${btnBase} items-center text-center`}
                      style={btnStyle(timeMult === t.mult)}
                    >
                      <span className="text-2xl mb-1 mx-auto">{t.icon}</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{t.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.desc}</span>
                      <span className="text-xs font-bold mt-1" style={{ color: t.tagColor }}>{t.tag}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(2)} className="text-sm px-4 py-2 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>← Atrás</button>
                  <button
                    onClick={() => setStep('result')}
                    disabled={!timeMult}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--accent-gradient)', color: '#fff' }}
                  >
                    Ver mi estimado →
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {step === 'result' && (
              <div className="text-center">
                <div
                  className="inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4"
                  style={{ background: 'rgba(0,181,246,0.1)', border: '1px solid rgba(0,181,246,0.2)', color: 'var(--accent)' }}
                >
                  ✓ Tu estimado está listo
                </div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                  {typeData?.label}{timeLabel ? ` · Entrega: ${timeLabel}` : ''}
                </p>
                <div className="mb-4">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Estimado:</p>
                  <p
                    className="font-black leading-none"
                    style={{ fontSize: 'clamp(2.2rem,5vw,3rem)', color: 'var(--accent)', letterSpacing: '-0.04em' }}
                  >
                    {fmt(rawMin)} – {fmt(rawMax)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>MXN (precio final en cotización formal)</p>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {[typeData?.label, ...FEATURES_DATA.filter(f => selectedFeatures.has(f.key)).map(f => f.label)].filter(Boolean).map(lbl => (
                    <span
                      key={lbl}
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: 'rgba(0,181,246,0.08)', border: '1px solid rgba(0,181,246,0.15)', color: 'var(--accent)' }}
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
                {!submitted ? (
                  <>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Déjanos tu correo y te enviamos la cotización detallada en menos de 2 horas.</p>
                    <div className="flex gap-2 max-w-sm mx-auto mb-4">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors duration-200"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--text)',
                        }}
                        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)'; }}
                      />
                      <button
                        onClick={handleSubmit}
                        className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200"
                        style={{ background: 'var(--accent-gradient)', color: '#fff' }}
                      >
                        Recibir →
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-semibold mb-4 mk-accent-text">🎉 ¡Listo! Te contactaremos muy pronto.</p>
                )}
                <div className="flex gap-4 justify-center flex-wrap">
                  <a href="/contacto" className="text-sm transition-colors duration-200 hover:text-orvenix-accent" style={{ color: 'var(--text-muted)' }}>📋 Formulario completo</a>
                  <a href="https://wa.me/528128985846" target="_blank" rel="noopener" className="text-sm transition-colors duration-200 hover:text-orvenix-accent" style={{ color: 'var(--text-muted)' }}>💬 WhatsApp directo</a>
                  <button onClick={reset} className="text-sm transition-colors duration-200 hover:text-orvenix-accent" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>↺ Recalcular</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
