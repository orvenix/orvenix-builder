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
  description: 'Orvenix — Plataforma SaaS todo-en-uno para negocios digitales. Web profesional + panel privado + gestión de clientes + almacenamiento. Desde 15 USD/mes + IVA.',
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
    question: '¿Por donde empiezo si no se que plan elegir?',
    answer: 'Empieza por el tipo de operacion: presencia inicial, crecimiento comercial o operacion avanzada. Inicio te orienta; en /precios puedes revisar condiciones completas y elegir con calma.',
  },
  {
    question: '¿Puedo editar mi sitio sin programar?',
    answer: 'Si. El Super Builder permite cambiar textos, imagenes, colores, enlaces y secciones desde una experiencia visual. Tambien puedes partir de templates reales por industria.',
  },
  {
    question: '¿Que diferencia hay entre template y lienzo guiado?',
    answer: 'Un template te da una estructura completa por industria. El lienzo guiado empieza mas libre, con sugerencias de secciones esenciales para construir sin sentir una pantalla vacia.',
  },
  {
    question: '¿Puedo crecer de Starter a Pro o Business?',
    answer: 'Si. La idea es empezar con el alcance correcto y escalar cuando necesites eCommerce, CRM, IA, mas sitios, funnels, automatizaciones o soporte mas avanzado.',
  },
  {
    question: '¿El constructor funciona en pantallas pequeñas?',
    answer: 'La plataforma se puede consultar en movil, pero el constructor se aprovecha mejor en desktop o pantallas amplias porque hay canvas, paneles y controles visuales.',
  },
  {
    question: '¿Puedo pedir ayuda para personalizar mi sitio?',
    answer: 'Si. Puedes usar la plataforma por tu cuenta o contactar al equipo para ajustes, migraciones, integraciones, compra definitiva o un alcance Enterprise.',
  },
  {
    question: '¿Donde veo precios, impuestos y condiciones completas?',
    answer: 'La informacion comercial detallada esta en /precios: montos oficiales, modalidades, condiciones, soporte, backups y activacion del plan.',
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
