import { Metadata } from 'next'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Contacto' }

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-black text-dark mb-3">Contactanos</h1>
      <p className="text-gray-500 mb-12 max-w-xl">Estamos para ayudarte. Visitanos en nuestro local, llamanos o escribinos.</p>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-dark mb-5">Información de contacto</h2>
            <div className="space-y-4">
              {[
                { Icon: Phone, title: 'Teléfono', value: '+52 55 9876 5432', href: 'tel:+525598765432' },
                { Icon: Mail, title: 'Email', value: 'info@elconstructor.mx', href: 'mailto:info@elconstructor.mx' },
                { Icon: MapPin, title: 'Dirección', value: 'Av. Industria 456, Col. Industrial, CDMX, CP 06800', href: null },
                { Icon: Clock, title: 'Horario', value: 'Lun-Vie 8:00-18:00 · Sáb 8:00-14:00', href: null },
              ].map(({ Icon, title, value, href }) => (
                <div key={title} className="flex gap-4 items-start">
                  <div className="p-2.5 bg-brand-50 rounded-xl flex-shrink-0">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark text-sm">{title}</p>
                    {href ? (
                      <a href={href} className="text-gray-600 text-sm hover:text-brand-600">{value}</a>
                    ) : (
                      <p className="text-gray-600 text-sm">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 rounded-2xl h-56 flex items-center justify-center text-gray-400 text-sm">
            📍 Mapa de Google Maps aquí
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-dark mb-6">Envianos un mensaje</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nombre</label>
                <input type="text" placeholder="Tu nombre" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Teléfono</label>
                <input type="tel" placeholder="+52 55..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input type="email" placeholder="tu@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">¿En qué podemos ayudarte?</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-brand-500">
                <option>Consulta sobre producto</option>
                <option>Presupuesto de obra</option>
                <option>Entrega a domicilio</option>
                <option>Crédito empresarial</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Mensaje</label>
              <textarea rows={4} placeholder="Describí tu consulta..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 resize-none" />
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Enviar mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
