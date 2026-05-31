import { Metadata } from 'next'
import { Mail, Phone, MapPin, Clock, Instagram, Facebook } from 'lucide-react'

export const metadata: Metadata = { title: 'Contacto' }

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-dark mb-3">Hablemos</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          ¿Tenés alguna consulta sobre tu pedido o nuestros productos? Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Formulario */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-dark mb-6">Envianos un mensaje</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nombre</label>
                <input type="text" placeholder="Tu nombre" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Apellido</label>
                <input type="text" placeholder="Tu apellido" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input type="email" placeholder="tu@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Asunto</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 text-gray-600">
                <option>Consulta sobre pedido</option>
                <option>Devolución o cambio</option>
                <option>Consulta sobre producto</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Mensaje</label>
              <textarea rows={5} placeholder="¿En qué podemos ayudarte?" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none" />
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Enviar mensaje
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="bg-brand-50 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-dark mb-6">Información de contacto</h2>
            <div className="space-y-5">
              {[
                { Icon: Mail, title: 'Email', value: 'hola@vistamoda.com', sub: 'Respondemos en menos de 24hs' },
                { Icon: Phone, title: 'Teléfono', value: '+52 55 1234 5678', sub: 'Lun-Vie 9:00 - 18:00' },
                { Icon: MapPin, title: 'Dirección', value: 'Av. Principal 123, CDMX', sub: 'México, CP 06600' },
                { Icon: Clock, title: 'Horario', value: 'Lun-Vie: 9:00 - 18:00', sub: 'Sáb: 10:00 - 14:00' },
              ].map(({ Icon, title, value, sub }) => (
                <div key={title} className="flex gap-4 items-start">
                  <div className="p-2.5 bg-brand-600 rounded-xl flex-shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark text-sm">{title}</p>
                    <p className="text-gray-700 text-sm">{value}</p>
                    <p className="text-gray-500 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6">
            <h3 className="font-bold text-dark mb-4">Seguinos en redes</h3>
            <div className="flex gap-3">
              <a href="#" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:border-brand-600 hover:text-brand-600 transition-colors">
                <Instagram size={16} /> Instagram
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:border-brand-600 hover:text-brand-600 transition-colors">
                <Facebook size={16} /> Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
