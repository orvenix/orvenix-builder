import Link from 'next/link'
import { ArrowRight, Check, Zap, BarChart3, Users, Globe, Shield, Headphones, Star, ChevronDown } from 'lucide-react'

const features = [
  { icon: BarChart3, title: 'Analítica avanzada', desc: 'Dashboards en tiempo real con métricas de conversión, retención y MRR. Todo en un solo lugar.' },
  { icon: Users, title: 'CRM integrado', desc: 'Gestión completa de clientes, embudos de venta y automatización de seguimiento por email.' },
  { icon: Globe, title: 'Sitio web incluido', desc: 'Creá tu landing page con nuestro editor drag & drop. Sin código, sin complicaciones.' },
  { icon: Shield, title: 'Pagos seguros', desc: 'Integraciones con MercadoPago, Stripe y PayPal. Cobrá en más de 40 países.' },
  { icon: Headphones, title: 'Soporte 24/7', desc: 'Chat en vivo, base de conocimiento y comunidad activa de más de 5,000 usuarios.' },
  { icon: Zap, title: 'Automatizaciones', desc: 'Flujos de trabajo automáticos para emails, notificaciones y tareas recurrentes.' },
]

const plans = [
  {
    name: 'Starter', price: 0, period: 'mes', popular: false,
    features: ['1 proyecto', '500 contactos', 'Analítica básica', '3 automatizaciones', 'Soporte por email'],
    cta: 'Empezar gratis',
  },
  {
    name: 'Pro', price: 1490, period: 'mes', popular: true,
    features: ['Proyectos ilimitados', '10,000 contactos', 'Analítica avanzada', 'Automatizaciones ilimitadas', 'Sitio web propio', 'Soporte prioritario'],
    cta: 'Comenzar prueba',
  },
  {
    name: 'Business', price: 3990, period: 'mes', popular: false,
    features: ['Todo en Pro', 'Contactos ilimitados', 'API personalizada', 'Integraciones avanzadas', 'Manager dedicado', 'SLA garantizado'],
    cta: 'Hablar con ventas',
  },
]

const testimonials = [
  { name: 'Roberto Sánchez', role: 'Fundador de MiTiendaOnline', avatar: 'RS', text: 'En 3 meses pasé de $0 a $50,000 MXN mensuales. LaunchPro me dio todas las herramientas que necesitaba sin complicarme la vida.', stars: 5 },
  { name: 'Daniela Flores', role: 'Coach de vida', avatar: 'DF', text: 'El CRM y las automatizaciones son increíbles. Ahora puedo atender a 10 veces más clientes con el mismo tiempo.', stars: 5 },
  { name: 'Marco Jiménez', role: 'Agencia Digital', avatar: 'MJ', text: 'Lo uso para todos mis clientes. La relación precio-valor es imbatible. No existe nada igual en el mercado latinoamericano.', stars: 5 },
]

const faqs = [
  { q: '¿Necesito saber programar?', a: 'No, para nada. LaunchPro está diseñado para que cualquier persona pueda usarlo sin conocimientos técnicos.' },
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí, podés cancelar tu suscripción cuando quieras sin penalidades ni costos adicionales.' },
  { q: '¿Tienen prueba gratuita?', a: 'El plan Starter es gratuito para siempre. Los planes Pro y Business tienen 14 días de prueba gratis sin tarjeta.' },
  { q: '¿En qué países está disponible?', a: 'LaunchPro funciona en todos los países de América Latina y España, con soporte de pagos locales.' },
  { q: '¿Puedo migrar mis datos actuales?', a: 'Sí, ofrecemos migración asistida gratuita desde cualquier plataforma en los planes Pro y Business.' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/20 border border-brand-500/30 text-brand-300 text-sm font-medium mb-8">
            <Zap size={13} /> ✨ Nuevo: Automatizaciones con IA disponibles
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Lanzá tu negocio digital<br />
            <span className="gradient-text">en menos de 24 horas</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            La plataforma todo-en-uno que usan más de <strong className="text-white">5,000 emprendedores</strong> para lanzar, vender y escalar sus negocios en Latinoamérica.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-14">
            <Link href="/#pricing" className="btn-primary px-8 py-4 text-base">
              Empezar gratis <ArrowRight size={18} />
            </Link>
            <Link href="/#features" className="btn-outline px-8 py-4 text-base">
              Ver demo en vivo
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {['Sin tarjeta de crédito', 'Cancela cuando quieras', 'Soporte en español'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={14} className="text-green-500" /> {t}
              </span>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-16 flex justify-center">
            <div className="glass-card px-6 py-4 flex items-center gap-6">
              <div className="flex -space-x-2">
                {['#7c3aed','#ec4899','#06b6d4','#10b981','#f59e0b'].map((c, i) => (
                  <div key={i} style={{ backgroundColor: c }} className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}</div>
                <p className="text-xs text-gray-400 mt-0.5">5,000+ negocios activos este mes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">
              Todo lo que necesitás,<br />
              <span className="gradient-text">en un solo lugar</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Dejá de pagar por 10 herramientas separadas. LaunchPro unifica todo lo que necesitás para crecer.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6 hover:border-brand-500/40 transition-all group">
                <div className="p-2.5 bg-brand-600/20 rounded-xl w-fit mb-4 group-hover:bg-brand-600/40 transition-colors">
                  <Icon size={20} className="text-brand-400" />
                </div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Precios <span className="gradient-text">transparentes</span></h2>
            <p className="text-gray-400">Sin sorpresas. Sin letras pequeñas. Solo resultados.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map(plan => (
              <div key={plan.name} className={`glass-card p-8 flex flex-col ${plan.popular ? 'border-brand-500/60 ring-1 ring-brand-500/30 relative' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MÁS POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-white font-bold text-lg mb-2">{plan.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">{plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString('es-MX')}`}</span>
                    {plan.price > 0 && <span className="text-gray-500 text-sm mb-1.5">/{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check size={14} className="text-brand-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/#"
                  className={`${plan.popular ? 'btn-primary' : 'btn-outline'} w-full justify-center`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-4">Lo que dicen <span className="gradient-text">nuestros usuarios</span></h2>
          <p className="text-gray-400 text-center mb-12">Historias reales de emprendedores que transformaron su negocio</p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="glass-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_,i) => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-4">Preguntas <span className="gradient-text">frecuentes</span></h2>
          <p className="text-gray-400 text-center mb-12">¿Tenés dudas? Aquí respondemos las más comunes.</p>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="glass-card p-5 group cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-white text-sm list-none">
                  {q}
                  <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-accent/10" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                ¿Listo para lanzar<br />tu negocio?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Únete a más de 5,000 emprendedores que ya están creciendo con LaunchPro. Empieza gratis hoy.
              </p>
              <Link href="/#pricing" className="btn-primary px-10 py-4 text-base">
                Empezar gratis ahora <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
