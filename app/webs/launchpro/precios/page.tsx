import { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Precios — Planes para cada etapa' }

const plans = [
  {
    name: 'Starter', price: 0, features: [
      '1 proyecto activo', '500 contactos', 'Analítica básica', '3 automatizaciones',
      'Landing page incluida', 'Soporte por email',
    ], cta: 'Empezar gratis', href: '/webs/launchpro#pricing', popular: false,
  },
  {
    name: 'Pro', price: 1490, features: [
      'Proyectos ilimitados', '10,000 contactos', 'Analítica avanzada + IA', 'Automatizaciones ilimitadas',
      'Dominio personalizado', 'Integraciones (Zapier, Slack)', 'Soporte prioritario 24/7',
    ], cta: '14 días gratis', href: '/webs/launchpro#pricing', popular: true,
  },
  {
    name: 'Business', price: 3990, features: [
      'Todo en Pro', 'Contactos ilimitados', 'API acceso completo', 'White label disponible',
      'Onboarding personalizado', 'Manager de cuenta dedicado', 'SLA 99.9% uptime',
    ], cta: 'Hablar con ventas', href: '/webs/launchpro/contacto', popular: false,
  },
]

export default function PreciosPage() {
  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-black text-white mb-4">Planes y precios</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Elegí el plan que mejor se adapte a tu etapa de crecimiento. Cambiá cuando quieras.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="text-gray-400 text-sm">Mensual</span>
          <div className="w-10 h-5 bg-brand-600 rounded-full relative cursor-pointer">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
          </div>
          <span className="text-white text-sm font-medium">Anual <span className="text-green-400 text-xs ml-1">-20%</span></span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {plans.map(plan => (
          <div key={plan.name} className={`glass-card p-8 flex flex-col relative ${plan.popular ? 'border-brand-500/60 ring-1 ring-brand-500/30' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                MÁS POPULAR
              </div>
            )}
            <h3 className="text-white font-bold text-xl mb-2">{plan.name}</h3>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-black text-white">
                {plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString('es-MX')}`}
              </span>
              {plan.price > 0 && <span className="text-gray-500 text-sm mb-1.5">/mes</span>}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check size={14} className="text-brand-400 flex-shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <Link href={plan.href} className={`${plan.popular ? 'btn-primary' : 'btn-outline'} w-full justify-center`}>
              {plan.cta} {plan.popular && <ArrowRight size={15} />}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparativa */}
      <div className="glass-card p-8 text-center">
        <h2 className="text-2xl font-black text-white mb-3">¿Necesitás un plan a medida?</h2>
        <p className="text-gray-400 mb-6">Para empresas con necesidades especiales o volumen alto, tenemos soluciones Enterprise.</p>
        <Link href="/webs/launchpro/contacto" className="btn-primary">
          Contactar a ventas <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
