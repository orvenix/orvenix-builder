import type { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { Hero } from '@/components/marketing/home/Hero';
import { Cotizador } from '@/components/marketing/home/Cotizador';
import { PlatPromoBanner } from '@/components/marketing/home/PlatPromoBanner';
import { Features } from '@/components/marketing/home/Features';
import { HowToStart } from '@/components/marketing/home/HowToStart';
import { Portfolio } from '@/components/marketing/home/Portfolio';
import { Testimonials } from '@/components/marketing/home/Testimonials';
import { FaqAccordion } from '@/components/marketing/sections/FaqAccordion';
import { CtaSection } from '@/components/marketing/sections/CtaSection';
import { SectionHeader } from '@/components/marketing/sections/SectionHeader';

export const metadata: Metadata = {
  title: 'Orvenix — Plataforma SaaS para tu Negocio Digital',
  description: 'Orvenix — Plataforma SaaS todo-en-uno para negocios digitales. Web profesional + panel privado + gestión de clientes + almacenamiento. Desde $349 MXN/mes.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    url: 'https://orvenix.com.mx/',
    title: 'Orvenix — Plataforma SaaS para tu Negocio Digital',
    description: 'SaaS todo-en-uno: sitio web, panel privado, clientes y almacenamiento. Sin instalar nada. Activo en 24h.',
    images: ['/img/logo-main.png'],
  },
};

const faqItems = [
  {
    question: '¿Necesito conocimientos técnicos para usar la plataforma?',
    answer: 'No. La plataforma está diseñada para que cualquier persona pueda gestionarla sin saber programación. Todo funciona desde un navegador: subir archivos, crear clientes, revisar analíticas. Si tienes dudas, el soporte está incluido en todos los planes.',
  },
  {
    question: '¿Puedo conectar mi propio dominio al panel?',
    answer: 'Sí. En todos los planes puedes conectar tu dominio propio (ej. panel.tuempresa.com) para que tus clientes accedan con tu marca, no con la nuestra. El proceso toma menos de 15 minutos y te guiamos paso a paso.',
  },
  {
    question: '¿Cuántos clientes puedo agregar a mi panel?',
    answer: 'El plan Básico incluye hasta 5 cuentas de clientes. Los planes Pro y Empresa tienen clientes ilimitados. Cada cliente tiene su propio portal privado donde solo ve lo que tú decides compartir con él.',
  },
  {
    question: '¿Cómo funciona la facturación?',
    answer: 'Cobramos de forma recurrente, mensual o anual (con 20% de descuento). Aceptamos tarjetas de crédito/débito, transferencia SPEI y MercadoPago. Puedes cancelar en cualquier momento desde tu panel sin penalizaciones. Los precios son antes de IVA (16%) — la factura se emite automáticamente.',
  },
  {
    question: '¿Hay garantía de devolución?',
    answer: 'Sí. Si en los primeros 30 días no estás satisfecho, te devolvemos el 100% de tu pago sin preguntas ni formularios complicados. Solo contáctanos y procesamos el reembolso en 3-5 días hábiles.',
  },
  {
    question: '¿La plataforma funciona en dispositivos móviles?',
    answer: 'Completamente. Tanto tu panel de administración como el portal que ven tus clientes están optimizados para móvil, tablet y escritorio. Accede y gestiona desde cualquier dispositivo sin instalar ninguna app.',
  },
  {
    question: '¿Qué pasa con mis datos si cancelo?',
    answer: 'Antes de cancelar puedes exportar todos tus archivos y datos en cualquier momento. Guardamos tu información durante 30 días después de la cancelación por si deseas reactivar. Tus datos son tuyos, siempre.',
  },
];

export default function HomePage() {
  return (
    <MarketingLayout>
      <Hero />
      <Cotizador />
      <PlatPromoBanner />
      <Features />
      <HowToStart />
      <Portfolio />
      <Testimonials />

      {/* FAQ */}
      <section id="faq" className="mk-section-alt">
        <div className="mk-container">
          <SectionHeader
            tag="FAQ"
            title={<>Preguntas<br /><em className="not-italic mk-accent-text">frecuentes</em></>}
            center
          />
          <div className="mt-10 max-w-2xl mx-auto">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      <CtaSection
        title="¿Listo para empezar?"
        description="Activa tu plataforma hoy. Nuestro equipo la deja lista en menos de 24 horas."
        buttonLabel="Elegir mi plan →"
        buttonHref="/precios"
      />
    </MarketingLayout>
  );
}
