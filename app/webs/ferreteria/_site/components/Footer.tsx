import Link from 'next/link'
import { Hammer, Phone, Mail, MapPin, Clock, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-brand-600 rounded-lg"><Hammer size={16} className="text-white" /></div>
              <div>
                <p className="font-black text-white text-sm">El Constructor</p>
                <p className="text-brand-500 text-xs">FERRETERÍA</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Más de 20 años proveyendo herramientas y materiales de calidad para profesionales y particulares.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-brand-600 transition-colors"><Globe size={15} /></a>
              <a href="#" className="p-2 bg-gray-800 rounded-lg hover:bg-brand-600 transition-colors"><Mail size={15} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Catálogo</h4>
            <ul className="space-y-2 text-sm">
              {['Herramientas manuales', 'Herramientas eléctricas', 'Materiales de obra', 'Pinturas y barnices', 'Plomería', 'Electricidad'].map(item => (
                <li key={item}><Link href="/webs/ferreteria/catalogo" className="hover:text-brand-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Servicios</h4>
            <ul className="space-y-2 text-sm">
              {['Corte de materiales', 'Asesoramiento técnico', 'Entrega a domicilio', 'Crédito para empresas', 'Presupuestos de obra'].map(item => (
                <li key={item}><Link href="/webs/ferreteria/servicios" className="hover:text-brand-400 transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Phone size={13} className="text-brand-500" /> +52 55 9876 5432</li>
              <li className="flex items-center gap-2"><Mail size={13} className="text-brand-500" /> info@elconstructor.mx</li>
              <li className="flex items-start gap-2"><MapPin size={13} className="text-brand-500 mt-0.5" /> Av. Industria 456, CDMX</li>
              <li className="flex items-center gap-2"><Clock size={13} className="text-brand-500" /> Lun-Vie 8:00-18:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between text-xs text-gray-600">
          <p>© 2025 Ferretería El Constructor. Todos los derechos reservados.</p>
          <p className="mt-2 md:mt-0">CDMX, México</p>
        </div>
      </div>
    </footer>
  )
}
