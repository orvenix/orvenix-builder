import { Metadata } from 'next'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Contacto' }

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <span className="text-4xl mb-3 block">💌</span>
        <h1 className="text-4xl font-black text-dark mb-3">¿Cómo podemos ayudarte?</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Estamos felices de ayudarte a encontrar el regalo perfecto o resolver cualquier consulta.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {[
          { Icon: Phone, title: 'Teléfono', value: '55 8899 0011', sub: 'Lun-Sáb 9:00-18:00', bg: 'bg-blue-50', color: 'text-blue-600' },
          { Icon: MessageCircle, title: 'WhatsApp', value: 'Escribinos ahora', sub: 'Respuesta en minutos', bg: 'bg-green-50', color: 'text-green-600' },
          { Icon: Mail, title: 'Email', value: 'hola@mundomagico.mx', sub: 'Respuesta en < 4hs', bg: 'bg-purple-50', color: 'text-purple-600' },
        ].map(({ Icon, title, value, sub, bg, color }) => (
          <div key={title} className={`${bg} rounded-2xl p-6 text-center`}>
            <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm`}>
              <Icon size={22} className={color} />
            </div>
            <h3 className="font-black text-dark mb-1">{title}</h3>
            <p className={`font-semibold text-sm ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div className="bg-white rounded-3xl border border-gray-100 p-8">
          <h2 className="text-xl font-black text-dark mb-6">Envianos un mensaje 🎉</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-dark block mb-1.5">Nombre</label>
                <input type="text" placeholder="Tu nombre" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-sm font-bold text-dark block mb-1.5">Email</label>
                <input type="email" placeholder="tu@email.com" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-dark block mb-1.5">¿Cuántos años tiene el niño/a?</label>
              <select className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-blue-400">
                <option>0–1 año</option>
                <option>1–3 años</option>
                <option>4–6 años</option>
                <option>7–10 años</option>
                <option>11–14 años</option>
                <option>Es para un adulto 😄</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-dark block mb-1.5">Asunto</label>
              <select className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-blue-400">
                <option>Recomendación de juguete</option>
                <option>Consulta sobre pedido</option>
                <option>Devolución o cambio</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-dark block mb-1.5">Mensaje</label>
              <textarea rows={4} placeholder="¿En qué te podemos ayudar? 🎁" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none" />
            </div>
            <button type="submit" className="btn-primary w-full justify-center">
              Enviar mensaje 🚀
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-black text-dark mb-4">Información del local</h3>
            <div className="space-y-3">
              {[
                { Icon: MapPin, v: 'Centro Comercial Las Américas, Local 45, CDMX' },
                { Icon: Clock, v: 'Lun-Sáb 10:00-20:00 · Dom 11:00-18:00' },
                { Icon: Phone, v: '55 8899 0011' },
                { Icon: Mail, v: 'hola@mundomagico.mx' },
              ].map(({ Icon, v }) => (
                <div key={v} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <Icon size={15} className="text-blue-600 flex-shrink-0 mt-0.5" /> {v}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
            <h3 className="font-black text-dark mb-2">🎁 ¿Buscás un regalo?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Nuestros asesores de regalos te ayudan a encontrar el juguete perfecto según la edad, intereses y presupuesto. ¡Es un servicio gratuito!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
