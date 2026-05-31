import Link from 'next/link';
import Image from 'next/image';
import { SectionHeader } from '../sections/SectionHeader';

const items = [
  { badge: 'Consultoría', title: 'NexoConsult', desc: 'Plan Pro · Gestiona 48 clientes con portales privados. Redujo el tiempo de envío de documentos un 80%.', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80&auto=format&fit=crop', alt: 'NexoConsult — Consultoría usando Orvenix' },
  { badge: 'Analítica', title: 'DataPulse', desc: 'Plan Empresa · Panel centralizado para reportes a 12 clientes corporativos. Cero correos de adjuntos.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop', alt: 'DataPulse — Analítica usando Orvenix' },
  { badge: 'Hotelería', title: 'GrandHotel Resort', desc: 'Plan Pro · Contratos, facturas y comunicación con proveedores desde un solo panel. +180% eficiencia.', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&auto=format&fit=crop', alt: 'GrandHotel Resort — Gestión en Orvenix' },
  { badge: 'Fitness', title: 'FitCoach Pro', desc: 'Plan Básico → Pro · Gestiona rutinas y pagos de 60 alumnos. Creció x3 en 6 meses con la plataforma.', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&auto=format&fit=crop', alt: 'FitCoach Pro — Entrenadores usando Orvenix' },
  { badge: 'Servicios', title: 'EcoClean', desc: 'Plan Pro · Cotizaciones, contratos y seguimiento de servicios automatizados. 100% sin papel.', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop', alt: 'EcoClean — Gestión en Orvenix' },
  { badge: 'Agencia', title: 'Lumina Studio', desc: 'Plan Empresa · Entrega de proyectos creativos a clientes vía portal privado. NPS aumentó a 92.', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&auto=format&fit=crop', alt: 'Lumina Studio — Agencia en Orvenix' },
  { badge: 'Logística', title: 'SwiftLog', desc: 'Plan Empresa · Tracking de envíos y documentación compartida con 30 clientes en tiempo real.', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80&auto=format&fit=crop', alt: 'SwiftLog — Logística en Orvenix' },
  { badge: 'Retail', title: 'UrbanStyle', desc: 'Plan Pro · Catálogos privados y pedidos de mayoristas gestionados desde un panel unificado.', img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80&auto=format&fit=crop', alt: 'UrbanStyle — Retail en Orvenix' },
];

export function Portfolio() {
  return (
    <section id="portafolio" className="mk-section bg-orvenix-bg">
      <div className="mk-container">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <SectionHeader
            tag="Casos de éxito"
            title={
              <>
                Empresas que ya
                <br />
                <em className="not-italic mk-accent-text">operan con Orvenix</em>
              </>
            }
          />
          <Link href="/portafolio" className="mk-btn-outline">
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.title} className="mk-portfolio-item group relative overflow-hidden rounded-2xl aspect-4/3">
              <Image
                src={item.img}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="mk-portfolio-overlay">
                <span className="mk-badge">{item.badge}</span>
                <h3 className="font-bold text-sm text-white mb-1">{item.title}</h3>
                <p className="text-xs leading-relaxed text-orvenix-secondary">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
