"use client"
import Link from "next/link"
import { services } from "../data/index"

export default function FinanzasServicios() {
  return (
    <div className="min-h-screen bg-[#040f0a]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-emerald-900/5 rounded-full blur-[130px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/20 border border-emerald-700/25 text-emerald-400 text-xs mb-6">
            Servicios de asesoría
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Asesoría</span>{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">financiera integral</span>
          </h1>
          <p className="text-white/35 max-w-2xl mx-auto text-lg leading-relaxed">
            Seis áreas de especialidad. Un equipo. El mismo objetivo: maximizar tu patrimonio neto de forma sostenible y sin conflictos de interés.
          </p>
        </div>
      </section>

      <section className="pb-28 max-w-7xl mx-auto px-6">
        <div className="space-y-8">
          {services.map(s => {
            const Icon = s.icon
            return (
              <div key={s.id} className={`p-8 rounded-3xl border ${s.border} ${s.bg}`}>
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${s.color}`} />
                      </div>
                      <h2 className="text-2xl font-black text-white">{s.name}</h2>
                    </div>
                    <p className="text-white/45 leading-relaxed mb-5">{s.fullDesc}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.tags.map(tag => (
                        <span key={tag} className={`px-3 py-1 text-xs rounded-full ${s.bg} ${s.color} border ${s.border}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="lg:w-64 shrink-0">
                    <div className={`p-6 rounded-2xl border ${s.border} bg-black/20 h-full flex flex-col justify-between`}>
                      <div>
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Mínimo requerido</p>
                        <p className={`text-lg font-black ${s.color} mb-1`}>{s.minimo}</p>
                        <p className="text-[11px] text-white/25 mb-4">{s.comision}</p>
                        <div className="space-y-2 text-xs text-white/30 mb-6">
                          <p>✓ Diagnóstico inicial gratis</p>
                          <p>✓ Plan por escrito</p>
                          <p>✓ Reuniones trimestrales</p>
                          <p>✓ Reporte mensual</p>
                        </div>
                      </div>
                      <Link
                        href="/webs/finanzas/contacto"
                        className={`block text-center py-3 px-4 rounded-xl font-bold text-sm text-white transition-all ${s.bg} border ${s.border} hover:brightness-125`}
                      >
                        Consultar este servicio
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-[#040f0a] to-[#070f09]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">No estás seguro por dónde empezar</h2>
          <p className="text-white/35 mb-8">El diagnóstico financiero inicial es gratuito. En 60 minutos sabrás exactamente dónde estás y qué deberías hacer primero.</p>
          <Link href="/webs/finanzas/contacto" className="px-8 py-4 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xl shadow-emerald-900/30 inline-block">
            Agendar diagnóstico gratuito
          </Link>
        </div>
      </section>
    </div>
  )
}
