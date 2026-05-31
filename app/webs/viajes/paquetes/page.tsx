"use client"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { categories, process } from "../data/index"

const incluye = ["Vuelos redondos desde CDMX", "Hospedaje seleccionado", "Traslados aeropuerto–hotel", "Asesor IATA asignado", "Seguro de viajero", "Asistencia 24/7 en destino"]
const noIncluye = ["Comidas (salvo todo incluido)", "Tours opcionales", "Gastos personales", "Propinas"]

export default function ViajesPaquetes() {
  return (
    <div className="bg-[#08080f] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-orange-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-800/25 text-orange-500 text-xs mb-6">Paquetes a la medida</div>
          <h1 className="text-5xl font-black mb-6">Tipos de paquetes</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto">Todos nuestros paquetes son personalizados. Los precios varían según fechas, aerolínea y tipo de hotel. Pide tu cotización sin compromiso.</p>
        </div>
      </section>

      {/* CATEGORÍAS DETALLADAS */}
      <section className="pb-20 max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {categories.map(c => {
            const Icon = c.icon
            return (
              <div key={c.id} className={`p-8 rounded-3xl border ${c.border} ${c.bg}`}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center mb-5`}>
                      <Icon className={`w-7 h-7 ${c.color}`} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">{c.title}</h2>
                    <div className={`text-xl font-black ${c.color}`}>{c.desde}</div>
                    <div className="text-xs text-white/30 mt-1">por persona en base doble</div>
                    <div className="mt-2 text-sm text-white/35">{c.popularidad}</div>
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-white/45 leading-relaxed mb-6">{c.desc}</p>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {c.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-2 text-sm text-white/40">
                          <CheckCircle className={`w-4 h-4 ${c.color} shrink-0`} />
                          {tag}
                        </div>
                      ))}
                    </div>
                    <Link href="/webs/viajes/contacto" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all`}>
                      Cotizar este paquete →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* QUÉ INCLUYE */}
      <section className="py-16 bg-gradient-to-b from-[#08080f] to-[#0c080c]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">¿Qué incluye un paquete Ruta Norte?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl border border-orange-900/20 bg-orange-950/8">
              <h3 className="font-bold text-white mb-4">Generalmente incluye</h3>
              {incluye.map(i => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/45 mb-2">
                  <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  {i}
                </div>
              ))}
            </div>
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.015]">
              <h3 className="font-bold text-white mb-4">No incluye (generalmente)</h3>
              {noIncluye.map(i => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/35 mb-2">
                  <div className="w-4 h-4 rounded-full border border-white/15 shrink-0 flex items-center justify-center">
                    <div className="w-1.5 h-0.5 bg-white/25 rounded" />
                  </div>
                  {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-black text-center mb-10">Cómo cotizamos tu viaje</h2>
        <div className="space-y-4">
          {process.map(p => (
            <div key={p.n} className="flex gap-4 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.015]">
              <div className="text-2xl font-black text-orange-900/50 w-10 shrink-0">{p.n}</div>
              <div>
                <h3 className="font-bold text-white text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Listo para viajar?</h2>
          <p className="text-white/35 mb-8">Cotización sin compromiso. En 24h tienes tu itinerario personalizado con el mejor precio disponible.</p>
          <Link href="/webs/viajes/contacto" className="px-10 py-4 font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all">
            Cotizar mi viaje →
          </Link>
        </div>
      </section>
    </div>
  )
}
