"use client"
import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { tramites, process } from "../data/index"

export default function NotariaTramites() {
  return (
    <div className="bg-[#080a0e] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-yellow-900/4 rounded-full blur-[140px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-800/25 text-yellow-500 text-xs mb-6">Actos notariales</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Trámites notariales</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto">Cobertura completa de actos ante notario. Cada trámite es atendido por el área especializada del despacho.</p>
        </div>
      </section>

      <section className="pb-20 max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {tramites.map(t => {
            const Icon = t.icon
            return (
              <div key={t.id} className={`p-8 rounded-3xl border ${t.border} ${t.bg}`}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className={`w-14 h-14 rounded-2xl ${t.bg} border ${t.border} flex items-center justify-center mb-5`}>
                      <Icon className={`w-7 h-7 ${t.color}`} />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">{t.title}</h2>
                    <div className="space-y-1">
                      <p className="text-xs text-white/30">Plazo estimado</p>
                      <p className={`text-sm font-bold ${t.color}`}>{t.plazo}</p>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-white/25">{t.nota}</p>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <p className="text-white/45 leading-relaxed mb-6 text-base">{t.desc}</p>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {t.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-2 text-sm text-white/40">
                          <CheckCircle className={`w-4 h-4 ${t.color} shrink-0`} />
                          {tag}
                        </div>
                      ))}
                    </div>
                    <Link href="/webs/notaria/contacto" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border ${t.border} ${t.color} transition-all`}>
                      Solicitar cita <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-[#080a0e] to-[#0b0d12]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-10">Proceso notarial</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {process.map(p => (
              <div key={p.n} className="flex gap-4 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.015]">
                <div className="text-2xl font-black text-yellow-900/50 w-10 shrink-0">{p.n}</div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{p.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Necesitas más información?</h2>
          <p className="text-white/35 mb-8">El equipo de la Notaría te orienta sin costo inicial. Agenda cita y te explicamos el proceso paso a paso.</p>
          <Link href="/webs/notaria/contacto" className="px-10 py-4 font-bold rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white transition-all">
            Agendar cita →
          </Link>
        </div>
      </section>
    </div>
  )
}
