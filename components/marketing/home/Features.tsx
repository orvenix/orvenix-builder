import { SectionHeader } from '../sections/SectionHeader';

const features = [
  {
    icon: '🌐',
    title: 'Sitio Web Incluido',
    description: 'Tu presencia digital profesional lista desde el primer día. Diseño responsive, optimizado para SEO y velocidad de carga máxima.',
    tags: ['Hosting', 'SSL', 'SEO'],
  },
  {
    icon: '🔐',
    title: 'Panel de Control',
    description: 'Dashboard privado con tu propio subdominio. Gestiona clientes, archivos y proyectos desde un solo lugar, sin instalar nada.',
    tags: ['Dashboard', 'Roles', 'Accesos'],
  },
  {
    icon: '☁️',
    title: 'Almacenamiento en la Nube',
    description: 'Sube, organiza y comparte documentos, contratos e imágenes con tus clientes de forma segura y ordenada.',
    tags: ['Cloud', 'Backups', 'Cifrado'],
  },
  {
    icon: '👥',
    title: 'Gestión de Clientes',
    description: 'Crea portales individuales para cada cliente. Ellos acceden solo a lo que les corresponde, tú controlas todo desde tu panel.',
    tags: ['CRM', 'Portales', 'Permisos'],
  },
  {
    icon: '📊',
    title: 'Analíticas en Tiempo Real',
    description: 'Visualiza métricas de tu negocio, actividad de clientes y uso de almacenamiento. Toma decisiones basadas en datos reales.',
    tags: ['Dashboard', 'Reportes', 'KPIs'],
  },
  {
    icon: '🔒',
    title: 'Seguridad 24/7',
    description: 'SSL incluido, autenticación de dos factores, backups automáticos diarios y monitoreo continuo de tu infraestructura.',
    tags: ['SSL', '2FA', 'Uptime 99.9%'],
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
