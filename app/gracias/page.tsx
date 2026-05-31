import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

export const metadata: Metadata = {
  title: 'Gracias — Orvenix',
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <MarketingLayout>
      <section className="mk-section flex items-center justify-center min-h-[70vh]">
        <div className="mk-container text-center max-w-lg mx-auto">
          <div className="text-7xl mb-8">✅</div>
          <h1 className="text-4xl font-black text-orvenix-text mb-4">
            Gracias, ya lo tenemos
          </h1>
          <p className="text-orvenix-secondary text-lg leading-relaxed mb-10">
            Revisaremos tu proyecto y te responderemos en menos de 24 horas hábiles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="mk-btn-primary">
              Calcular otro presupuesto →
            </Link>
            <a
              href="https://wa.me/528128985846"
              target="_blank"
              rel="noopener noreferrer"
              className="mk-btn-outline"
            >
              Escribir por WhatsApp →
            </a>
            <Link href="/" className="mk-btn-outline">
              Volver al inicio →
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
