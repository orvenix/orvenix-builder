import { Metadata } from 'next'
import { ShoppingBag, Phone, Clock } from 'lucide-react'
import { cortes } from '@/lib/data'

export const metadata: Metadata = { title: 'Hacer pedido' }

export default function PedidosPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-dark mb-3">Hacé tu pedido</h1>
        <p className="text-gray-500 max-w-lg mx-auto">Completá el formulario y nos ponemos en contacto para coordinar la entrega o retiro en el local.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-dark block mb-1.5">Nombre completo</label>
                  <input type="text" placeholder="Tu nombre" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-dark block mb-1.5">Teléfono / WhatsApp</label>
                  <input type="tel" placeholder="+52 55..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-dark block mb-1.5">Email</label>
                <input type="email" placeholder="tu@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat" />
              </div>

              <div className="border-t pt-5">
                <p className="font-semibold text-dark mb-4">Seleccioná los cortes</p>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {cortes.map(c => (
                    <label key={c.id} className="flex items-center justify-between gap-3 p-3 border border-gray-100 rounded-xl hover:border-meat/40 cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded accent-meat" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-dark">{c.nombre}</span>
                      </div>
                      <span className="text-sm font-bold text-meat flex-shrink-0">${c.precio}/{c.por}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-dark block mb-1.5">Cantidad estimada (kg total)</label>
                <input type="number" placeholder="Ej: 3" min="0.5" step="0.5" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat" />
              </div>

              <div>
                <label className="text-sm font-semibold text-dark block mb-1.5">Entrega o retiro</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:border-meat">
                  <option>Retiro en local</option>
                  <option>Envío a domicilio (CDMX)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-dark block mb-1.5">Observaciones</label>
                <textarea rows={3} placeholder="Grosor del corte, preparación especial, fecha deseada..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-meat resize-none" />
              </div>

              <button type="submit" className="btn-primary w-full justify-center py-4">
                <ShoppingBag size={18} /> Enviar pedido
              </button>
              <p className="text-xs text-center text-gray-400">Te contactaremos en menos de 2 horas para confirmar.</p>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <h3 className="font-bold text-dark mb-3">¿Cómo funciona?</h3>
            <ol className="space-y-3 text-sm text-gray-600">
              {['Completá el formulario con los cortes que deseas', 'Nuestro equipo confirma disponibilidad en 2hs', 'Coordinamos entrega o retiro en el local', 'Pagás al recibir la mercadería'].map((s, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="bg-meat text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-dark mb-3">Contacto directo</h3>
            <a href="tel:+525511223344" className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-meat mb-2">
              <Phone size={15} className="text-meat" /> 55 1122 3344
            </a>
            <div className="flex items-center gap-2.5 text-sm text-gray-700">
              <Clock size={15} className="text-meat" /> Mar-Dom 7:00-19:00
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
