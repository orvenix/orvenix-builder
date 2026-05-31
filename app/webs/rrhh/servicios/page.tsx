"use client"
import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { services, metodologia } from "../data/index"

export default function RRHHServicios() {
  return (
    <div className="bg-[#090714] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-violet-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/20 border border-violet-800/25 text-violet-500 text-xs mb-6">Servicios de consultoría</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Soluciones de RRHH</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto">Cobertura completa del ciclo de talento. Cada servicio se entrega con métricas base y resultados medibles.</p>
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
                    <div className={`text-sm font-bold ${s.color} mb-1`}>{s.kpi}</div>
                    <div className="text-xs text-white/30">{s.garantia}</div>
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
                    <Link href="/webs/rrhh/contacto" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border ${s.border} ${s.color} transition-all`}>
                      Solicitar diagnóstico <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-[#090714] to-[#0c0916]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Metodología de trabajo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metodologia.map(m => (
              <div key={m.n} className="flex gap-4 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.015]">
                <div className="text-2xl font-black text-violet-900/60 w-10 shrink-0">{m.n}</div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{m.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Por dónde empezamos?</h2>
          <p className="text-white/35 mb-8">Diagnóstico gratuito de madurez en gestión de talento. En 48h sabes exactamente qué necesita tu empresa.</p>
          <Link href="/webs/rrhh/contacto" className="px-10 py-4 font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all">
            Solicitar diagnóstico gratis →
          </Link>
        </div>
      </section>
    </div>
  )
}
