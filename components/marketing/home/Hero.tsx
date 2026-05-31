'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function useCountUp(target: number, suffix: string, inView: boolean) {
  const [value, setValue] = useState('0' + suffix);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const step = () => {
      current += increment;
      if (current < target) {
        setValue(Math.ceil(current) + suffix);
        requestAnimationFrame(step);
      } else {
        setValue(target + suffix);
      }
    };
    requestAnimationFrame(step);
  }, [inView, target, suffix]);

  return value;
}

function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const value = useCountUp(target, suffix, inView);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div className="mk-stat-num">{value}</div>
      <div className="text-sm text-orvenix-muted">{label}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mk-hero" aria-label="Portada">
      <div className="mk-hero-glow mk-hero-glow-1" aria-hidden="true" />
      <div className="mk-hero-glow mk-hero-glow-2" aria-hidden="true" />

      <div className="mk-container relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left column */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="mk-eyebrow-dot" aria-hidden="true" />
              <span className="text-sm font-medium text-orvenix-secondary">
                Plataforma SaaS · Activa ahora mismo
              </span>
            </div>

            <h1 className="mk-hero-title mb-5 text-orvenix-text">
              Tu negocio digital,{' '}
              <span className="mk-gradient-text">todo en un panel</span>
            </h1>

            <p className="text-base leading-relaxed mb-8 max-w-lg text-orvenix-secondary">
              Web profesional + panel privado + gestión de clientes + almacenamiento en la nube.
              Todo incluido, sin instalar nada, activo en menos de 24 horas.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/precios" className="mk-btn-primary">Ver planes desde $349/mes ↗</Link>
              <Link href="/webs" className="mk-btn-outline">Ver demos en vivo</Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 mk-divider">
              <StatItem target={150} suffix="+" label="Proyectos completados" />
              <StatItem target={99} suffix=".9%" label="Uptime garantizado" />
              <StatItem target={24} suffix="h" label="Tiempo de activación" />
            </div>
          </div>

          {/* Right column — code card */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="mk-float-badge mk-float-badge-tl">
              <span>🔐</span> Panel 100% privado
            </div>

            <div className="mk-code-card w-full max-w-md" role="img" aria-label="Vista del panel de control Orvenix">
              <div className="mk-code-bar">
                <span className="w-3 h-3 rounded-full bg-orvenix-accent-3/80" />
                <span className="w-3 h-3 rounded-full bg-orvenix-accent-2/75" />
                <span className="w-3 h-3 rounded-full bg-orvenix-accent/80" />
                <span className="ml-2 text-orvenix-muted font-mono text-xs">panel.tuempresa.com</span>
              </div>
              <div className="p-5 font-mono text-sm leading-7">
                <p><span className="mk-c-purple">const</span> <span className="mk-c-blue">panel</span> = <span className="mk-c-yellow">await</span> <span className="mk-c-cyan">Orvenix</span>.<span className="mk-c-blue">init</span>{'({'}</p>
                <p className="pl-4"><span className="mk-c-cyan">empresa</span>: <span className="mk-c-green">&apos;Tu Negocio&apos;</span>,</p>
                <p className="pl-4"><span className="mk-c-cyan">dominio</span>: <span className="mk-c-green">&apos;panel.tuempresa.com&apos;</span>,</p>
                <p className="pl-4"><span className="mk-c-cyan">plan</span>: <span className="mk-c-green">&apos;pro&apos;</span>,</p>
                <p className="pl-4"><span className="mk-c-cyan">almacenamiento</span>: <span className="mk-c-orange">100</span>, <span className="mk-c-gray">{/* GB */}GB</span></p>
                <p className="pl-4"><span className="mk-c-cyan">clientes</span>: <span className="mk-c-green">&apos;ilimitados&apos;</span>,</p>
                <p>{'}'+')'}</p>
                <p>&nbsp;</p>
                <p className="mk-c-gray animate-pulse">{'// ✦ Panel activo en menos de 24h'}</p>
                <p><span className="mk-c-purple">console</span>.<span className="mk-c-blue">log</span>(<span className="mk-c-green">&apos;¡Bienvenido a Orvenix!&apos;</span>)</p>
              </div>
            </div>

            <div className="mk-float-badge mk-float-badge-br">
              <span>⚡</span> Activo en 24h
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
