"use client"
import Link from "next/link"
import { agentes, servicios, stats } from "../data/index"

export default function InmobiliariaAgentes() {
  return (
    <div className="min-h-screen bg-[#0d0a04]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-amber-900/6 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6">Especialistas certificados</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Nuestros</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">agentes</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Más de 15 años de experiencia promedio. Especialistas por zona y tipo de propiedad. Todos con certificación vigente.</p>
        </div>
      </section>

      <section className="pb-16 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agentes.map(a => (
            <div key={a.name} className="p-7 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex gap-5">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-2xl font-black text-white shrink-0`}>{a.avatar}</div>
              <div>
                <h3 className="font-bold text-white mb-0.5">{a.name}</h3>
                <p className="text-xs text-amber-400/80 mb-0.5">{a.role}</p>
                <p className="text-[11px] text-white/30 mb-3">{a.specialty}</p>
                <p className="text-xs text-white/40 leading-relaxed">{a.exp}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 bg-[#0a0702]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-black text-white text-center mb-10">Nuestros servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicios.map(s => {
              const Icon = s.icon
              return (
                <div key={s.name} className={`p-6 rounded-2xl border ${s.border} ${s.bg}`}>
                  <Icon className={`w-6 h-6 ${s.color} mb-3`} />
                  <h3 className="font-bold text-white mb-2">{s.name}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0d0a04]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map(s => (
              <div key={s.label} className="p-5 rounded-2xl border border-amber-800/20 bg-amber-950/10 text-center">
                <p className="text-2xl font-black text-amber-400">{s.value}</p>
                <p className="text-xs text-white/30 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-white/35 mb-6">Habla directamente con un especialista en tu zona</p>
            <Link href="/webs/inmobiliaria/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
              Contactar agente
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
