"use client"
import Link from "next/link"
import { servicios } from "../data/index"

export default function BarberiaServicios() {
  return (
    <div className="min-h-screen bg-[#0c0906]">
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-amber-900/8 rounded-full blur-[120px]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-900/20 border border-amber-700/25 text-amber-400 text-xs mb-6 italic">El arte del caballero</div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">Nuestros</span>{" "}
            <span className="bg-gradient-to-r from-amber-400 to-stone-400 bg-clip-text text-transparent italic">servicios</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-lg">Cada servicio es una experiencia. No solo un corte.</p>
        </div>
      </section>

      <section className="pb-28 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servicios.map(s => {
            const Icon = s.icon
            return (
              <div key={s.nombre} className={`p-6 rounded-2xl border ${s.border} ${s.bg} hover:scale-[1.01] transition-all flex flex-col`}>
                {s.popular && <span className="text-[10px] font-bold text-orange-400 mb-2 uppercase tracking-wider">⭐ Más popular</span>}
                <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <h3 className="font-bold text-white mb-1">{s.nombre}</h3>
                <div className="flex gap-3 mb-3 text-xs text-white/30">
                  <span>⏱ {s.duracion}</span>
                  <span className={`font-bold ${s.color}`}>{s.precio}</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed flex-1">{s.desc}</p>
                <Link href="/webs/barberia/contacto" className={`mt-4 flex items-center justify-center py-2.5 rounded-xl font-bold text-sm border ${s.border} ${s.color} hover:brightness-125 transition-all`}>
                  Reservar →
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      <section className="py-16 bg-[#080604]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/35 mb-6 italic">¿Tienes dudas sobre qué servicio elegir?</p>
          <Link href="/webs/barberia/contacto" className="px-8 py-4 font-bold rounded-xl bg-amber-700 hover:bg-amber-600 text-white transition-all shadow-xl shadow-amber-900/30 inline-block">
            Reservar cita
          </Link>
        </div>
      </section>
    </div>
  )
}
