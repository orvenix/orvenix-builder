import { Metadata } from 'next'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Contacto' }

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-black text-dark mb-10" style={{ fontFamily: 'var(--font-playfair)' }}>Contactanos</h1>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="space-y-5">
          {[
            { Icon: Phone, title: 'Teléfono / WhatsApp', value: '55 1122 3344', href: 'tel:+525511223344' },
            { Icon: Mail, title: 'Email', value: 'hola@larespremium.mx', href: 'mailto:hola@larespremium.mx' },
            { Icon: MapPin, title: 'Ubicación', value: 'Mercado Central, Local 12, Col. Centro, CDMX', href: null },
            { Icon: Clock, title: 'Horarios', value: 'Martes a Domingo: 7:00 - 19:00 hs. Lunes cerrado.', href: null },
          ].map(({ Icon, title, value, href }) => (
            <div key={title} className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-amber-100">
              <div className="p-2.5 bg-meat/10 rounded-xl flex-shrink-0">
                <Icon size={20} className="text-meat" />
              </div>
              <div>
                <p className="font-semibold text-dark text-sm mb-0.5">{title}</p>
                {href ? (
                  <a href={href} className="text-gray-600 hover:text-meat">{value}</a>
                ) : (
                  <p className="text-gray-600 text-sm">{value}</p>
                )}
              </div>
            </div>
          ))}

          <div className="bg-gray-100 rounded-2xl h-52 flex items-center justify-center text-gray-400 text-sm">
            📍 Mapa aquí
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-dark mb-6">Envianos un mensaje</h2>
          <form className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-dark block mb-1.5">Nombre</label>
              <input type="text" placeholder="Tu nombre" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-dark block mb-1.5">Email</label>
                <input type="email" placeholder="tu@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat" />
              </div>
              <div>
                <label className="text-sm font-semibold text-dark block mb-1.5">Teléfono</label>
                <input type="tel" placeholder="+52 55..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-dark block mb-1.5">Mensaje</label>
              <textarea rows={5} placeholder="¿En qué podemos ayudarte?" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat resize-none" />
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
