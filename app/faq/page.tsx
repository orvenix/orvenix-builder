import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { CtaSection } from '@/components/marketing/sections/CtaSection';
import { FaqAccordion } from '@/components/marketing/sections/FaqAccordion';

export const metadata: Metadata = {
  title: 'FAQ — Orvenix | Preguntas Frecuentes',
  description: 'Resolvemos las dudas más comunes sobre nuestros servicios y proceso de trabajo.',
};

const faqs = [
  {
    question: '¿Cuánto tiempo tarda el desarrollo de un sitio web?',
    answer: 'Una landing page puede estar lista en 1 a 2 semanas, un sitio corporativo en 3 a 6 semanas y proyectos más complejos en 6 a 16 semanas.',
  },
  {
    question: '¿Qué incluye el soporte post-lanzamiento?',
    answer: 'Incluye corrección de bugs, ajustes menores, monitoreo, actualización de dependencias y asesoría técnica. También ofrecemos planes de mantenimiento continuo.',
  },
  {
    question: '¿Trabajan con clientes fuera de México?',
    answer: 'Sí. Trabajamos de forma remota con clientes en toda Latinoamérica, España y Estados Unidos. El proceso es 100% digital.',
  },
  {
    question: '¿Podré editar mi sitio yo mismo?',
    answer: 'Sí. Los planes Pro y Empresa incluyen un CMS intuitivo con el que podrás actualizar textos, imágenes y secciones sin conocimientos técnicos. Incluimos capacitación.',
  },
  {
    question: '¿Cómo es el proceso de pago?',
    answer: 'Trabajamos con tres hitos: 40% al inicio del proyecto, 40% al aprobar el diseño y 20% al entregar el sitio terminado. También ofrecemos calendarios personalizados.',
  },
  {
    question: '¿El sitio será rápido y optimizado para Google?',
    answer: 'Sí. Optimizamos para obtener puntuaciones superiores a 90 en Lighthouse. El SEO técnico y la velocidad de carga son parte del proceso desde el día uno.',
  },
  {
    question: '¿El dominio y hosting quedan a mi nombre?',
    answer: 'El dominio siempre queda registrado a tu nombre. Te recomendamos mantener el control de tu activo digital.',
  },
  {
    question: '¿Qué pasa si no tengo textos ni fotos?',
    answer: 'Te ayudamos a estructurar el contenido, redactar textos y definir las secciones clave. El diseño parte de tu identidad y objetivos de negocio.',
  },
  {
    question: '¿Puedo pedir cambios después del lanzamiento?',
    answer: 'Sí. Ofrecemos soporte post-lanzamiento y planes de mantenimiento mensual que incluyen actualizaciones, mejoras y soporte técnico continuo.',
  },
  {
    question: '¿Puedo pagar por etapas?',
    answer: 'Sí. El esquema estándar es en 3 etapas, pero podemos acordar un calendario de pagos adaptado a tus necesidades.',
  },
];

export default function FaqPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mk-hero min-h-[45vh] flex flex-col justify-center">
        <div className="mk-hero-glow mk-hero-glow-1" />
        <div className="mk-hero-glow mk-hero-glow-2" />
        <div className="mk-container relative z-10 text-center">
          <p className="mk-section-tag justify-center mb-4">
            <span className="mk-eyebrow-dot" />
            Soporte
          </p>
          <h1 className="mk-hero-title">
            Preguntas{' '}
            <span className="mk-gradient-text">frecuentes</span>
          </h1>
          <p className="mk-section-desc mx-auto mt-6 max-w-xl">
            Resolvemos las dudas más comunes sobre nuestros servicios, procesos y condiciones de trabajo.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-section">
        <div className="mk-container max-w-3xl mx-auto">
          <FaqAccordion items={faqs} />
        </div>
      </section>

      {/* Still have questions */}
      <section className="mk-section-alt py-16">
        <div className="mk-container text-center">
          <h2 className="text-2xl font-bold text-orvenix-text mb-4">¿No encontraste tu respuesta?</h2>
          <p className="text-orvenix-secondary mb-8 max-w-md mx-auto">
            Escríbenos directamente y te respondemos en menos de 24 horas hábiles.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contacto" className="mk-btn-primary">
              Enviar pregunta →
            </Link>
            <a
              href="https://wa.me/528128985846"
              target="_blank"
              rel="noopener noreferrer"
              className="mk-btn-outline"
            >
              WhatsApp directo
            </a>
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Listo para empezar tu proyecto?"
        description="Contáctanos hoy y recibe una propuesta personalizada sin costo."
        buttonLabel="Iniciar proyecto →"
        buttonHref="/contacto"
      />
    </MarketingLayout>
  );
}
