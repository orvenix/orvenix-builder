import { SectionHeader } from '../sections/SectionHeader';

const steps = [
  { num: '01', title: 'Elige tu plan', description: 'Selecciona el plan que se ajuste al tamaño de tu negocio. Puedes escalar en cualquier momento.' },
  { num: '02', title: 'Crea tu cuenta', description: 'Registra tu empresa en minutos. Sin contratos largos ni papeleos. Solo datos básicos.' },
  { num: '03', title: 'Crea tu sitio', description: 'Elige tu Diseño Orvenix y escribe los datos de tu negocio: tu sitio se crea con todas las páginas del diseño.' },
  { num: '04', title: 'Edita y publica', description: 'Ajusta textos e imágenes en el editor y publica cuando quieras. Soporte incluido desde el primer día.' },
];

export function HowToStart() {
  return (
    <section id="como-empezar" className="mk-section-alt">
      <div className="mk-container">
        <SectionHeader
          tag="Cómo empezar"
          title={
            <>
              Activa tu plataforma
              <br />
              <em className="not-italic mk-accent-text">en 4 pasos</em>
            </>
          }
          center
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div
                  className="mk-step-connector hidden lg:block absolute top-7 left-full w-full h-px"
                  aria-hidden="true"
                />
              )}
              <div className="mk-step-num">{s.num}</div>
              <h3 className="font-bold text-base mb-2 text-orvenix-text">{s.title}</h3>
              <p className="text-sm leading-relaxed text-orvenix-secondary">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
