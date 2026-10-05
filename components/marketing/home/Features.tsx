import { SectionHeader } from '../sections/SectionHeader';

const features = [
  {
    icon: '🌐',
    title: 'Sitio Web Incluido',
    description: 'Tu presencia digital profesional lista desde el primer día. Diseño responsive, optimizado para SEO y velocidad de carga máxima.',
    tags: ['Hosting', 'SSL', 'SEO'],
  },
  {
    icon: '🎨',
    title: 'Diseños Orvenix',
    description: 'Elige un diseño profesional por industria, mira su demo completa y crea tu sitio con todas sus páginas.',
    tags: ['Express', 'Profesional', 'Signature'],
  },
  {
    icon: '✏️',
    title: 'Editor Simple',
    description: 'Cambia textos e imágenes de tu sitio sin tocar código. Guardas tus cambios y publicas cuando quieras.',
    tags: ['Textos', 'Imágenes', 'Publicación'],
  },
  {
    icon: '📇',
    title: 'Datos de tu negocio',
    description: 'Nombre, teléfono, WhatsApp, horario y redes se actualizan en todas las páginas de tu sitio desde un solo lugar.',
    tags: ['WhatsApp', 'Contacto', 'Multipágina'],
  },
  {
    icon: '📊',
    title: 'Analíticas de visitas',
    description: 'Consulta las visitas de tu sitio publicado desde tu panel.',
    tags: ['Visitas', 'Panel'],
  },
  {
    icon: '🔒',
    title: 'Seguridad 24/7',
    description: 'SSL incluido, backups automáticos diarios y monitoreo continuo de tu infraestructura.',
    tags: ['SSL', 'Backups', 'Uptime objetivo 99.9%'],
  },
];

export function Features() {
  return (
    <section id="caracteristicas" className="mk-section bg-orvenix-bg">
      <div className="mk-container">
        <SectionHeader
          tag="Características"
          title={
            <>
              Todo incluido en
              <br />
              <em className="not-italic mk-accent-text">tu plataforma</em>
            </>
          }
          description="Un ecosistema completo para operar tu negocio digital. Sin contratar herramientas por separado, sin configuraciones complejas."
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="mk-glass-card p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-base mb-2 text-orvenix-text">{f.title}</h3>
              <p className="text-sm leading-relaxed mb-4 text-orvenix-secondary">{f.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {f.tags.map((tag) => (
                  <span key={tag} className="mk-feature-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
