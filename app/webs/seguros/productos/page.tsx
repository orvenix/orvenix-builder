"use client"
import Link from "next/link"
import { products } from "../data/index"

export default function SegurosProductos() {
  return (
    <div className="min-h-screen bg-[#06090f]">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-blue-900/5 rounded-full blur-[130px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-700/25 text-blue-400 text-xs mb-6">
            Catálogo de productos
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Todos nuestros</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">seguros</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Comparamos propuestas de más de 12 aseguradoras para cada producto. Sin compromiso. Cotización en menos de 24 horas.
          </p>
        </div>
      </section>

      {/* PRODUCTS DETAIL */}
      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="space-y-8">
          {products.map(p => {
            const Icon = p.icon
            return (
              <div key={p.id} className={`p-8 rounded-3xl border ${p.border} ${p.bg}`}>
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${p.bg} border ${p.border} flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${p.color}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">{p.name}</h2>
                        <p className={`text-sm ${p.color} mt-1`}>{p.desde}</p>
                      </div>
                    </div>
                    <p className="text-white/45 leading-relaxed mb-5">{p.fullDesc}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {p.tags.map(tag => (
                        <span key={tag} className={`px-3 py-1 text-xs rounded-full ${p.bg} ${p.color} border ${p.border}`}>{tag}</span>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-white/30 mb-2 uppercase tracking-wider">Aseguradoras con las que trabajamos</p>
                      <div className="flex flex-wrap gap-2">
                        {p.aseguradoras.map(a => (
                          <span key={a} className="px-3 py-1 text-xs rounded-full border border-white/10 text-white/40">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-64 shrink-0">
                    <div className={`p-6 rounded-2xl border ${p.border} bg-black/20 h-full flex flex-col justify-between`}>
                      <div>
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Prima desde</p>
                        <p className={`text-xl font-black ${p.color} mb-4`}>{p.desde}</p>
                        <div className="space-y-2 text-xs text-white/30 mb-6">
                          <p>✓ Cotización sin costo</p>
                          <p>✓ Comparativa multi-aseguradora</p>
                          <p>✓ Asesor dedicado incluido</p>
                          <p>✓ Gestión de siniestros gratis</p>
                        </div>
                      </div>
                      <Link
                        href="/webs/seguros/contacto"
                        className={`block text-center py-3 px-4 rounded-xl font-bold text-sm text-white transition-all ${p.bg} border ${p.border} hover:brightness-125`}
                      >
                        Cotizar este seguro
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-[#06090f] to-[#0a0e18]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">¿Necesitas varios seguros?</h2>
          <p className="text-white/35 mb-8">Diseñamos un portafolio completo de protección para ti o tu empresa. Un solo asesor para todo.</p>
          <Link href="/webs/seguros/contacto" className="px-8 py-4 font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xl shadow-blue-900/30 inline-block">
            Hablar con un asesor
          </Link>
        </div>
      </section>
    </div>
  )
}
