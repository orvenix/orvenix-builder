"use client"
import Link from "next/link"
import { areas } from "../data/index"

export default function AbogadosServicios() {
  return (
    <div className="min-h-screen bg-[#070b14]">
      {/* HEADER */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-900/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">
            Áreas de práctica
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Servicios</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">jurídicos</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Seis áreas especializadas con equipos dedicados. Cada asunto es manejado por abogados con experiencia probada en esa materia específica.
          </p>
        </div>
      </section>

      {/* AREAS DETAIL */}
      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="space-y-8">
          {areas.map((a) => {
            const Icon = a.icon
            return (
              <div key={a.id} className={`p-8 rounded-3xl border ${a.border} ${a.bg}`}>
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${a.bg} border ${a.border} flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${a.color}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">{a.name}</h2>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className={`font-bold ${a.color}`}>{a.casos}</span>
                          <span className="text-white/25">·</span>
                          <span className="text-white/35">{a.tasa}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/45 leading-relaxed mb-5">{a.fullDesc}</p>
                    <div className="flex flex-wrap gap-2">
                      {a.tags.map(tag => (
                        <span key={tag} className={`px-3 py-1 text-xs rounded-full ${a.bg} ${a.color} border ${a.border}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="lg:w-64 shrink-0">
                    <div className={`p-6 rounded-2xl border ${a.border} bg-black/20 h-full flex flex-col justify-between`}>
                      <div>
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Honorarios desde</p>
                        <p className={`text-xl font-black ${a.color} mb-4`}>{a.precio}</p>
                        <div className="space-y-2 text-xs text-white/30 mb-6">
                          <p>✓ Consulta inicial gratuita</p>
                          <p>✓ Propuesta por escrito</p>
                          <p>✓ Seguimiento continuo</p>
                          <p>✓ Sin cuotas ocultas</p>
                        </div>
                      </div>
                      <Link
                        href="/webs/abogados/contacto"
                        className={`block text-center py-3 px-4 rounded-xl font-bold text-sm text-white transition-all ${a.bg} border ${a.border} hover:brightness-125`}
                      >
                        Consultar este caso
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
      <section className="py-20 bg-gradient-to-b from-[#070b14] to-[#0b1020]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">¿No encuentras tu caso aquí?</h2>
          <p className="text-white/35 mb-8">Contáctanos igualmente. Analizamos tu situación y, si no es nuestro campo, te referimos con el especialista correcto.</p>
          <Link href="/webs/abogados/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Hablar con un abogado
          </Link>
        </div>
      </section>
    </div>
  )
}
