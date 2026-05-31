import { Metadata } from 'next'
import { Mail, MessageCircle, Calendar } from 'lucide-react'

export const metadata: Metadata = { title: 'Contacto' }

export default function ContactoPage() {
  return (
    <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-white mb-4">Hablemos</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          ¿Tenés preguntas sobre LaunchPro? Nuestro equipo está listo para ayudarte a crecer.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {[
          { Icon: Mail, title: 'Email', value: 'hola@launchpro.mx', sub: 'Respuesta en < 2 horas' },
          { Icon: MessageCircle, title: 'Chat en vivo', value: 'Disponible ahora', sub: 'Lun-Vie 8:00 - 22:00' },
          { Icon: Calendar, title: 'Demo en vivo', value: 'Agendá una llamada', sub: 'Gratis, sin compromiso' },
        ].map(({ Icon, title, value, sub }) => (
          <div key={title} className="glass-card p-6 text-center hover:border-brand-500/40 transition-all cursor-pointer">
            <div className="p-3 bg-brand-600/20 rounded-2xl w-fit mx-auto mb-4">
              <Icon size={22} className="text-brand-400" />
            </div>
            <h3 className="text-white font-semibold mb-1">{title}</h3>
            <p className="text-brand-400 text-sm font-medium">{value}</p>
            <p className="text-gray-500 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6">Envianos un mensaje</h2>
        <form className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Nombre</label>
            <input type="text" placeholder="Tu nombre" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Email</label>
            <input type="email" placeholder="tu@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 block mb-1.5">Asunto</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-brand-500">
              <option>Consulta sobre planes</option>
              <option>Soporte técnico</option>
              <option>Demo personalizada</option>
              <option>Partnership</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-400 block mb-1.5">Mensaje</label>
            <textarea rows={5} placeholder="¿En qué podemos ayudarte?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn-primary px-8">
              Enviar mensaje
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
