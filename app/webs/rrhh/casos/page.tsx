"use client"
import Link from "next/link"
import { casos, stats } from "../data/index"

export default function RRHHCasos() {
  return (
    <div className="bg-[#090714] min-h-screen">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-violet-900/5 rounded-full blur-[140px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/20 border border-violet-800/25 text-violet-500 text-xs mb-6">Resultados reales</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">Casos de éxito</h1>
          <p className="text-xl text-white/35 max-w-2xl mx-auto">Empresas reales, retos reales, resultados medibles. Antes y después con números concretos.</p>
        </div>
      </section>

      {/* STATS */}
      <div className="max-w-5xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="text-2xl font-black text-violet-400">{s.value}</div>
              <div className="text-xs text-white/25 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CASOS */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="space-y-6">
          {casos.map((c, idx) => (
            <div key={c.empresa} className={`rounded-3xl bg-gradient-to-br ${c.gradient} border border-white/[0.07] overflow-hidden`}>
              <div className="p-8">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{c.sector}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-white/60 border border-white/15">Caso #{idx + 1}</span>
                </div>
                <h2 className="font-black text-white text-2xl mb-6">{c.empresa}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-4 rounded-xl bg-black/20">
                    <div className="text-[10px] text-red-400/60 uppercase tracking-wider mb-2 font-bold">El reto</div>
                    <p className="text-sm text-white/60 leading-relaxed">{c.reto}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-black/20">
                    <div className="text-[10px] text-blue-400/60 uppercase tracking-wider mb-2 font-bold">La solución</div>
                    <p className="text-sm text-white/60 leading-relaxed">{c.solucion}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-violet-900/30 border border-violet-700/20">
                    <div className="text-[10px] text-violet-300/60 uppercase tracking-wider mb-2 font-bold">El resultado</div>
                    <p className="font-bold text-violet-300 leading-relaxed">{c.resultado}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTORES */}
      <section className="py-16 bg-gradient-to-b from-[#090714] to-[#0c0916]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4">Sectores donde hemos trabajado</h2>
          <p className="text-white/35 mb-8">Experiencia probada en más de 12 sectores industriales en México.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Tecnología", "Manufactura", "Retail", "Banca & Fintech", "Hospitalidad", "Salud", "Gastronomía", "Logística", "Farmacéutico", "Construcción", "Educación", "Medios"].map(s => (
              <span key={s} className="px-4 py-2 text-sm rounded-xl border border-violet-900/30 text-violet-400/70 bg-violet-950/10">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4">¿Tu empresa puede ser el siguiente caso de éxito?</h2>
          <p className="text-white/35 mb-8">Diagnóstico gratuito de 48h. Te mostramos exactamente qué palancas mover para obtener resultados como estos.</p>
          <Link href="/webs/rrhh/contacto" className="px-10 py-4 font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all">
            Solicitar diagnóstico →
          </Link>
        </div>
      </section>
    </div>
  )
}
