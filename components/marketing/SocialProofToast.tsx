'use client';

import { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  'Alguien en Monterrey activó el Plan Pro',
  'Nueva auditoría SEO solicitada en CDMX',
  'Proyecto E-commerce iniciado hace 2h',
  '5 usuarios nuevos en la Plataforma hoy',
  'Alguien descargó la guía de SaaS rentable',
  'Cliente en Guadalajara lanzó su tienda online',
  'Plan Empresa activado en Tijuana',
  'Nuevo sitio publicado en menos de 24h',
  'Integración con Stripe completada por un cliente',
  'Equipo de 8 personas accedió al panel hoy',
];

export function SocialProofToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const show = () => {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setMessage(msg);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setMessage(null), 500);
      }, 5000);
    };

    const first = setTimeout(() => {
      show();
      intervalRef.current = setInterval(
        show,
        Math.floor(Math.random() * 20_000) + 20_000
      );
    }, 8_000);

    return () => {
      clearTimeout(first);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div className={`social-proof-toast${visible ? ' social-proof-toast--show' : ''}`} role="status" aria-live="polite">
      <span className="social-proof-toast__dot" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
