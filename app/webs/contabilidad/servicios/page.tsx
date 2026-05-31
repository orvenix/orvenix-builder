"use client"
import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { services } from "../data/index"

export default function ContabilidadServicios() {
  return (
    <div className="bg-[#070f14] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-teal-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/20 border border-teal-800/25 text-teal-500 text-xs mb-6">Servicios</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Servicios contables y fiscales</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto">Cobertura completa del ciclo contable-fiscal para personas físicas y morales. Un despacho, todas las soluciones.</p>
        </div>
      </section>

      <section className="pb-20 max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {services.map(s => {
            const Icon = s.icon
            return (
              <div key={s.id} className={`p-8 rounded-3xl border ${s.border} ${s.bg}`}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className={`w-14 h-14 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center mb-5`}>
                      <Icon className={`w-7 h-7 ${s.color}`} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">{s.title}</h2>
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${s.color}`}>{s.clients}</p>
                      <p className="text-xs text-white/30">{s.tiempoResp}</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-white/45 leading-relaxed mb-6 text-base">{s.desc}</p>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {s.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-2 text-sm text-white/40">
                          <CheckCircle className={`w-4 h-4 ${s.color} shrink-0`} />
                          {tag}
                        </div>
                      ))}
                    </div>
                    <Link href="/webs/contabilidad/contacto" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border ${s.border} ${s.color} transition-all`}>
                      Solicitar servicio <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-[#070f14] to-[#050c10] text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿No estás seguro qué servicio necesitas?</h2>
          <p className="text-white/35 mb-8">Agenda un diagnóstico gratuito. En 48h te decimos qué obligaciones tienes y cuál es la mejor solución para tu situación.</p>
          <Link href="/webs/contabilidad/contacto" className="px-10 py-4 font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition-all">
            Solicitar diagnóstico gratis →
          </Link>
        </div>
      </section>
    </div>
  )
}
