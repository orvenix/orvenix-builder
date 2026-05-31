import { SectionHeader } from '../sections/SectionHeader';

const testimonials = [
  { text: '"Desde que activé mi panel en Orvenix dejé de usar 4 herramientas distintas. Ahora gestiono mis 48 clientes, archivos y proyectos desde un solo lugar. Increíble."', name: 'Alejandro Morales', role: 'CEO · NexoConsult', initials: 'AM', avatarClass: 'bg-orvenix-accent-2' },
  { text: '"El panel estuvo activo en menos de 24 horas. Mis clientes acceden a sus reportes directamente sin necesidad de enviarles correos. Sencillo, rápido y profesional."', name: 'Sofía Rodríguez', role: 'Directora · DataPulse', initials: 'SR', avatarClass: 'bg-orvenix-accent' },
  { text: '"Empecé con el plan Básico y en 3 meses escalé al Pro. La plataforma creció conmigo. Mis alumnos ahora tienen su propio portal y la deserción bajó un 40%."', name: 'Luis Camacho', role: 'Founder · FitCoach Pro', initials: 'LC', avatarClass: 'bg-orvenix-accent-3' },
  { text: '"Lo que más valoro es que mis clientes me perciben más profesional. Tener un portal con mi marca y dominio propio hace una diferencia brutal en la confianza."', name: 'Carlos Ruiz', role: 'Director · Lumina Studio', initials: 'CR', avatarClass: 'bg-orvenix-accent-2' },
  { text: '"El almacenamiento en la nube incluido resolvió mi problema más urgente: compartir contratos y facturas sin WhatsApp ni Wetransfer. Todo ordenado y con control de acceso."', name: 'Elena Gómez', role: 'Fundadora · EcoClean', initials: 'EG', avatarClass: 'bg-orvenix-accent' },
  { text: '"Pagamos $699 al mes y ahorramos más de eso solo en tiempo administrativo. El ROI fue inmediato. Es la mejor inversión que hice para mi negocio este año."', name: 'Ricardo Silva', role: 'Gerente · SwiftLog', initials: 'RS', avatarClass: 'bg-orvenix-accent-2' },
];

export function Testimonials() {
  return (
    <section id="testimonios" className="mk-section-alt">
      <div className="mk-container">
        <SectionHeader
          tag="Testimonios"
          title={
            <>
              Lo que dicen
              <br />
              <em className="not-italic mk-accent-text">nuestros clientes</em>
            </>
          }
          center
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="mk-testimonial-card">
              <div className="mk-stars text-sm" aria-label="5 estrellas">★★★★★</div>
              <p className="text-sm leading-relaxed flex-1 italic text-orvenix-secondary">{t.text}</p>
              <div className="flex items-center gap-3 pt-3 mk-divider">
                <div className={`${t.avatarClass} w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-orvenix-text">{t.name}</div>
                  <div className="text-xs text-orvenix-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
